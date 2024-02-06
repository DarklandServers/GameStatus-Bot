if (apiSite == 3) {
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
					const queue = server.details.rust_queued_players;
					let status = `${players}/${maxplayers}`;
					if (typeof queue !== 'undefined' && queue != '0') {
						status += ` (${queue} ${queueMessage})`;
					}
					if (debug)
						console.log('Updated from battlemetrics, serverid: ' + server.id);
					return client.user.setActivity(status, { type: statusType });
				} else {
					return client.user.setActivity('Offline');
				}
			}
		}
	);
}
