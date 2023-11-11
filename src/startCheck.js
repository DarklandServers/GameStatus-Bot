const boxen = require('boxen');
const chalk = require('chalk');
const error = chalk.red;
const warning = chalk.hex('#FFA500');
const fs = require('fs');
const path = require('path');

function startCheck() {
    const configFile = fs.readFileSync(path.join(__dirname, 'config', 'config.json'), 'utf8');
    const configData = JSON.parse(configFile);
    const runEnabled = configData.SERVERS.filter(server => server.RUNNING);

    if (runEnabled.length > configData.maxServers) {
        const title = `Server Max ${configData.maxServers}`;
        const message = `You are currently trying to run ${runEnabled.length} servers.\nPlease verify the max servers in config and try again.`;
        console.log('\n' + boxen(message, { title: error.bold(title), titleAlignment: 'center', textAlignment: 'center', padding: 2, borderStyle: 'round' }));
        process.exit();
    }

    if (runEnabled.length === 0) {
        console.log(warning.bold('\nNo servers are marked as running in the configuration.\nPlease update the configuration to start the bots.\n'));
        process.exit();
    }

    const botsLoaded = configData.SERVERS.map(server => {
        const statusIcon = server.RUNNING ? '🟢' : '🔴';
        return `${statusIcon} ${server.serverName} Bot`;
    }).join('\n');

    console.log('\n' + boxen(botsLoaded, { title: chalk.bold('Loading Servers Bots 🤖'), titleAlignment: 'center', padding: 1, borderStyle: 'round' }));
}

module.exports = startCheck;
