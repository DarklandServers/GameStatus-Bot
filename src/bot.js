const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const DiscordRPC = require('discord-rpc');
const RPC = new DiscordRPC.Client({ transport: 'ipc' });
const request = require('request')
const Gamedig = require('gamedig')
const fs = require('fs');
const path = require('path');
const createDefaultConfig = require('./configHandler');
const startCheck = require('./startCheck');

    createDefaultConfig();
    startCheck();

    try {

        const configData = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'config.json'), 'utf8'));
        const runEnabled = configData.SERVERS.filter(server => server.RUNNING);
        const updateInterval = (1000 * 60) * configData.updateInterval;

        for(var i = 0; i < runEnabled.length; i++) { 

            var config = runEnabled[i];
            const { botAppId, botUserId, rpcEnable, botToken, apiType, apiUrl, serverIp, serverPort, queueMessage, showMap, mapPrefix, gameType, debug } = config;

            function updateActivity() {
                return new Promise((resolve) => {
                    if (apiType === 1) {
                        require('tls').DEFAULT_ECDH_CURVE = 'auto'
                        request({ url: apiUrl, headers: { json: true}, timeout: 10000 }, function (err, res, body) {
                            if (!err && res.statusCode == 200) {
                                const jsonData = JSON.parse(body);
                                const server = jsonData.data.attributes;
                                const is_online = server.status;
                                if (is_online == 'online') {
                                    const status = 'online';
                                    const players = server.players;
                                    const maxplayers = server.maxPlayer;
                                    /* const queue = server.details.rust_queued_players;
                                    if (typeof queue !== 'undefined' && queue != '0') {
                                        statusTitle += ` (${queue} ${queueMessage})`;
                                    } */
                                    if (debug) console.log('Updated from Battlemetrics, serverID: ' + server.id);
                                    //RETURN ONLINE
                                    resolve({ players, maxplayers, mapName: null, status });
                                } else {
                                    const status = 'idle'
                                    const statusTitle = 'Offline'
                                    resolve({ statusTitle, status });
                                } 
                            }
                        });
                    } else if (apiType === 2) {
                        if (!serverIp || !serverPort) {
                            console.log('You have to configure server IP/Port')
                            process.exit();
                        } else {
                            Gamedig.query({
                                type: gameType,
                                host: serverIp,
                                port: serverPort
                            }).then((state) => {
                                if (debug) { console.log(state); }
                                const status = 'online'
                                const players = state.raw.numplayers;
                                const maxplayers = state.maxplayers;
                                const mapData = state.map;
                                const mapName = mapData.replace(new RegExp(`^(${mapPrefix.join('|')})_`, 'i'),'').replace(/_/g, ' ');
                                //RETURN ONLINE
                                resolve({ players, maxplayers, mapName, status });
                            }).catch(() => {
                                const status = 'idle'
                                const statusTitle = 'Offline'
                                resolve({ statusTitle, status });
                            });                    
                        }
                    } else {
                        console.log('invalid API type');
                        process.exit();                     
                    }
                });
            } /* STAT UPDATE END */

            async function statusUpdate() {
                try {
                    const { players, maxplayers, mapName, status } = await updateActivity();
                    const statusTitle = showMap ? `${players}/${maxplayers} ${configData.statusSpacer} ${mapName}` : `${players}/${maxplayers}`;                               
                    client.user.setPresence({ activities: [{ name: `${configData.statusPrefix} ${statusTitle}`, type: ActivityType.Custom}], status: `${status}`});

                    if (!RPC) return

                    if (RPC.user.id === botUserId) {
                        RPC.setActivity({
                            details: `${players}/${maxplayers}`,
                            state: `${mapName}`,

                        })
                    }

                } catch (err) { console.error('An error occurred:', err); }
            }

            const client = new Client({
                intents: [
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.MessageContent,
                ]
            });

            client.once('ready', () => {
                statusUpdate();
                setInterval(statusUpdate, updateInterval);
            });
                        
            client.on('error', err => {
                if (debug) console.error(error(err))
                });
                
            process.on('unhandledRejection', err => {
                if (err.code == 'TOKEN_INVALID') 
                    return console.error('Error: An invalid token was provided.\nYou may have added a client secret instead of a BOT token.\nPlease set the BOT token.');
                
                return console.error('Unhandled promise rejection:', err);
            });

            DiscordRPC.register(botAppId);
            client.login(botToken)
            RPC.login({ clientId: botAppId });
        
        } /* END OF FOR LOOP */ 
    } catch (err) { console.error('An error occurred:', err); } /* END OF TRY */
