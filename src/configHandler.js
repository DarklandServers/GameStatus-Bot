const fs = require('fs').promises;
const path = require('path');

const CONFIG_DIR = path.join(__dirname, 'config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

async function createDefaultConfig() {
    const defaultConfig = `{
    "maxServers": 5,
    "updateInterval": 3,

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

  //createDefaultConfig();

  async function getConfig() {
    try {
      await fs.access(CONFIG_FILE);
      const configData = await fs.readFile(CONFIG_FILE, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('An error occurred while reading the config file:', error);
      return null;
    }
  }
  
  module.exports = { createDefaultConfig, getConfig };