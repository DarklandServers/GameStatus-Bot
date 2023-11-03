const fs = require('fs').promises;
const path = require('path');

const CONFIG_DIR = path.join(__dirname, 'config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

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
      "apiType": 1,
      "apiSite": "",
      "serverIp": "",
      "serverPort": "",
      "queueMessage": "currently waiting in queue.",
      "gameType": "garrysmod",
      "showMap": false,
      "debug": false
    }
  ]
}`;
  
    try {
      await fs.access(CONFIG_FILE);
    } catch (err) {
      try {
        await fs.mkdir(CONFIG_DIR, { recursive: true });
        await fs.writeFile(CONFIG_FILE, defaultConfig);
        console.log('Config files were created successfully.');
      } catch (err) {
        console.error('An error occurred while creating config files:', err); 
      }
    }
  }

  module.exports = { createDefaultConfig };