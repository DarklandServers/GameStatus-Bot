const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const request = require('request');
const Gamedig = require('gamedig');

const fs = require('fs').promises;
const path = require('path');

const boxen = require('boxen');
const chalk = require('chalk');

const error = chalk.bold.red;
const warning = chalk.bold.bgKeyword('orange');

const configDir = path.join(__dirname, '../config');
const configFile = path.join(configDir, 'config.json');

/* CONFIG CHECK */
async function createDefaultConfig() {
	const defaultConfig = {
		updateInterval: 3,
		statusPrefix: 'Players',
		mapSpacer: '🗺️',
		SERVERS: [
			{
				RUNNING: false,
				serverName: '',
				botToken: '',
				apiType: 1,
				apiUrl: '',
				serverIp: '',
				serverPort: '',
				queueMessage: '',
				gameType: '',
				showMap: false,
				mapPrefix: [''],
				debug: false,
			},
		],
	};

	try {
		await fs.access(configFile);
	} catch (err) {
		try {
			await fs.mkdir(configDir, { recursive: true });
			await fs.writeFile(configFile, JSON.stringify(defaultConfig, null, 4));
			console.log(chalk.bgGreen.bold('CONFIG FILE CREATED SUCCESSFULLY!!'));
			process.exit(1);
		} catch (err) {
			console.error(
				error('An error occurred while creating config files:'),
				err
			);
		}
	}
}
/* END CONFIG CHECK */

/* GET CONFIG */
async function getConfig() {
	try {
		const configFileData = await fs.readFile(configFile, 'utf8');
		return JSON.parse(configFileData);
	} catch (err) {
		console.error(error('Error reading config file:'), err);
		process.exit(1);
	}
}
/* END GET CONFIG */

/* START CHECK */
async function startCheck(configData) {
	if (configData.updateInterval < 2) {
		console.log(
			warning.bold(
				'Please ensure your update interval is set to a minimum of 2 to avoid being flagged by Discord for spam.'
			)
		);
		process.exit(1);
	}

	if (configData.SERVERS.filter((server) => server.RUNNING).length === 0) {
		console.log(
			warning.bold(
				'No servers are marked as running in the configuration. Please update the configuration to start the bots.'
			)
		);
		process.exit(1);
	}

	const botsLoaded = configData.SERVERS.filter((server) => server.RUNNING)
		.map((server) => `🟢  ${server.serverName} Bot`)
		.join('\n');

	console.log(
		boxen(botsLoaded, {
			title: chalk.green.bold('Loading Servers Bots 🤖'),
			titleAlignment: 'center',
			padding: 1,
			borderStyle: 'round',
		})
	);
}
/* END START CHECK */

async function updateActivity(client, configData, config) {
	try {
		const {
			apiType,
			apiUrl,
			serverIp,
			serverPort,
			gameType,
			showMap,
			mapPrefix,
			queueMessage,
			debug,
		} = config;

		if (apiType === 1) {
			require('tls').DEFAULT_ECDH_CURVE = 'auto';
			request(
				{
					url: apiUrl,
					headers: { json: true, Referer: 'discord-rustserverstatus' },
					timeout: 10000,
				},
				function (err, res, body) {
					if (!err && res.statusCode == 200) {
						const jsonData = JSON.parse(body);
						const server = jsonData.data.attributes;
						if (debug) {
							console.log('Results', jsonData);
						}
						const is_online = server.status;
						if (is_online == 'online') {
							const players = server.players;
							const maxPlayers = server.maxPlayers;
							let status = `${configData.statusPrefix} ${players}/${maxPlayers}`;
							const mapData = server.details.map;
							const mapName = mapData
								? mapData
										.replace(new RegExp(`^(${mapPrefix.join('|')})_`, 'i'), '')
										.replace(/_/g, ' ')
								: 'Unknown Map';
							status += showMap ? ` ${configData.statusSpacer} ${mapName}` : '';
							const queue = server.details.rust_queued_players;
							if (typeof queue !== 'undefined' && queue != '0') {
								status += ` (${queue} ${queueMessage})`;
							}
							//RETURN ONLINE
							return client.user.setPresence({
								activities: [
									{
										name: status,
										type: ActivityType.Custom,
									},
								],
								status: 'online',
							});
						} else {
							//RETURN OFFLINE
							return client.user.setPresence({
								activities: [{ name: 'Offline', type: ActivityType.Custom }],
								status: 'idle',
							});
						}
					}
				}
			);
		} else if (apiType === 2) {
			if (!serverIp || !serverPort) {
				console.log('You have to configure server IP/Port');
				//process.exit(1);
			} else {
				Gamedig.query({
					type: gameType,
					host: serverIp,
					port: serverPort,
				})
					.then((state) => {
						if (debug) {
							console.log(state);
						}
						const players = state.players.length;
						const maxPlayers = state.maxplayers;
						let status = `${configData.statusPrefix} ${players}/${maxPlayers}`;
						const mapData = state.map;
						const mapName = mapData
							? mapData
									.replace(new RegExp(`^(${mapPrefix.join('|')})_`, 'i'), '')
									.replace(/_/g, ' ')
							: 'Unknown Map';
						status += showMap ? ` ${configData.statusSpacer} ${mapName}` : '';
						//RETURN ONLINE
						return client.user.setPresence({
							activities: [
								{
									name: status,
									type: ActivityType.Custom,
								},
							],
							status: 'online',
						});
					})
					.catch(() => {
						//RETURN OFFLINE
						return client.user.setPresence({
							activities: [{ name: 'Offline', type: ActivityType.Custom }],
							status: 'idle',
						});
					});
			}
		} else {
			console.log('invalid API type');
			process.exit(1);
		}
	} catch (err) {
		console.error('An error occurred while updating activity:', err);
	}
}

async function main() {
	await createDefaultConfig();
	const configData = await getConfig();
	await startCheck(configData);

	try {
		const runEnabled = configData.SERVERS.filter((server) => server.RUNNING);
		const updateInterval = 1000 * 60 * configData.updateInterval;

		for (const serverConfig of runEnabled) {
			const botToken = serverConfig.botToken;

			const client = new Client({
				intents: [
					GatewayIntentBits.Guilds,
					GatewayIntentBits.GuildMessages,
					GatewayIntentBits.MessageContent,
				],
			});

			client.on('ready', () => {
				console.log(
					`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`
				);
				updateActivity(client, configData, serverConfig);
				setInterval(
					() => updateActivity(client, configData, serverConfig),
					updateInterval
				);
			});

			client.login(botToken).catch((err) => console.log(error(botToken)));
		}
	} catch (err) {
		console.error('An error occurred:', err);
	}
}

main();
