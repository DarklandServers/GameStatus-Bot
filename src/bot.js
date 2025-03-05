import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import boxen from 'boxen';
import chalk from 'chalk';
import { GameDig } from 'gamedig';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Constants for styling console output
const ERROR = chalk.bold.red;
const WARNING = chalk.bold.bgYellow;
const SUCCESS = chalk.bgGreen.bold;

// Configuration paths
const CONFIG_DIR = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'../config'
);
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Minimum update interval to avoid Discord rate limits
const MIN_UPDATE_INTERVAL = 2;

/**
 * Creates a default configuration file if one doesn't exist
 * @returns {Promise<void>}
 */
async function createDefaultConfig() {
	const defaultConfig = {
		updateInterval: 3,
		notificationCooldown: 30,
		statusPrefix: 'Players',
		statusSpacer: '🗺️',
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
				playerBots: false,
				debug: false,
			},
		],
	};

	try {
		await fs.access(CONFIG_FILE);
	} catch (err) {
		try {
			await fs.mkdir(CONFIG_DIR, { recursive: true });
			await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 4));
			console.log(SUCCESS('CONFIG FILE CREATED SUCCESSFULLY!!'));
			process.exit(1);
		} catch (err) {
			console.error(
				ERROR('An error occurred while creating config files:'),
				err
			);
		}
	}
}

/**
 * Reads and parses the configuration file
 * @returns {Promise<Object>} The parsed configuration data
 */
async function getConfig() {
	try {
		const configFileData = await fs.readFile(CONFIG_FILE, 'utf8');
		return JSON.parse(configFileData);
	} catch (err) {
		console.error(ERROR('Error reading config file:'), err);
		process.exit(1);
	}
}

/**
 * Validates configuration and displays startup information
 * @param {Object} configData - The configuration data
 * @returns {Promise<void>}
 */
async function startCheck(configData) {
	if (configData.updateInterval < MIN_UPDATE_INTERVAL) {
		console.log(
			WARNING(
				`Please ensure your update interval is set to a minimum of ${MIN_UPDATE_INTERVAL} to avoid being flagged by Discord for spam.`
			)
		);
		process.exit(1);
	}

	const allServers = configData.SERVERS;
	const runningServers = allServers.filter((server) => server.RUNNING);

	if (runningServers.length === 0) {
		console.log(
			WARNING(
				'No servers are marked as running in the configuration. Please update the configuration to start the bots.'
			)
		);
		process.exit(1);
	}

	const botsStatus = allServers
		.map(
			(server) => `${server.RUNNING ? '🟢' : '🔴'}  ${server.serverName} Bot`
		)
		.join('\n');

	console.log(
		boxen(botsStatus, {
			title: chalk.green.bold('Loading Servers Bots 🤖'),
			titleAlignment: 'center',
			padding: 1,
			borderStyle: 'round',
		})
	);
}

/**
 * Formats the map name by removing prefixes and replacing underscores
 * @param {string} mapData - Raw map data
 * @param {Array<string>} mapPrefix - Prefixes to remove
 * @returns {string} Formatted map name
 */
function formatMapName(mapData, mapPrefix) {
	if (!mapData) return 'Unknown Map';

	return mapData
		.replace(new RegExp(`^(${mapPrefix.join('|')})_`, 'i'), '')
		.replace(/_/g, ' ');
}

/**
 * Gets the player count to display, applying the playerBots setting if needed
 * @param {number} actualPlayers - The actual number of players on the server
 * @param {boolean} playerBots - Whether to show fake players when the server is empty
 * @returns {number} The player count to display
 */
function getDisplayPlayerCount(actualPlayers, playerBots) {
	// If there are actual players or playerBots is disabled, return the actual count
	if (actualPlayers > 0 || !playerBots) {
		return actualPlayers;
	}

	// If playerBots is enabled and there are no actual players,
	// return a random number between 1 and 3
	return Math.floor(Math.random() * 5); // Returns a random number between 0 and 4
}

