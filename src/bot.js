const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const request = require('request');
const Gamedig = require('gamedig');
const fs = require('fs');
const path = require('path');
const createDefaultConfig = require('./configHandler');
const startCheck = require('./startCheck');

createDefaultConfig();
startCheck();

try {
	const configData = JSON.parse(
		fs.readFileSync(path.join(__dirname, 'config', 'config.json'), 'utf8')
	);
	const runEnabled = configData.SERVERS.filter((server) => server.RUNNING);
	const updateInterval = 1000 * 60 * configData.updateInterval;

	for (var i = 0; i < runEnabled.length; i++) {
		function updateActivity() {
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
							const is_online = server.status;
							if (is_online == 'online') {
								const players = server.players;
								const maxplayers = server.maxPlayers;
								const map = server.details.map;
								const queue = server.details.rust_queued_players;
								let status = `${players}/${maxplayers}`;
								if (typeof queue !== 'undefined' && queue != '0') {
									status += ` (${queue} ${queueMessage})`;
								}
								if (debug)
									console.log(
										'Updated from Battlemetrics, serverID: ' + server.id
									);
								//RETURN ONLINE
								return client.user.setPresence({
									activities: [
										{
											name: `${configData.statusPrefix} ${status}`,
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
					process.exit();
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
							const players = state.raw.numplayers;
							const maxplayers = state.maxplayers;
							let status = `${players}/${maxplayers}`;
							const mapData = state.map;
							const mapName = mapData
								.replace(new RegExp(`^(${mapPrefix.join('|')})_`, 'i'), '')
								.replace(/_/g, ' ');
							status = showMap
								? `${players}/${maxplayers} ${configData.statusSpacer} ${mapName}`
								: `${players}/${maxplayers}`;
							//RETURN ONLINE
							return client.user.setPresence({
								activities: [
									{
										name: `${configData.statusPrefix} ${status}`,
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
				process.exit();
			}
		} /* STAT UPDATE END */

		var config = runEnabled[i];
		const {
			botToken,
			apiType,
			apiUrl,
			serverIp,
			serverPort,
			queueMessage,
			showMap,
			mapPrefix,
			gameType,
			debug,
		} = config;

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
			updateActivity();
			setInterval(updateActivity, updateInterval);
		});

		client.on('guildCreate', (guild) => {
			console.log(
				`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`
			);
		});

		client.on('guildDelete', (guild) => {
			console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
		});

		client.on('error', function (error) {
			if (debug) console.log(error);
		});

		process.on('unhandledRejection', (error) => {
			if (error.code == 'TOKEN_INVALID')
				return console.log(
					'Error: An invalid token was provided.\nYou have maybe added client secret instead of BOT token.\nPlease set BOT token'
				);

			return console.error('Unhandled promise rejection:', error);
		});

		client.login(botToken);
	} /* END OF FOR LOOP */
} catch (err) {
	console.error('An error occurred:', err);
} /* END OF TRY */
