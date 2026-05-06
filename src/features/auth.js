// Authentication with Discord and Twitch
import { checkAuth, getPlusId } from './backend.js';
import { $log, $get, $set } from './common.js';
export var plusAuthId = $get('chat+id', null);
export var plusUserId = -1;

if (plusUserId === -1)
	plusUserId = await getPlusId(plusAuthId);

export async function discordLogin() {
	const discordWindow = window.open(
		`https://discord.com/api/oauth2/authorize?client_id=${encodeURIComponent('688126093424721954')}&redirect_uri=${encodeURIComponent(`${window.location.protocol}//${window.location.host}/?login=discord`)}&response_type=token&scope=identify&prompt=consent`
		,'Discord'
		,`width=400,height=500,left=${(window.screen.width / 2) - (400 / 2)},top=${(window.screen.height / 2) - (500 / 2)},resizable=no,scrollbars=yes,status=yes`
	);

	return new Promise((resolve) => {
		const tokenCheck = setInterval(async () =>{
			try {
				if (discordWindow.location.href.includes('access_token')) {
					clearInterval(tokenCheck);
					const params = new URLSearchParams(discordWindow.location.hash.slice(1));
					const token = params.get(`access_token`);
					discordWindow.close();

					const user = await checkAuth(`https://discord.com/api/users/@me`, token);
					plusAuthId = user.id;
					$set(`chat+id`, user.id);

					resolve({
						expiration: Date.now() + 7 * 24 * 3600 * 1000,
						service: `discord`,
						token: token,
						username: user.username
					});
				}
			} catch (e) {}
		}, 100);
	})
}

export async function twitchLogin() {
	const twitchWindow = window.open(
		`https://auth.twitch.tv/authorize?client_id=6l484vmhkx7pri37va2qxgh3346qiq&redirect_uri=https%3A%2F%2Fjklm.fun%2F%3Flogin%3Dtwitch&response_type=token&force_verify=true`
		,'Twitch'
		,`width=400,height=500,left=${(window.screen.width / 2) - (400 / 2)},top=${(window.screen.height / 2) - (500 / 2)},resizable=no,scrollbars=yes,status=yes`
	);

	return new Promise((resolve) => {
		const tokenCheck = setInterval(async () => {
			try {
				if (twitchWindow.location.href.includes('access_token')) {
					clearInterval(tokenCheck);
					const params = new URLSearchParams(twitchWindow.location.hash.slice(1));
					const token = params.get(`access_token`);
					twitchWindow.close();

					const user = await checkAuth(`https://id.twitch.tv/oauth2/validate`, token);
					plusAuthId = user.user_id;
					$set(`chat+id`, user.user_id);

					resolve({
						expiration: Date.now() + 7 * 24 * 3600 * 1000,
						service: `twitch`,
						token: token,
						username: user.login
					});
				}
			} catch (e) {}
		}, 100);
	})
}