/**
 * Updates the Discord bot's activity status based on server information
 * @param {Client} client - Discord.js client
 * @param {Object} configData - Global configuration
 * @param {Object} config - Server-specific configuration
 * @returns {Promise<void>}
 */
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
			playerBots,
		} = config;

		if (apiType === 1) {
			// API Type 1: Custom API endpoint
			try {
				// Create an AbortController with a timeout
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 10000);

				const response = await fetch(apiUrl, {
					headers: {
						Accept: 'application/json',
						Referer: 'discord-rustserverstatus',
					},
					signal: controller.signal,
				});

				// Clear the timeout to prevent memory leaks
				clearTimeout(timeoutId);

				if (!response.ok) {
					console.log(`API returned status: ${response.status}`);
					return setOfflineStatus(client);
				}

				const jsonData = await response.json();
				const server = jsonData.data.attributes;

				if (debug) {
					console.log('Results', jsonData);
				}

				const isOnline = server.status === 'online';

				if (!isOnline) {
					return setOfflineStatus(client);
				}

				const actualPlayers = server.players;
				const displayPlayers = getDisplayPlayerCount(actualPlayers, playerBots);
				const maxPlayers = server.maxPlayers;
				const mapData = server.details.map;
				const mapName = formatMapName(mapData, mapPrefix);

				let status = `${configData.statusPrefix} ${displayPlayers}/${maxPlayers}`;

				if (showMap) {
					status += ` ${configData.statusSpacer} ${mapName}`;
				}

				const queue = server.details.rust_queued_players;
				if (queue && queue !== '0') {
					status += ` (${queue} ${queueMessage})`;
				}

				return setOnlineStatus(client, status);
			} catch (error) {
				console.error('Error fetching API data:', error);
				return setOfflineStatus(client);
			}
		} else if (apiType === 2) {
			// API Type 2: GameDig query
			if (!serverIp || !serverPort) {
				console.log(ERROR('You have to configure server IP/Port'));
				return;
			}

			try {
				const state = await GameDig.query({
					type: gameType,
					host: serverIp,
					port: serverPort,
				});

				if (debug) {
					console.log(state);
				}

				const actualPlayers = state.players.length;
				const displayPlayers = getDisplayPlayerCount(actualPlayers, playerBots);
				const maxPlayers = state.maxplayers;
				const mapData = state.map;
				const mapName = formatMapName(mapData, mapPrefix);

				let status = `${configData.statusPrefix} ${displayPlayers}/${maxPlayers}`;

				if (showMap) {
					status += ` ${configData.statusSpacer} ${mapName}`;
				}

				return setOnlineStatus(client, status);
			} catch (error) {
				if (debug) {
					console.error('GameDig query error:', error);
				}
				return setOfflineStatus(client);
			}
		} else {
			console.log(ERROR('Invalid API type'));
			process.exit(1);
		}
	} catch (err) {
		console.error(ERROR('An error occurred while updating activity:'), err);
		setOfflineStatus(client);
	}
}

/**
 * Sets the bot's status to online with the provided status message
 * @param {Client} client - Discord.js client
 * @param {string} status - Status message to display
 * @returns {Promise<void>}
 */
function setOnlineStatus(client, status) {
	return client.user.setPresence({
		activities: [
			{
				name: status,
				type: ActivityType.Custom,
			},
		],
		status: 'online',
	});
}

/**
 * Sets the bot's status to offline/idle
 * @param {Client} client - Discord.js client
 * @returns {Promise<void>}
 */
function setOfflineStatus(client) {
	return client.user.setPresence({
		activities: [{ name: 'Offline', type: ActivityType.Custom }],
		status: 'idle',
	});
}

/**
 * Main function to initialize and run the bot
 * @returns {Promise<void>}
 */
async function main() {
	try {
		await createDefaultConfig();
		const configData = await getConfig();
		await startCheck(configData);

		const runningServers = configData.SERVERS.filter(
			(server) => server.RUNNING
		);
		const updateInterval = 1000 * 60 * configData.updateInterval;

		for (const serverConfig of runningServers) {
			const botToken = serverConfig.botToken;

			if (!botToken) {
				console.error(
					ERROR(`Missing bot token for server: ${serverConfig.serverName}`)
				);
				continue;
			}

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

				// Initial status update
				updateActivity(client, configData, serverConfig);

				// Set up interval for regular updates
				setInterval(
					() => updateActivity(client, configData, serverConfig),
					updateInterval
				);
			});

			client.on('error', (err) => {
				console.error(
					ERROR(`Discord client error for ${serverConfig.serverName}:`),
					err
				);
			});

			try {
				await client.login(botToken);
			} catch (loginErr) {
				console.error(
					ERROR(
						`Failed to login with token for server ${serverConfig.serverName}:`
					),
					loginErr
				);
			}
		}
	} catch (err) {
		console.error(ERROR('An error occurred in main function:'), err);
		process.exit(1);
	}
}

// Start the application
main();
