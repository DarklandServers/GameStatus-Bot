const fs = require('fs').promises;
const path = require('path');


const configDir = path.join(__dirname, 'config');
const configFile = path.join(configDir, 'config.json');

async function createDefaultConfig() {
    const defaultConfig = `{
  "maxServers": 5,
  "updateInterval": 3,
  "statusPrefix": "Players",
  "statusSpacer": "|",

  "SERVERS": [
    {
      "RUNNING": false,
      "serverName": "",
      "botToken": "",
      "botAppId": "",
      "botUserId": "",
      "rpcEnable": false,
      "apiType": 1,
      "apiUrl": "",
      "serverIp": "",
      "serverPort": "",
      "queueMessage": "",
      "gameType": "",
      "showMap": false,
      "mapPrefix": "",
      "debug": false
    }
  ]
}`;
  
    try {
      await fs.access(configFile);
    } catch (err) {
      try {
        await fs.mkdir(configDir, { recursive: true });
        await fs.writeFile(configFile, defaultConfig);
        console.log(chalk.white.bgGreen.bold('\nConfig files were created successfully!\n'));
      } catch (err) {
        console.error('An error occurred while creating config files:', err); 
      }
    }
  }

  module.exports = { createDefaultConfig };
