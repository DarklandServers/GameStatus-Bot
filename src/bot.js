const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const DiscordRPC = require('discord-rpc');
const boxen = require('boxen');
const chalk = require('chalk');
const log = console.log;
const error = chalk.red;
const warning = chalk.hex('#FFA500');
const request = require('request')
const Gamedig = require('gamedig')
const fs = require('fs').promises;
const path = require('path');
const { createDefaultConfig } = require('./configHandler');
const RPC = new DiscordRPC.Client({ transport: 'ipc' });

async function startBots() {

    const configFile  = await fs.readFile(path.join(__dirname, 'config', 'config.json'), 'utf8');
    const configData  = JSON.parse(configFile );
    const servers = configData.SERVERS;
    const runningServers = servers.filter(server => server.RUNNING);
    const updateInterval = (1000 * 60) * configData.updateInterval;

    try {      
        if (runningServers.length > configData.maxServers) {
            const message = `You are currently trying to run ${servers.length} servers.\nPlease verify the max servers in config and try again.`
            log('\n' + boxen(message, { title: error.bold('Server Max'), titleAlignment: 'center', textAlignment: 'center', padding: 1, borderStyle: 'round' }));
            return;
        }
      
        if (runningServers.length === 0) {
            log(warning.bold('\nNo servers are marked as running in the configuration.\nPlease update the configuration to start the bots.\n'));
            return;
        }
    
        const botsLoaded = servers.map(server => {
            const statusIcon = server.RUNNING ? '🟢' : '🔴';         
            return `${statusIcon} ${server.serverName} Bot`;
        }).join('\n');
       
        log('\n' + boxen(botsLoaded, { title: chalk.bold('Loading Servers Bots 🤖'), titleAlignment: 'center', padding: 1, borderStyle: 'round' }));

        for (var i = 0; i < runningServers.length; i++) {
            function updateActivity() {
                if (apiType == 1) {
                    require('tls').DEFAULT_ECDH_CURVE = 'auto'
                    request({ url: apiUrl, headers: { json: true, Referer: 'discord-rustserverstatus' }, timeout: 10000 }, function (err, res, body) {
                        if (!err && res.statusCode == 200) {
                            const jsonData = JSON.parse(body)
                            const server = jsonData.data.attributes
                            const is_online = server.status
                            if (is_online == 'online') {
                                const players = server.players
                                const maxplayers = server.maxPlayers
                                const queue = server.details.rust_queued_players
                                let status = `${players}/${maxplayers}`
                                if (typeof queue !== 'undefined' && queue != '0') {
                                    status += ` (${queue} ${queueMessage})`
                                }
                                if (debug) console.log('Updated from battlemetrics, serverid: ' + server.id)
                                return client.user.setPresence({ activities: [{ name: `${configData.statusPrefix} ${status}`, type: ActivityType.Custom}], status: 'online'});
                            } else {
                                return client.user.setPresence({ activities: [{ name: 'Offline' }], status: 'idle'});
                            }
                        }
                    })
                } else if (apiType == 2) {
                    if (!serverIp || !serverPort) {
                        console.log('You have to configure serverIP/port')
                        process.exit()
                    } else {
                        Gamedig.query({
                            type: 'rust',
                            host: serverIp,
                            port: serverPort
                        }).then((state) => {
                            if (debug) { console.log(state); }
                            const players = state.raw.numplayers;
                            const maxplayers = state.maxplayers;
                            let mapData = state.map;
                            const prefixRegex = new RegExp(mapPrefix, 'i');
                            mapData = mapData.replace(prefixRegex, '').replace(/_/g, ' ');
                            let status;
                            if (showMap) {
                                status = `${players}/${maxplayers} ${configData.statusSpacer} ${mapData}`;
                            } else {
                                status = `${players}/${maxplayers}`;
                            }
                            return client.user.setPresence({ activities: [{ name: `${configData.statusPrefix} ${status}`, type: ActivityType.Custom}], status: 'online'});
                        }).catch((error) => {
                            return client.user.setPresence({ activities: [{ name: 'Offline' }], status: 'idle'});
                        });
                    }                
                }
            } /* END OF ACTIVITY FUNC */

            var config = runningServers[i];
            const { botAppId, botUserId, rpcEnable, botToken, apiType, apiUrl, serverIp, serverPort, queueMessage, showMap, mapPrefix, debug } = config;

            const client = new Client({
                intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                ]
            });
            
            client.on('ready', () => {
                console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`)
                updateActivity();
                setInterval(function () {
                    updateActivity()
                }, updateInterval)
            })

            client.on('guildCreate', guild => {
                console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`)
            })
                
            client.on('guildDelete', guild => {
                console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`)
            })
                
            client.on('error', function (error) {
                if (debug) console.log(error)
            })
        
            process.on('unhandledRejection', error => {
                if (error.code == 'TOKEN_INVALID') 
                    return console.log('Error: An invalid token was provided.\nYou have maybe added client secret instead of BOT token.\nPlease set BOT token')
                
                return console.error('Unhandled promise rejection:', error);
            });
            
            client.login(botToken)

            //DiscordRPC.register(botAppId);
        
            RPC.on('ready', async () => {
                console.log("RPC STARTED");
                updateActivity()
            
                setInterval(() => {
                    updateActivity()
                }, updateInterval)
            })

            //RPC.login({ clientId: botAppId});

        } /* END OF FOR LOOP */
    } catch (err) { console.error('An error occurred:', err); } /* END OF TRY */
} startBots();