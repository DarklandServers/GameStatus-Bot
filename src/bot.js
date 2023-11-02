const { Client, GatewayIntentBits } = require('discord.js');
const request = require('request')
const Gamedig = require('gamedig');
const boxen = require('boxen');
const { createDefaultConfig, getConfig } = require('./configHandler');

async function startCheck() {
    try {
      if (config) {
        const config = await getConfig();
        const runningServers = config.SERVERS.filter(server => server.RUNNING);

        if (runningServers.length > config.maxServers) {
          console.log("Max servers is over " + config.maxServers)
          console.log("Please verify max servers and try again")
          process.exit()
        }
        startBots();
      }
    } catch (err) {
      await createDefaultConfig();
      process.exit()
    }
}



startCheck();