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

# Configuration 📒

On the first launch, GameStatus-Bot auto-generates the configuration file, streamlining the setup process for users.

`Location: src/config/config.json`

### Default configuration

```
{
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
      "gameType": "",
      "showMap": false,
      "debug": false
    }
  ]
}
```
