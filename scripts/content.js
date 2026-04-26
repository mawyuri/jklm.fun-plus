const TESTING_MODE = false;

var plusEndpoint = TESTING_MODE ? 'http://localhost/jklmplus' : 'https://mawyuri.alwaysdata.net';
var plusId = localStorage.getItem('chat+id');
var myPlusId = -1;

var inGame = false;
var inPrivate = false;

const win = window;
const doc = document;
const log = (x) => console.log(x);
const n = (e) => doc.createElement(e);
const $a = (a, b) => {if (typeof(a) === 'string') return doc.querySelectorAll(a);else if(b != null) return a.querySelectorAll(b);return a}
function getRelativeTime(e){let n=new Intl.RelativeTimeFormat("en",{timeZone:"UTC",numeric:"auto"}),o=e-Math.floor(Date.now()/1e3);for(let s of[{name:"year",seconds:31536e3},{name:"month",seconds:2628e3},{name:"day",seconds:86400},{name:"hour",seconds:3600},{name:"minute",seconds:60},{name:"second",seconds:1}])if(Math.abs(o)>=s.seconds||"second"===s.name){let a=Math.round(o/s.seconds);return n.format(a,s.name)}}

try {
	$('a') // Check if content is running in the MAIN world
} catch {
	const script = n('script');
	script.src = chrome.runtime.getURL('scripts/content.js');
	(doc.body).appendChild(script);
}

log("Jarvis, I'm in.");

const body = $('body');
body.addEventListener('click', (event) =>{
	if (event.button === 1){
		event.preventDefault();
		return false;
	}
});

const readiness = new Promise((res) => {
	var observer = new MutationObserver((mutations, o) => {
		for (var mutation of mutations) {
			if (mutation.type === "childList") {
				mutation.addedNodes.forEach(node => {
					if ($('a.settings') != null){
						inGame = true;
						o.disconnect();
						res();
					}

					if (location.pathname.slice(1) === '') {
						o.disconnect();
						res();
					}
				})
			}
		}
	});
	observer.observe(body, {childList:true,subtree:true});
});

function getPlusToken() {
	if (localStorage.getItem('chat+token') === 'null' || localStorage.getItem('chat+token') === null) {
		var array = new Uint8Array(16);
		window.crypto.getRandomValues(array);

		var tokenGen = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
		localStorage.setItem('chat+token', tokenGen);

		return tokenGen
	}else {
		return localStorage.getItem('chat+token');
	}
}

async function ready() {
	await readiness;
	if (!settings.auth)
		plusId = null;

	if (plusId === 'null' || plusId === null) {
		if (localStorage.getItem('jklmSettings')) {
			var jklmSettings = JSON.parse(localStorage.getItem('jklmSettings'));
			if (jklmSettings.auth) {
				var auth = jklmSettings.auth;
				var service = auth.service;
				var token = auth.token;

				if (service == `discord`) {
					var response = await fetch(`https://discord.com/api/v10/users/@me`, {
						method: 'GET',
						headers: { Authorization: `Bearer ${token}` }
					})
					var data = await response.json()
					//log(data);
					if (data.id) {
						plusId = data.id;
						localStorage.setItem('chat+id', plusId);
					}
				} else if (service == `twitch`) {
					var response = await fetch(`https://id.twitch.tv/oauth2/validate`, {
						method: 'GET',
						headers: { Authorization: `Bearer ${token}` }
					})
					var data = await response.json();
					//log(data);
					if (data.user_id) {
						plusId = data.user_id;
						localStorage.setItem('chat+id', plusId);
					}
				}
			} else {
				plusId = null;
				localStorage.setItem('chat+id', null);
			}
		}
	}

	if (plusId !== 'null') {
		var response = await fetch(`${plusEndpoint}/getid.php?auth=${plusId}`);
		var data = await response.json()
		if (data.id)
			myPlusId = data.id;
	}

	log("Jarvis, I'm ready.");
}

function ping(mpi){
	if (!settings.auth || mpi === null) {
		return;
	}
	fetch(`${plusEndpoint}/ping.php`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			id: mpi,
			service: settings.auth.service,
			token: getPlusToken(),
			room: inGame ? ($('.roomCode').innerText === '●●●●' ? 'a private room' : location.pathname.slice(1, 5)) : null
		})
	})
}

