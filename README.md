<div>
    <img src="https://img.shields.io/badge/Node.js-16.0.9%20%5E-brightgreen.svg?style=for-the-badge&logo=node.js" style="margin-right: 16px;">
    <img src="https://img.shields.io/badge/Discord.js-5865F2.svg?style=for-the-badge&logo=discord&logoColor=white" style="margin-right: 16px;">
</div>
<br><br>
<img src="./assets/server-bot.png">

# GameStatus Bot 🎮

<br>
GameStatus-Bot simplifies server monitoring with real-time player counts, maximum limits, and in-game maps. It uses either the BattleMetrics or Gamedig APIs, making it a versatile tool for gamers and admins. Level up your gameplay with GameStatus-Bot! 🚀🎮
<br><br>
You can run it on windows, macOS, linux or docker, see the installation section for more info.
<br><br>

- gamedig (All games)
- battlemetrics.com (All games)
- Bot update status every 1-3 minutes
- Display Map (Supported games)
- Join Server (Supported games)
- Player notifications to Discord channels

# Configuration 📒

On the first launch, GameStatus-Bot auto-generates the configuration file, streamlining the setup process for users.

`Location: src/config/config.json`

### Default configuration

**Single Server Configuration**

```
{
  "maxServers": 5, //Max amount of servers that can be running
  "updateInterval": 3, //How often to update the status
  "statusPrefix": "Players", // Custom status prefix, leave blank to default to Playing
  "statusSpacer": "|", //Spacer for between the player count and current map

  "SERVERS": [
    {
      "RUNNING": false, //Enable or disable the bot from running
      "serverName": "", //Server name to know what server bot is for
      "botToken": "", //Discord bot token
      "apiType": 1, //Api choice 1 = Battlemetrics, 2 = GameDig
      "apiUrl": "", //Battlemetric url (https://api.battlemetrics.com/servers/YOUR_SERVER_ID)
      "serverIp": "",
      "serverPort": "",
      "queueMessage": "currently waiting in queue.", //Message to display after queue number. (Only available using battlemetrics)
      "gameType": "garrysmod", //Rember the game type
      "showMap": false, //Show the map in status (Only available using gamedig)
      "mapPrefix": "fw", //Remove map prefix if used or leave blank to default
      "debug": false,
      "notificationChannelId": "" //Discord channel ID to send notifications when players are online
    }
  ]
}
```

**Multiple Server Configuration**

```
{
  "maxServers": 5,
  "updateInterval": 3,
  "statusPrefix": "Players",
  "statusSpacer": "|",
  "mapPrefix": "fw",

  "SERVERS": [
    {
      "RUNNING": false,
      "serverName": "",
      "botToken": "",
      "apiType": 1,
      "apiUrl": "",
      "serverIp": "",
      "serverPort": "",
      "queueMessage": "currently waiting in queue.",
      "gameType": "garrysmod",
      "showMap": false,
      "mapPrefix": "fw", //Remove map prefix if used or leave blank to default
      "debug": false,
      "notificationChannelId": "" //Discord channel ID to send notifications when players are online
    },
    {
      "RUNNING": false,
      "serverName": "",
      "botToken": "",
      "apiType": 1,
      "apiUrl": "",
      "serverIp": "",
      "serverPort": "",
      "queueMessage": "currently waiting in queue.",
      "gameType": "garrysmod",
      "showMap": false,
      "mapPrefix": "fw", //Remove map prefix if used or leave blank to default
      "debug": false,
      "notificationChannelId": "" //Discord channel ID to send notifications when players are online
    }
  ]
}
```

# Features 🌟

## Player Notifications

The bot can send notifications to a specified Discord channel when players are online. To use this feature:

1. Find the Discord channel ID where you want to receive notifications (Enable Developer Mode in Discord settings, then right-click on the channel and select "Copy ID")
2. Add the channel ID to the `notificationChannelId` field in your server's configuration
3. The bot will automatically send a message to this channel when players are online

Notifications include:

- Server name
- Current player count and maximum player capacity
- Current map (if map display is enabled)

To prevent spam, notifications are only sent once every 30 minutes when players are detected.

# Discord Setup 🤖

# Installation 🔨
