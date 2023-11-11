const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const configDir = path.join(__dirname, 'config');
const configFile = path.join(configDir, 'config.json');

function createDefaultConfig() {
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
      "apiType": 1,
      "apiUrl": "",
      "serverIp": "",
      "serverPort": "",
      "queueMessage": "",
      "gameType": "",
      "showMap": false,
      "mapPrefix": [""],
      "debug": false
    }
  ]
}`;

  try {
    fs.accessSync(configFile);
  } catch (err) {
    try {
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(configFile, defaultConfig);
      console.log(chalk.white.bgGreen.bold('\nConfig files were created successfully!\n'));
      process.exit();
    } catch (err) {
      console.error('An error occurred while creating config files:', err);
    }
  }
}

module.exports = createDefaultConfig;