ready().then(() => {

	if (!inGame) {
		//*$('form.setNickname.box > div:nth-child(2) > button')

		var { picture, nickname, auth } = settings
		var pictureUrl = 'data:image/jpeg;base64,' + picture

		var authService = 'guest'
		var authUsername = ''

		var prvNickname = nickname;
		var prvPictureURL = picture;

		if (auth !== null) {
			authService = auth.service
			authUsername = auth.username
		}

		const authServices = {
			'guest': {pictureUrl: 'images/auth/guest.png', name: 'Guest'},
			'discord': {pictureUrl: 'images/auth/discord.png', name: 'Discord'},
			'twitch': {pictureUrl: 'images/auth/twitch.png', name: 'Twitch'},
			'jklm': {pictureUrl: 'images/auth/jklm.png', name: 'JKLM.fun'}
		}

		function partyPlusSetting(option, def) {
			return localStorage.getItem(`partyplus_settings-${option}`, def) ?? def;
		}

		function updateAuth() {
			picture = settings.picture
			nickname = settings.nickname
			auth = settings.auth

			if (auth !== null) {
				authService = auth.service
				authUsername = auth.username
			} else {
				authService = 'guest'
				authUsername = ''
			}

			const currentService = $("div.top img.service")
			currentService.src = authServices[authService].pictureUrl
			currentService.alt = authServices[authService].name

			const currentName = $('div.top span.nickname')
			currentName.textContent = nickname

			const currentPicture = $('div.top .picture')
			if (picture !== null) {
				pictureUrl = 'data:image/jpeg;base64,' + picture
				currentPicture.style.backgroundImage = `url("${pictureUrl}")`
			}

			localStorage.setItem("jklmSettings", JSON.stringify(settings));
		}

		updateAuth();

		function createModal(id) {
			const thisModal = document.createElement('div');
			thisModal.id = id;
			thisModal.className = 'jklmp-modal';
			$('body').prepend(thisModal);
			return thisModal;
		}

		/* Cosmetic JKLM.FUN+ changes */
		const homelink = $('.top a');
		homelink.textContent += '+';

		const jklmplusSpan = n('span');
		const jklmplusLink = n('a');
		const jklmplusDev = n('a');

		const links = $("div.links > div");
		links.appendChild(n('br'));
		links.appendChild(jklmplusSpan);

		jklmplusLink.href = 'https://github.com/mawyuri/jklm.fun-plus';
		jklmplusLink.textContent = 'JKLM.FUN+';
		jklmplusDev.href = 'https://github.com/mawyuri';
		jklmplusDev.textContent = 'mawy';

		jklmplusSpan.appendChild(jklmplusLink);
		jklmplusSpan.appendChild(document.createTextNode(' made with ❤️ by '));
		jklmplusSpan.appendChild(jklmplusDev);
		jklmplusSpan.style = 'font-size: smaller;';


		/* Modify profile editor */
		/*const oldauthButton = $('button.auth');
		const authButton = oldauthButton.cloneNode(true);
		oldauthButton.parentNode.replaceChild(authButton, oldauthButton);*/
		const authModal = createModal('authModal');
		const authModalContent = n('div');
		authModalContent.className = 'jklmp-modal-content';
		authModal.appendChild(authModalContent);

		var xButton = n('button');
		xButton.style.float = 'right';
		xButton.style.backgroundColor = 'rgba(0,0,0,0)';
		xButton.style.border = 'none';
		xButton.style.color = 'darkgrey';
		xButton.innerText = 'x';
		authModalContent.appendChild(xButton);

		var authButton = $('button.auth');
		authButton.replaceWith(authButton.cloneNode(true));

		authButton = $('button.auth');
		authButton.addEventListener('click', event => {
			event.preventDefault();

			$('.auth.page').hidden = true;
			$('.home.page').hidden = false;
			document.body.style.overflow = 'hidden';

			authModal.style.display = 'block';
		})

		function closeModal(id) {
			var modal = $(`#${id}`);
			modal.style.display = 'none';
			document.body.style.overflow = '';

			if (myPlusId !== null){
				var profileRequest = {
					id: myPlusId,
					service: settings.auth.service,
					token: getPlusToken()
				}

				if (prvNickname !== settings.nickname) {
					prvNickname = settings.nickname;
					profileRequest.nickname = settings.nickname;
				}

				if (prvPictureURL !== settings.picture) {
					prvPicture = settings.picture;
					profileRequest.picture = settings.picture;
				}

				if (profileRequest.nickname || profileRequest.picture){
					fetch(`${plusEndpoint}/profile.php`, {
						method: 'POST', headers: {'Content-Type': 'application/json'},
						body: JSON.stringify(profileRequest)
					}).catch(error => {
						log(error);
					})
				}
			}
		}

		authModal.addEventListener('click', event => {
			event.preventDefault();

			if (event.target === authModal) {
				closeModal(authModal.id);
			};
		})

		xButton.addEventListener('click', () => {
			closeModal(authModal.id);
		})

		/* Create content of auth modal */

		const authSections = n('div');
		authSections.classList.add('columns', 'section');
		authSections.style.display = 'flex';
		authModalContent.appendChild(authSections);

		const authLeft = n('div');
		authLeft.className = 'left';
		authLeft.style.width = '50%';
		authSections.appendChild(authLeft);

		const authRight = n('div');
		authRight.className = 'right';
		authRight.style.width = '50%';;
		authSections.appendChild(authRight);

		/* Profile customizer */
		const authProfile = n('form');
		authProfile.id = 'jklmp-profile';
		authProfile.style.display = 'flex';
		authProfile.style.margin = 0;
		authProfile.style.padding = 0;
		authProfile.style.width = '160%';
		authProfile.style.justifyContent = 'flex-start';
		authProfile.style.alignItems = 'flex-start';
		authProfile.style.flexDirection = 'row';
		authLeft.appendChild(authProfile);

		/* PFP uploader */
		const authImageholder = n('div');
		authImageholder.style.width = '15%';

		const authImageholderUpload = n('img');
		authImageholderUpload.style.width = '80%';
		authImageholderUpload.style.height = 'auto';
		authImageholderUpload.src = pictureUrl;

		authImageholderUpload.addEventListener('click', e => {
			e.preventDefault();
			$('.pictureUpload').click();
		})

		var prvPicture = $('.wrap .picture').style.backgroundImage;
		$('.pictureUpload').addEventListener('change', () => {
			setTimeout(() => {
				if (prvPicture !== $('.wrap .picture').style.backgroundImage) {
					prvPicture = $('.wrap .picture').style.backgroundImage;
					authImageholderUpload.src = prvPicture.slice(5, -2);
				}
			}, 200)
		})

		const authImageholderDisclaimer = n('p');
		authImageholderDisclaimer.style.margin = '0.1em';
		authImageholderDisclaimer.style.fontSize = 'small';
		authImageholderDisclaimer.style.color = 'grey';
		authImageholderDisclaimer.textContent = 'Profile pictures are compressed to fit 10KB.';

		authImageholder.appendChild(authImageholderUpload);
		authImageholder.appendChild(authImageholderDisclaimer);
		authProfile.appendChild(authImageholder);

		/* Authentications */
		const authPersonalize = n('div');
		authPersonalize.style.width = '42%';
		authPersonalize.style.display = 'flex';
		authPersonalize.style.flexWrap = 'wrap';
		authProfile.appendChild(authPersonalize);

		/* Current service */
		const authPersonalizeCurrentServiceHolder = n('div');
		authPersonalizeCurrentServiceHolder.style.width = '40px';

		const authPersonalizeCurrentServiceImage = n('img')
		authPersonalizeCurrentServiceImage.src = authServices[authService ?? 'guest'].pictureUrl;
		authPersonalizeCurrentServiceImage.style.width = '80%';
		authPersonalizeCurrentServiceImage.style.height = 'auto';

		authPersonalizeCurrentServiceHolder.appendChild(authPersonalizeCurrentServiceImage);
		authPersonalize.appendChild(authPersonalizeCurrentServiceHolder);

		/* Nicknamer */
		const authPersonalizeNick = n('div');
		authPersonalize.appendChild(authPersonalizeNick);
		const authPersonalizeNickInput = n('input');
		authPersonalizeNickInput.style.padding = '0.2em';
		authPersonalizeNickInput.placeholder = 'Nickname';
		authPersonalizeNickInput.maxlength = 20;
		authPersonalizeNickInput.value = nickname;

		authPersonalizeNickInput.addEventListener('input', e => {

			settings.nickname = authPersonalizeNickInput.value;
			updateAuth();

		})

		authProfile.addEventListener('submit', e => {

			e.preventDefault();
			updateAuth();

		})

		const authPersonalizeNickDisclaimer = n('p');
		authPersonalizeNickDisclaimer.style.margin = '0.1em';
		authPersonalizeNickDisclaimer.style.fontSize = 'small';
		authPersonalizeNickDisclaimer.style.color = 'grey';

		authPersonalizeNickDisclaimer.appendChild(document.createTextNode('This is what others will see you as.'));
		authPersonalizeNickDisclaimer.appendChild(n('br'));
		authPersonalizeNickDisclaimer.appendChild(document.createTextNode('Explicit/insulting names are not allowed.'));

		authPersonalizeNick.appendChild(authPersonalizeNickInput);
		authPersonalizeNick.appendChild(authPersonalizeNickDisclaimer);

		/* Authentications */
		const authAuthenticate = n('div');
		authPersonalize.appendChild(authAuthenticate);
		const authAuthenticateCurrentText = n('p');
		authAuthenticateCurrentText.style.padding = '0.5em';
		authAuthenticateCurrentText.style.paddingBottom = '0em';
		authAuthenticateCurrentText.style.marginBottom = '0.5em';
		authAuthenticateCurrentText.style.fontSize = '0.8em';

		const authAuthenticateServices = n('div');
		authAuthenticateServices.style.display = 'flex';
		authAuthenticateServices.style.paddingLeft = '0.5em';
		authAuthenticateServices.style.gap = '0.1em';

		function discordButton() {
			const authAuthenticateViaDiscord = n('img');
			authAuthenticateViaDiscord.src = authServices['discord'].pictureUrl;
			authAuthenticateViaDiscord.style.width = '12%';
			authAuthenticateViaDiscord.style.height = 'auto';

			authAuthenticateViaDiscord.addEventListener('click', e => {
				/* Start processing the Discord login */
				const discordWindow = window.open(
					`https://discord.com/api/oauth2/authorize?client_id=${encodeURIComponent('688126093424721954')}&redirect_uri=${encodeURIComponent(`${window.location.protocol}//${window.location.host}/?login=discord`)}&response_type=token&scope=identify&prompt=consent`
					,'Discord'
					,`width=400,height=500,left=${(window.screen.width / 2) - (400 / 2)},top=${(window.screen.height / 2) - (500 / 2)},resizable=no,scrollbars=yes,status=yes`
				);

				function login(q) {
					q = '?' + q.split('#')[1]
					const params = new URLSearchParams(q);
					var token = params.get('access_token');
					var expr = params.get('expires_in');

					fetch('https://discord.com/api/users/@me', {method: 'GET', headers: {
						'Authorization': `Bearer ${token}`
					}}).then(r => r.json()).then(d => {
						discordWindow.close()
						settings.auth = {
							'expiration': Date.now() + expr,
							'service': 'discord',
							'token': token,
							'username': d.username
						}
						updateAuth();
						updateButtons();
					});
				}

				var currentPage = discordWindow.location;
				const pageWatch = setInterval(function() {
					try {
						if (currentPage.href !== discordWindow.location.href) {
							currentPage = discordWindow.location;
							login(currentPage.href);
							clearInterval(pageWatch);

							discordWindow.location.href = 'about:blank';
							discordWindow.document.body.innerHTML = '<p>This window will close automatically once the authentication is done.</p>';
						}
					} catch {}
				}, 50);
			})

			authAuthenticateServices.appendChild(authAuthenticateViaDiscord);
			return authAuthenticateViaDiscord;
		}

		function twitchButton() {
			const authAuthenticateViaTwitch = n('img');
			authAuthenticateViaTwitch.src = authServices['twitch'].pictureUrl;
			authAuthenticateViaTwitch.style.width = '12%';
			authAuthenticateViaTwitch.style.height = 'auto';

			authAuthenticateViaTwitch.addEventListener('click', e => {
				/* Twitch */
				const twitchWindow = window.open(
					`https://auth.twitch.tv/authorize?client_id=6l484vmhkx7pri37va2qxgh3346qiq&redirect_uri=https%3A%2F%2Fjklm.fun%2F%3Flogin%3Dtwitch&response_type=token&force_verify=true`
					,'Twitch'
					,`width=400,height=500,left=${(window.screen.width / 2) - (400 / 2)},top=${(window.screen.height / 2) - (500 / 2)},resizable=no,scrollbars=yes,status=yes`
				);

				function login(q) {
					q = '?' + q.split('#')[1];
					const params = new URLSearchParams(q);
					var token = params.get('access_token');
					var expr = params.get('expires_in');

					fetch("https://id.twitch.tv/oauth2/validate", {method: 'GET', headers: {
						'Authorization': `Bearer ${token}`
					}}).then(r => r.json()).then(d => {
						twitchWindow.close()
						settings.auth = {
							'expiration': Date.now() + expr,
							'service': 'twitch',
							'token': token,
							'username': d.login
						};
						updateAuth();
						updateButtons();
					});
				}

				var currentPage = twitchWindow.location;
				const pageWatch = setInterval(() => {
					try {
						if (currentPage.href !== twitchWindow.location.href) {
							currentPage = twitchWindow.location;
							login(currentPage.href);
							clearInterval(pageWatch);

							twitchWindow.location.href = 'about:blank';
							twitchWindow.document.body.innerHTML = '<p>This window will close automatically once the authentication is done.</p>';
						}
					} catch {};
				}, 50);
			})

			authAuthenticateServices.appendChild(authAuthenticateViaTwitch);
			return authAuthenticateViaTwitch;
		}

		function jklmButton() {
			const authAuthenticateViaJKLM = n('img');
			authAuthenticateViaJKLM.src = authServices['jklm'].pictureUrl;
			authAuthenticateViaJKLM.style.width = '12%';
			authAuthenticateViaJKLM.style.height = 'auto';

			authAuthenticateServices.appendChild(authAuthenticateViaJKLM);
			return authAuthenticateViaJKLM;
		}

		function logoutButton() {
			const removeAuthentication = n('img');
			removeAuthentication.src = authServices['guest'].pictureUrl;
			removeAuthentication.style.width = '12%';
			removeAuthentication.style.height = 'auto';

			removeAuthentication.addEventListener('click', e => {
				e.preventDefault();
				settings.auth = null;
				updateAuth();
				updateButtons();

				location.reload();
			})

			authAuthenticateServices.appendChild(removeAuthentication);
			return removeAuthentication;
		}

		function updateButtons() {
			authAuthenticateServices.replaceChildren();
			authPersonalizeCurrentServiceImage.src = authServices[authService ?? 'guest'].pictureUrl;
			if (auth === null) {
				authAuthenticateCurrentText.textContent = "You're not logged in. Authenticate with:";

				discordButton();
				twitchButton();
				jklmButton();
			}
			else {
				authAuthenticateCurrentText.textContent = `People can see you as ${authUsername} on ${authServices[authService].name}. Change authentication service:`;
				logoutButton();

				if (authService !== 'discord')
					discordButton();

				if (authService !== 'twitch')
					twitchButton();

				if (authService !== 'jklm')
					jklmButton();
			}
		}

		authAuthenticate.appendChild(authAuthenticateCurrentText);
		authAuthenticate.appendChild(authAuthenticateServices);

		authRight.innerHTML = `<div style="font-family: &quot;Varela Round&quot;;font-weight: 400;color: rgb(204, 204, 204);background-color:#202020;width: 100%;height:80%;font-size:0.8em;padding:1em;overflow:hidden;display:flex;flex-direction: column;row-gap:0.4375em;flex-wrap: nowrap;" class="chatlogs"></div><textarea style="width:100%; height:30%; margin:0; border:none;background-color:#101010; border-radius:0px; color:#eee; padding: 0.5em; font-family:&quot;Varela Round&quot;;" placeholder="Type here to see how your messages look in chat"></textarea></div>`;
		const chatlogs = $('.chatlogs');
		const exchatarea = $('.jklmp-modal-content .right textarea');

		function exampleChat(message){
			var date = new Date();
			chatlogs.innerHTML += `<div class="exampleChat"><span style="color:#888; font-size:0.7em;">${`0${date.getHours()}`.slice(-2)}:${`0${date.getMinutes()}`.slice(-2)} </span><a style="color: rgb(238, 238, 238);"><img src="${picture ? `data:image/jpeg;base64,${settings.picture}` : `https://jklm.fun/images/auth/guest.png`}" class="exampleChat profile" style="width:1em; height:auto;vertical-align: middle;margin-right: 0.25em;border-radius: 0.125em;"><img src="${auth ? `https://jklm.fun/images/auth/${authService}.png` : ``}" class="exampleChat service" style="width:1em; height:auto;vertical-align: middle;margin-right: 0.25em;border-radius: 0.125em;">${settings.nickname}: </a><span style="color:#EEE;">${message}</span></div>`;
		}

		exchatarea.addEventListener('keydown', (event) => {
			if (!event.shiftKey && event.key === "Enter") {
				event.preventDefault();
				exampleChat(exchatarea.value.trim());
				exchatarea.value = '';
			}
		})

		updateButtons();

		var columns = $('.home > .section');
		var friendsColumn = n('div');
		friendsColumn.classList.add('right');
		columns.after(friendsColumn);

		const requestsModal = createModal('requestsModal');
		const requestsModalContent = n('div');
		requestsModalContent.className = 'jklmp-modal-content';
		requestsModal.appendChild(requestsModalContent);

		var xButton2 = n('button');
		xButton2.style.float = 'right';
		xButton2.style.backgroundColor = 'rgba(0,0,0,0)';
		xButton2.style.border = 'none';
		xButton2.style.color = 'darkgrey';
		xButton2.innerText = 'x';
		requestsModalContent.appendChild(xButton2);

		requestsModal.addEventListener('click', event => {
			event.preventDefault();

			if (event.target === requestsModal) {
				closeModal(requestsModal.id);
			};
		})

		xButton2.addEventListener('click', () => {
			closeModal(requestsModal.id);
		})

		var friendsBox = n('div');
		friendsBox.classList.add('friends', 'box');
		friendsColumn.appendChild(friendsBox);

		var friendsHeader = n('header');
		friendsHeader.innerText = `Friends`;
		friendsBox.appendChild(friendsHeader);

		var friendsScroller = n('div');
		friendsScroller.classList.add('friends', 'list');
		friendsScroller.style.display = 'flex';
		friendsScroller.style.flexDirection = 'row';
		friendsScroller.style.flexWrap = 'nowrap';
		friendsScroller.style.overflowX = 'scroll';
		friendsScroller.style.columnGap = '5px';
		friendsScroller.style.paddingBottom = '10px';
		friendsScroller.innerHTML = `<div style="width: 100px; display: flex; flex-direction: column; align-items: center; cursor: pointer;" id="requests"><div style="text-align: center; width: 90px; height: 90px;background-color:lightgrey;font-size:4em;"><h2>+</h2></div><span style="font-size: 0.75em; padding: 5px; width: 90px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; text-align: center;">Requests</span></div>`

		friendsBox.appendChild(friendsScroller);
		$('#requests').addEventListener('click', (event) => {
			event.preventDefault();
			document.body.style.overflow = 'hidden';
			requestsModal.style.display = 'block';
		})

		var requestsBox = friendsBox.cloneNode();
		var requestsHeader = friendsHeader.cloneNode();
		var requestsList = friendsScroller.cloneNode();

		requestsBox.style.marginTop = '2em';
		requestsHeader.innerText = 'Friend requests';

		requestsList.style.flexWrap = 'wrap';
		requestsList.style.overflow = 'scroll';
		requestsModalContent.appendChild(requestsBox);
		requestsBox.appendChild(requestsHeader);
		requestsBox.appendChild(requestsList);

		function appendPerson(container, id, nick, online, status, picture, isRequest) {
			var person = {}
			picture = picture ? `data:image/jpeg;base64,${picture}` : 'https://jklm.fun/images/auth/guest.png';

			var pelement = n('div')
			pelement.style.width = '100px';
			pelement.style.display = 'flex';
			pelement.style.flexDirection = 'column';
			pelement.style.alignItems = 'center';

			var pimg = n('img');
			pimg.src = picture;
			pimg.style.width = '90px';
			pimg.style.height = 'auto';

			var ponline = n('div');
			ponline.style.height = '8px';
			ponline.style.width = '90px';
			ponline.style.backgroundColor = 'darkgrey';

			if (online === true)
				ponline.style.backgroundColor = 'green';

			var pnick = n('span');
			pnick.innerText = nick;
			pnick.style.fontSize = '.75em';
			pnick.style.padding = '5px';
			pnick.style.width = '90px';
			pnick.style.textOverflow = 'ellipsis';
			pnick.style.whiteSpace = 'nowrap';
			pnick.style.overflow = 'hidden';
			pnick.style.textAlign = 'center';

			var pstatus = n('span');
			pstatus.innerText = status;
			pstatus.style.fontSize = '.6em';
			pstatus.style.width = '100px';
			pstatus.style.textAlign = 'center';
			pstatus.style.color = 'grey';

			pelement.appendChild(pimg);
			pelement.appendChild(ponline);
			pelement.appendChild(pnick);
			pelement.appendChild(pstatus);

			var prequestDiv = n('div');
			var prequest = n('span');
			prequestDiv.appendChild(prequest);
			pelement.appendChild(prequestDiv);
			prequest.style.fontSize = '.6em';
			prequest.innerHTML = `<a class="decline" href="#">Unfriend</a>`;

			if (isRequest) {
				prequest.innerHTML = `<a class="accept" href="#">Accept</a> / <a class="decline" href="#">Decline</a>`;

				$(prequest, '.accept').addEventListener('click', event => {
					fetch(`${plusEndpoint}/request.php`, {
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							id: myPlusId,
							other: id,
							service: settings.auth.service,
							token: getPlusToken()
						})
					}).then(response=>response.json())
					.then(data=>{
						if (data.status) {
							$(prequest, '.accept').remove();
							prequest.innerHTML = `<a class="decline" href="#">Unfriend</a>`;
							friendsScroller.appendChild(person.div);
						}
					})
				});
			}

			$(prequest, '.decline').addEventListener('click', event => {
				fetch(`${plusEndpoint}/request.php`, {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify({
						id: myPlusId,
						other: id,
						service: settings.auth.service,
						token: getPlusToken(),
						request: -1
					})
				}).then(response=>response.json())
				.then(data=>{
					if (data.status) {
						person.div.remove();
						clearInterval(person.fetchInterval);
					}
				})
			});

			person.div = pelement;
			person.changeImage = function(picture) {
				if (picture)
					pimg.src = `data:image/jpeg;base64,${picture}`;
				else
					pimg.src = 'https://jklm.fun/images/auth/guest.png';
			}
			person.changeNick = function(nickname) {
				pnick.innerText = nickname;
			}
			person.changeOnline = function(isOnline) {
				if (isOnline)
					ponline.style.backgroundColor = 'green';

				else
					ponline.style.backgroundColor = 'darkgrey';
			}
			person.changeStatus = function(statusText) {
				pstatus.innerText = statusText;
			}

			container.appendChild(person.div);

			person.fetchPerson = function(){
				fetch(`${plusEndpoint}/person.php?id=${id}`)
				.then(response=> {
					return response.json();
				})
				.then(data=> {
					var profile = data['data'];
					var currentTime = Math.floor(Date.now() / 1000);
					var lastOnline = currentTime - profile.ping;
					var playing = profile.room;
					var isOnline = lastOnline <= 180;

					person.changeNick(profile['nickname']);
					person.changeImage(profile['picture']);
					person.changeOnline(isOnline);
					person.changeStatus(isOnline ? (playing ? `Playing in ${playing}` : `Browsing rooms`) : `Last online ${getRelativeTime(profile.ping)}`);
				})
			}

			person.fetchInterval = setInterval(() => {person.fetchPerson();}, 90 * 1e3);
		}
	}

	if (myPlusId !== -1){
		// Logged in
		// log(`JKLM+ ID: ${myPlusId}`);
		ping(myPlusId);
		setInterval(() => {
			ping(myPlusId);
		}, 120 * 1e3);
		if (!inGame){
			try {
				fetch(`${plusEndpoint}/friends.php?id=${myPlusId}`)
				.then(response => {
					if (!response.ok){
						friendsScroller.style.gap = '10px';
						friendsScroller.style.flexFlow = 'column';
						friendsScroller.style.alignItems = 'center';
						friendsScroller.innerHTML = `<span style="font-size:1em;">It's feeling lonely in here, add some friends and fill this list up!</span>`
					}
					return response.json();
				})
				.then(data => {
					try{data.forEach(profile => {
						var currentTime = Math.floor(Date.now() / 1000)
						var lastOnline = currentTime - profile.ping;
						var playing = profile.room;
						var isOnline = lastOnline <= 180;
						var isFriends = (profile.status === 'friend');
						appendPerson(isFriends ? friendsScroller: requestsList, profile.id, profile.nickname, isOnline, isOnline ? (playing ? `Playing in ${playing}` : `Browsing rooms`) : `Last online ${getRelativeTime(profile.ping)}`, profile.picture, !isFriends);
					})}catch{
						friendsScroller.style.gap = '10px';
						friendsScroller.style.flexFlow = 'column';
						friendsScroller.style.alignItems = 'center';
						friendsScroller.innerHTML = `<span style="font-size:1em;">It's feeling lonely in here, add some friends and fill this list up!</span>`
					}
				}).catch(); // No friends?
			} catch {}
		}
	}

	if (plusId === null){
		// Guest
		// log(`Cannot log in to JKLM+`);
		friendsScroller.style.gap = '10px';
		friendsScroller.style.flexFlow = 'column';
		friendsScroller.style.alignItems = 'center';

		friendsScroller.innerHTML = `<span style="font-size:1em;">Link your Discord or Twitch to use this feature.</span>`
		setInterval(() => {
			if (settings.auth) {
				$(friendsScroller, 'span').innerHTML = `<a href="https://jklm.fun">Reload</a> your page to use this feature.`
			} else {
				friendsScroller.innerHTML = `<span style="font-size:1em;">Link your Discord or Twitch to use this feature.</span>`
			}
		}, 1000);
	}

	if (plusId !== null && myPlusId === -1) {
		// Account not created yet
		// log(`User is unregistered at JKLM+`);
		friendsScroller.style.gap = '10px';
		friendsScroller.style.flexFlow = 'column';
		friendsScroller.style.alignItems = 'center';

		var tokenGen = getPlusToken();

		friendsScroller.innerHTML = `<span style="font-size:1em;">You don't have a JKLM.fun+ account linked to your ${settings.auth.service.charAt(0).toUpperCase() + settings.auth.service.slice(1)} account yet.</span><button id="jklm+" class="styled">Create JKLM.fun+ account</button>`
		$('#jklm\\+').addEventListener('click', event => {
			fetch(`${plusEndpoint}/register.php`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					nickname: settings.nickname,
					service: settings.auth.service,
					authid: plusId,
					token: tokenGen,
					picture: settings.picture
				})
			}).then(response => response.json())
			.then(data => {
				if (data.id) {
					location.reload(true);
				} else {
					alert(data.error)
				}
			})
		});
	}

	//
	// New settings
	//

	if (inGame) {
		function fieldset() {
			var x = n('fieldset');
			$('.darkSettings.darkScrollbar').prepend(x);
			return x;
		};

		function option(fieldset, id, text) {
			var x = n('div'); // Option
			var y = n('div'); // Label
			x.classList.add('setting', id);
			y.classList.add('label');
			y.style.backgroundColor = 'rgba(255,255,255,.1)';
			y.style.cursor = 'pointer';
			y.innerText = text;

			x.appendChild(y);
			fieldset.appendChild(x);
			return x;
		};

		function field(option) {
			var x = n('div');
			x.classList.add('field');
			x.style.display = 'none';
			option.appendChild(x);

			$(option, '.label').addEventListener('click', (event) => {
				event.preventDefault();
				if (x.style.display === 'none')
					x.style = '';
				else
					x.style.display = 'none';
			})

			return x;
		}

		var amfieldset = fieldset();
		var amoptions = option(amfieldset, 'automod', '⚔️ Automod');
		var amfield = field(amoptions);

		var automod = [];
		var listeners = [];

		var trustButton = n('button');
		trustButton.classList.add('styled');
		//trustButton.hidden = true;
		trustButton.innerText = 'Trust';

		function actionTable(field, name) {
			var tableName = n('label');
			tableName.innerHTML = name;

			var table = n('div');
			table.classList.add('actionTable');
			table.style.backgroundColor = 'rgba(0,0,0,.5)';

			var addChild = n('button');
			addChild.id = 'addchild';
			addChild.style.color = 'white';
			addChild.style.width = '100%';
			addChild.innerText = '+';

			field.appendChild(tableName);
			field.appendChild(table);
			table.appendChild(addChild);
			return table;
		};

		function addActionRow(table, i, array) {
			var row = n('div');
			row.classList.add('actionRow');
			row.style.padding = '5px';
			row.style.dislay = 'flex';
			row.style.flexDirection = 'row';
			row.style.flexWrap = 'wrap';
			row.style.rowGap = '3px';

			var condition = n('select');
			var outcome = n('select');
			//condition.id = 'condition';
			condition.style.width = '40%';
			//outcome.id = 'outcome';

			var conditionInput = n('input');
			//conditionInput.id = 'conditioner';
			conditionInput.style.width = '60%';
			conditionInput.placeholder = '...';

			var placeholderConditionOption = n('option');
			var placeholderOutcomeOption = n('option');
			placeholderConditionOption.disabled = true;
			placeholderOutcomeOption.disabled = true;
			placeholderConditionOption.selected = true;
			placeholderOutcomeOption.selected = true;
			placeholderConditionOption.innerText = 'Condition';
			placeholderOutcomeOption.innerText = 'Outcome';
			condition.appendChild(placeholderConditionOption);
			outcome.appendChild(placeholderOutcomeOption);

			function newOption(selector, id, text) {
				var x = n('option');
				x.value = id;
				x.innerText = text;
				selector.appendChild(x);
				return x;
			};

			// Conditions
			newOption(condition, 'name', 'Name matches:');
			newOption(condition, 'chat', 'Chat matches:');
			newOption(condition, 'twitch', 'Twitch ID:');
			newOption(condition, 'discord', 'Discord ID:');

			// Outcomes
			newOption(outcome, 'ban', 'Ban');
			newOption(outcome, 'kick', 'Kick');
			newOption(outcome, 'moderate', 'Grant moderator');

			var remove = n('button');
			remove.style.borderColor = 'red';
			remove.style.color = 'red';
			remove.style.width = '100%';
			remove.style.margin = '4px';
			remove.innerText = 'Remove action';

			var h = n('hr');
			h.style.margin = '5px;'
			h.style.borderColor = 'grey';
			h.style.width = '100%';

			row.appendChild(condition);
			row.appendChild(conditionInput);
			row.appendChild(outcome);
			row.appendChild(remove);
			row.appendChild(h);

			var c_condition = '';
			var c_input = '';
			var c_outcome = '';

			function regexInput(input, string) {
				var exp = input.match(/\/(.*)\/(.*)/);
				if (exp) {
					var regexp = new RegExp(exp[1], exp[2] ? exp[2] : 'gmi');
					return regexp.exec(string) !== null;
				} else {
					return string.match(input) !== null;
				}
			}

			function addListener(condition, input, outcome) {
				function checkOutcome(peer) {
					if (outcome === 'ban')
						socket.emitWithAck('setUserBanned', peer, true);
					if (outcome === 'moderate')
						socket.emitWithAck('setUserModerator', peer, true);
					if (outcome === 'kick'){
						socket.emitWithAck('setUserBanned', peer, true);
						socket.emitWithAck('setUserBanned', peer, false);
					}
				}

				if (condition === 'name') {
					if (listeners[i]) {
						socket.off('chatterAdded', listeners[i]);
					}
					listeners[i] = (data) => {
						if (regexInput(input, data.nickname)) {
							checkOutcome(data.peerId)
						}
					}
					socket.on('chatterAdded', listeners[i])
				}

				if (condition === 'chat') {
					if (listeners[i]) {
						socket.off('chat', listeners[i]);
					}
					listeners[i] = (profile, text) => {
						if (text && regexInput(input, text)) {
							checkOutcome(profile.peerId)
						}
					}
					socket.on('chat', listeners[i])
				}

				if (condition === 'discord' || condition === 'twitch') {
					if (listeners[i]) {
						socket.off('chatterAdded', listeners[i]);
					}
					listeners[i] = (data) => {
						if (data.auth && data.auth.service === condition && regexInput(data.auth.id, input)) {
							checkOutcome(data.peerId)
						}
					}
					socket.on('chatterAdded', listeners[i])
				}
			};

			function removeListener(condition) {
				if (condition === 'name' && listeners[i])
					socket.off('chatterAdded', listeners[i]);
			}

			if (array) {
				c_condition = array['c'];
				c_input = array['i'];
				c_outcome = array['o'];

				condition.value = c_condition;
				conditionInput.value = c_input;
				outcome.value = c_outcome;
				addListener(c_condition, c_input, c_outcome);
			}

			function checkEmptiness(r) {
				if (c_condition && c_input && c_outcome) {
					if (r === true) return false;
					condition.value = c_condition;
					conditionInput.value = c_input;
					outcome.value = c_outcome;

					while (!automod[i - 1] && i !== 0 && i > -1) i--;
					automod[i] = {
						'c': c_condition,
						'i': c_input,
						'o': c_outcome
					}
					localStorage.setItem('chat+automod', JSON.stringify(automod));
					addListener(c_condition, c_input, c_outcome);
				}

				if (r === true) return true;
			}

			condition.addEventListener('change', (event) => {
				c_condition = condition.value;
				checkEmptiness();
			})

			conditionInput.addEventListener('change', (event) => {
				c_input = conditionInput.value;
				checkEmptiness();
			})

			outcome.addEventListener('change', (event) => {
				c_outcome = outcome.value;
				checkEmptiness();
			})

			remove.addEventListener('click', (event) => {
				//log(automod)
				if (automod.length !== 1 || checkEmptiness(true)) {
					listeners = [];
					automod.splice(i, 1);
					//log(automod)
					row.remove();
					localStorage.setItem('chat+automod', JSON.stringify(automod));
				}

				if (!checkEmptiness(true)) {
					automod.splice(i, 1);
					localStorage.setItem('chat+automod', JSON.stringify(automod));
					removeListener(c_condition);

					c_condition = '';
					c_input = '';
					c_outcome = '';

					condition.value = '';
					conditionInput.value = '';
					outcome.value = '';
				}
			})

			table.appendChild(row);
			table.appendChild($('#addchild'));
		};

		var amtable = actionTable(amfield, 'Actions');
		if (localStorage.getItem('chat+automod')) {
			automod = JSON.parse(localStorage.getItem('chat+automod'));

			automod.forEach(x => {
				addActionRow(amtable, automod.indexOf(x), x);
			})
		}

		$('.manage').appendChild(trustButton);
		trustButton.addEventListener('click', (event) => {
			var profile = viewedUserProfile;
			if (profile.auth && profile.auth.service !== 'jklm') {
				addActionRow(amtable, automod.length, {
					c: profile.auth.service,
					i: `/^${profile.auth.id}(@${profile.auth.username})?$/g`,
					o: 'moderate'
				});
			}
		})

		if (automod.length === 0) {
			addActionRow(amtable, automod.length);
		};

		$('#addchild').addEventListener('click', (event) => {
			event.preventDefault();
			// check if last index in automod table is empty ?
			var x = automod[automod.length - 1]
			if (x.c && x.i && x.o) {
				addActionRow(amtable, automod.length);
			}
		})

		var extfieldset = fieldset();
		var extoptions = option(extfieldset, 'chatplus', '⚙️ Chat+ Settings');
		var extfield = field(extoptions);

		function formgroup(field) {
			var f = n('div');
			f.classList.add('formGroup');
			field.appendChild(f);
			return f;
		}

		var tabsPos = formgroup(extfield);
		var chatDirection = formgroup(extfield);
		tabsPos.innerHTML = `
			<label>Tab Positioning</label>
			<select id="tabsPosition">
				<option value="1" selected>Top</option>
				<option value="0" false>Bottom</option>
			</select>
		`;

		chatDirection.innerHTML = `
			<label>Chat Direction</label>
			<select id="chatFlow">
				<option value="0" selected>Messages stick to the top</option>
				<option value="1" false>Messages stick to the bottom</option>
			</select>
		`;

		function getSetting(opt, def) {
			if (localStorage.getItem(`chat+${opt}`) == null){
				localStorage.setItem(`chat+${opt}`, def);
				return def;
			}
			return parseInt(localStorage.getItem(`chat+${opt}`));
		}

		function setSetting(opt, v) {
			return localStorage.setItem(`chat+${opt}`, v);
		}

		var tabsPosition = getSetting('tabsPosition', 1);
		var chatFlow = getSetting('chatFlow', 0);

		function linkSelector(i, t = () => {}){
			if (getSetting(i, null) != null) {
				$(`#${i}`).value = getSetting(i);
				t(getSetting(i));
			}

			$(`#${i}`).addEventListener('change', (event) => {
				var v = parseInt(event.target.value);
				setSetting(i, v);
				t(v); // t(v) time!
			})
		}

		var sidebar = $('.sidebar');
		var tabs = $('.tabs');

		linkSelector('tabsPosition', (v) => {
			tabsPosition = v;
			if (v === 0) {
				sidebar.appendChild(tabs);
			} else {
				sidebar.insertBefore(tabs, $('.chat.pane'))
			}
		});
		linkSelector('chatFlow', (v) => {
			chatFlow = v;
			if ($($('.log.darkScrollbar'), 'div:first-of-type') == null) { return; }

			if (v === 0) {
				$($('.log.darkScrollbar'), 'div:first-of-type').style.marginTop = '';
			} else {
				$($('.log.darkScrollbar'), 'div:first-of-type').style.marginTop = 'auto';
			}
		});

		//
		// Chat modifications
		//
		var currentDex = -1;
		var prevDex = -1;
		var chatCounter = 0;
		var emojiinterval = setInterval(() => {
			if ($('.emojiOptions').style.display === 'none'){
				currentDex = -1;
				prevDex = -1;
			}
		}, 100);
		var chatObserver = new MutationObserver((mutations, o) => {
			for (var mutation of mutations) {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach(node => {
						if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'DIV') {
							var chatdiv = node;
							var hasAuthor = false;
							if ($(chatdiv, '.author')) {
								hasAuthor = true;
							}

							if (hasAuthor) {
								chatdiv.classList.add(`c${chatCounter}`);
								chatCounter++;
							}

							if (chatFlow === 1)
								$($('.log.darkScrollbar'), 'div:first-of-type').style.marginTop = 'auto';

							var chattext = $(chatdiv, '.text');
							const linkElements = $a(chattext, 'a');
							for (let i = 0; i <= linkElements.length; i++) {
								const linkElement = linkElements[i]
								var isChanged = true;
								var replacementNode = null;
								fetch(linkElement.href.replace('http://', 'https://'))
								.then(r => {
									var href = r.url;
									var link_type = r.headers.get('content-type').split('/')[0];

									if (link_type === 'image') {
										// Destroy link element, add an image node
										const imageNode = n('img');
										imageNode.src = linkElement.href
										imageNode.style.width = '100%';
										imageNode.style.height = 'auto';
										imageNode.style.objectFit = 'contain';
										replacementNode = imageNode
									}

									else {
										isChanged = false;
									}
								}).then(_ => {
									//console.log(isChanged, replacementNode)
									if (isChanged && replacementNode) {
										linkElements[i].replaceWith(replacementNode)
									}
								})
								.catch(e => {}) // Probable fetch error, don't do anything
							}

						}
					})
				}
			}
		})
		var chatlog = $('.chat .log');
		var chatarea = $('.input textarea');
		var emojifield = false;
		var emojicount = 0;
		chatObserver.observe(chatlog, {childList:true,subtree:true})
		chatarea.removeEventListener('keydown', onChatTextAreaKeyDown)

		function sendChatMessage(m) {
			if (m.length > 0) {
				socket.emit('chat', m);
			}
		}

		var plusSection = n('div');
		var friendStatus = n('button');
		friendStatus.classList.add('styled');
		$('.userProfile > .content').appendChild(plusSection);
		plusSection.appendChild(friendStatus);

		friendStatus.innerText = `Add friend`;
		friendStatus.onclick = function(){};

		const rvup = renderViewedUserProfile;
		renderViewedUserProfile = function() {
			rvup();

			var userProfile = viewedUserProfile;
			friendStatus.hidden = true;
			if (userProfile.auth && myPlusId !== -1) {
				fetch(`${plusEndpoint}/getid.php?auth=${userProfile.auth.id}`)
				.then(r => r.json())
				.then(data => {
					if (data.id) {
						plusSection.hidden = false;
						friendStatus.hidden = false;

						var jklmPlusId = data.id;
						var jklmPlusBadge = n('div');
						jklmPlusBadge.innerText = '➕️ JKLM.FUN+ user';
						$('.content > .badges').appendChild(jklmPlusBadge);

						fetch(`${plusEndpoint}/friends.php?id=${jklmPlusId}`)
						.then(r=>r.json())
						.then(data => {
							try {
								data.forEach(profile => {
									friendStatus.innerText = 'Add friend';
									friendStatus.onclick = function(){
										fetch(`${plusEndpoint}/request.php`, {
											method: 'POST',
											headers: {'Content-Type': 'application/json'},
											body: JSON.stringify({
												id: myPlusId,
												other: jklmPlusId,
												service: settings.auth.service,
												token: getPlusToken(),
											})
										}).then(response=>response.json())
										.then(data=>{
											renderViewedUserProfile();
										})
										.catch(() => {})
									}
									if (profile.id == myPlusId) {
										friendStatus.onclick = function(){
											fetch(`${plusEndpoint}/request.php`, {
												method: 'POST',
												headers: {'Content-Type': 'application/json'},
												body: JSON.stringify({
													id: myPlusId,
													other: jklmPlusId,
													service: settings.auth.service,
													token: getPlusToken(),
													request: -1
												})
											}).then(response=>response.json())
											.then(data=>{
												renderViewedUserProfile();
											})
											.catch(() => {})
										}
										if (profile.status === 'pending'){
											friendStatus.innerText = 'Cancel request';
										}
										else {
											friendStatus.innerText = 'Remove friend';
										}
										throw Error();
									}
								})
							} catch {

							}
						})
						.catch(()=>{})
					}
				})

				.catch(() => {
					plusSection.hidden = true;
					friendStatus.hidden = true;
				});
			}
		}

		var prevroles = [];
		var peopleList = [];
		socket.on('setSelfRoles', (roles) => {
			for (const prevSelfRoles of prevroles){
				if (!roles.includes(prevSelfRoles)) {
					var role = badgesByRole[prevSelfRoles].text;
					var icon = badgesByRole[prevSelfRoles].icon;

					appendToChat(null, `${icon} You got demoted from the ${role} role.`);
				}
			}

			for (const _selfRoles of roles){
				var role = badgesByRole[_selfRoles].text;
				var icon = badgesByRole[_selfRoles].icon;

				appendToChat(null, `${icon} You have been granted the ${role} role.`);

				socket.emit('getChatterProfiles', (chatterProfiles) => {
					chatterProfiles.forEach(x => {
						listeners.forEach(y => {
							y(x);
						})
					})
				})
			}

			prevroles = roles;
		});

		chatarea.addEventListener('keydown', (event) => {
			emojicount = $('.emojiOptions').children.length
			emojifield = (emojicount === 0);
			if (!event.shiftKey && event.key === "Enter" && emojifield) {
				event.preventDefault();
				sendChatMessage(chatarea.value.trim());
				chatarea.value = '';
			}

			if (!emojifield && $('.emojiOptions').style.display !== 'none') {

				function updateEmojiOption() {
					if (currentDex !== -1)
						$('.emojiOptions').children[currentDex].style.backgroundColor = 'rgba(0,0,0,.5)';
					if (prevDex !== -1)
						$('.emojiOptions').children[prevDex].style.backgroundColor = 'rgba(0,0,0,0)';
				}

				if (event.key === "ArrowUp") {
					event.preventDefault();
					prevDex = currentDex;
					currentDex--;
					if (currentDex < 0) currentDex = emojicount - 1;
					updateEmojiOption();
				}

				if (event.key === "ArrowDown") {
					event.preventDefault();
					prevDex = currentDex;
					currentDex++;
					if (currentDex > emojicount-1) currentDex = 0;
					updateEmojiOption();
				}

				if (event.key === "Enter") {
					event.preventDefault();
					if (currentDex === -1) {
						currentDex = 0;
					}

					$('.emojiOptions').children[currentDex].click()
				}
			}
			else{}
		});

		function replaceLast(str, pattern, replacement) {
		  const lastIndex = str.lastIndexOf(pattern);
		  if (lastIndex === -1) return str;

		  return str.slice(0, lastIndex) + replacement + str.slice(lastIndex + pattern.length);
		}

		chatarea.addEventListener('input', (event) => {
			const textvalue = chatarea.value;
			const mentioner = textvalue.split(/ +/gm).pop();
			if (mentioner.startsWith('@')) {
				socket.emit('getChatterProfiles', chatterProfiles => {
					peopleList = chatterProfiles;
					const mentionee = mentioner.slice(1);
					const matches = peopleList.filter((x) => x.nickname.includes(mentionee) && !x.roles.includes('banned'));
					$('.emojiOptions').innerHTML = matches.map((x => `<span class="emojiOption mentioner" data-input="${mentioner}" data-emoji="@${x.nickname}" style="display: flex;align-items: center; gap:0.5em;"><img class="picture" style="width: 10%; height: auto;" src="${x.picture != null ? `data:image/jpeg;base64,${x.picture}` : `https://jklm.fun/images/auth/guest.png`}">@${x.nickname}</span>`)).join('\n');
					$('.emojiOptions').style.display = "";
					$('.emojiOptions').addEventListener('click', event => {
						if (event.target && event.target.matches('.emojiOption.mentioner')) {
							event.preventDefault();

							const element = event.target;
							const mention = element.getAttribute('data-emoji');
							const input = element.getAttribute('data-input');
							chatarea.value = replaceLast(textvalue, input, mention);
						}
					})
				});
			} else {
				if (!(mentioner.startsWith(':') || mentioner.endsWith(':')))
					$('.emojiOptions').style.display = "none";
			};
		});

		$('.log.darkScrollbar').style.display = 'flex';
		$('.log.darkScrollbar').style.flexDirection = 'column';
	};
});
