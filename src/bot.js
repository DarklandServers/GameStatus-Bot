const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const boxen = require('boxen');
const request = require('request')
const Gamedig = require('gamedig')
const fs = require('fs/promises');
const path = require('path');

const { createDefaultConfig } = require('./configHandler');

async function startBots() {
  try {
    await createDefaultConfig();

    const CONFIG_FILE = await fs.readFile(path.join(__dirname, 'config', 'config.json'), 'utf8');
    const CONFIG_DATA = JSON.parse(CONFIG_FILE);

    const runningServers = CONFIG_DATA.SERVERS.filter((servers) => servers.RUNNING);
    const updateInterval = (1000 * 60) * CONFIG_DATA.updateInterval;

    if (runningServers.length > CONFIG_DATA.maxServers) {
      console.log("Max servers is over " + CONFIG_DATA.maxServers)
      console.log("Please verify max servers and try again")
      return;
      }

    if (runningServers.length === 0) {
      console.log('No servers are marked as running in the configuration.\nPlease update the configuration to start the bots.');
      return;
    };

    let botsLoaded = '';
    CONFIG_DATA.SERVERS.forEach((servers, index) => {
      const statusIcon = servers.RUNNING ? '🟢' : '🔴';
      botsLoaded += `${statusIcon} ${servers.serverName} Bot`;
      if (index < CONFIG_DATA.SERVERS.length - 1) {
        botsLoaded += '\n';
      }
    });
    
    console.log('\n' + boxen(botsLoaded, { title: 'Loading Servers Bots', titleAlignment: 'center', padding: 1, borderStyle: 'round' }));

    for (var i = 0; i < runningServers.length; i++) {

      function updateActivity() {
          if (apiType == 1) {
              require("tls").DEFAULT_ECDH_CURVE = "auto"
              request({ url: apiUrl, headers: { json: true, Referer: 'discord-rustserverstatus' }, timeout: 10000 }, function (err, res, body) {
                  if (!err && res.statusCode == 200) {
                      const jsonData = JSON.parse(body)
                      const server = jsonData.data.attributes
                      const is_online = server.status
                      if (is_online == "online") {
                          const players = server.players
                          const maxplayers = server.maxPlayers
                          const queue = server.details.rust_queued_players
                          let status = `${players}/${maxplayers}`
                          if (typeof queue !== "undefined" && queue != "0") {
                              status += ` (${queue} ${queueMessage})`
                          }
                          if (debug) console.log("Updated from battlemetrics, serverid: " + server.id)
                          return client.user.setActivity(CONFIG_DATA.statusPrefix + " " + status, { type: ActivityType.Custom, name: 'custom'})
                      } else {
                          return client.user.setActivity("Offline")
                      }
                  }
              })
          }
          if (apiType == 2) {
              if (!serverIp || !serverPort) {
                  console.log("You have to configure serverIP/port")
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
                      const prefixRegex = new RegExp(CONFIG_DATA.mapPrefix, 'i');
                      mapData = mapData.replace(prefixRegex, "").replace(/_/g, " ");
                      let status;
                      if (showMap) {
                          status = `${players}/${maxplayers} ${CONFIG_DATA.statusSpacer} ${mapData}`;
                      } else {
                          status = `${players}/${maxplayers}`;
                      }
                      return client.user.setActivity(CONFIG_DATA.statusPrefix + " " + status, { type: ActivityType.Custom, name: 'custom'})
                  }).catch((error) => {
                      console.log("Server is offline");
                      return client.user.setActivity("Offline")
                  });
              }
          }
      }

      var config = runningServers[i];

      const client = new Client({
          intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          ]
      });

      const {
        debug,
        showMap,
        apiUrl,
        apiType,
        serverIp,
        serverPort,
        queueMessage,
        statusType,
      } = config;

      client.on("ready", () => {
          console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`)
          updateActivity()
          setInterval(function () {
              updateActivity()
          }, updateInterval)
      })

      client.on("guildCreate", guild => {
      console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`)
      })
      
      client.on("guildDelete", guild => {
      console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`)
      })
      
      client.on('error', function (error) {
      if (debug) console.log(error)
      })

      process.on('unhandledRejection', error => {
          if (error.code == 'TOKEN_INVALID') 
              return console.log("Error: An invalid token was provided.\nYou have maybe added client secret instead of BOT token.\nPlease set BOT token")
          
          return console.error('Unhandled promise rejection:', error);
      });
      
      client.login(config.botToken)
    } 
  } catch (err) {
    console.error('An error occurred:', err);
  }
}

startBots();