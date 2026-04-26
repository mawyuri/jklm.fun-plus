const win = window;
const doc = document;
const log = (x) => console.log(x);
const n = (e) => doc.createElement(e);
const $a = (a, b) => {if (typeof(a) === 'string') return doc.querySelectorAll(a);else if(b != null) return a.querySelectorAll(b);return a}
function getRelativeTime(e){let n=new Intl.RelativeTimeFormat("en",{timeZone:"UTC",numeric:"auto"}),o=e-Math.floor(Date.now()/1e3);for(let s of[{name:"year",seconds:31536e3},{name:"month",seconds:2628e3},{name:"day",seconds:86400},{name:"hour",seconds:3600},{name:"minute",seconds:60},{name:"second",seconds:1}])if(Math.abs(o)>=s.seconds||"second"===s.name){let a=Math.round(o/s.seconds);return n.format(a,s.name)}}

log("Jarvis, I'm in.");

const body = $('body');
body.addEventListener('click', (event) =>{
	if (event.button === 1){
		event.preventDefault();
		return false;
	}
});

var inGame = false;
var inPrivate = false;

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

var plusEndpoint = 'https://mawyuri.alwaysdata.net'; //'http://localhost/jklmplus';
var plusId = localStorage.getItem('chat+id');
var myPlusId = -1;

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
	if (!settings.auth) {
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

		var columns = $('.home > .section');
		var friendsColumn = n('div');
		friendsColumn.classList.add('right');
		columns.after(friendsColumn);

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

		friendsBox.appendChild(friendsScroller);

		function appendPerson(id, nick, online, status, picture) {
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

			person.div = pelement;
			person.changeImage = function(picture) {
				pimg.src = `data:image/jpeg;base64,${picture}`;
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

			friendsScroller.appendChild(person.div);

			person.fetchPerson = function(){
				fetch(`${plusEndpoint}/person.php?id=${id}`)
				.then(response=> {
					return response.json();
				})
				.then(data=> {
					var profile = data['data'];
					var currentTime = Math.floor(Date.now() / 1000)
					var lastOnline = currentTime - profile.ping;
					var playing = profile.room;
					var isOnline = lastOnline <= 180;

					person.changeNick(profile['nickname']);
					person.changeImage(profile['picture']);
					person.changeOnline(isOnline);
					person.changeStatus(isOnline ? (playing ? `Playing in ${playing}` : `Browsing rooms`) : `Last online ${getRelativeTime(profile.ping)}`);
				})
			}

			setInterval(() => {person.fetchPerson();}, 90 * 1e3);
		}
	}

	if (myPlusId !== -1){
		// Logged in
		// log(`JKLM+ ID: ${myPlusId}`);
		ping(myPlusId); setInterval(() => { ping(myPlusId); }, 120 * 1e3); if
		(!inGame){ try { fetch(`${plusEndpoint}/friends.php?id=$
		{myPlusId}`) .then(response => { if (!response.ok)
		{ friendsScroller.style.gap = '10px';
		friendsScroller.style.flexFlow = 'column';
		friendsScroller.style.alignItems = 'center';
		friendsScroller.innerHTML = `<span style="font-size:1em;">It's
		feeling lonely in here, add some friends and fill this list
		up!</span>` } return response.json(); }) .then(data =>
		{ data.forEach(profile => { var currentTime = Math.floor(Date.now
		() / 1000) var lastOnline = currentTime - profile.ping; var
		playing = profile.room; var isOnline = lastOnline <= 180;
		appendPerson(profile.id, profile.nickname, isOnline, isOnline ?
		(playing ? `Playing in ${playing}` : `Browsing rooms`) : `Last
		online ${getRelativeTime
		(profile.ping)}`, profile.picture); }) }); } catch
		{ friendsScroller.style.gap = '10px';
		friendsScroller.style.flexFlow = 'column';
		friendsScroller.style.alignItems = 'center';
		friendsScroller.innerHTML = `<span style="font-size:1em;">It's
		feeling lonely in here, add some friends and fill this list
		up!</span>` } } }

	if (plusId === null){
		// Guest
		// log(`Cannot log in to JKLM+`);
		friendsScroller.style.gap = '10px';
		friendsScroller.style.flexFlow = 'column';
		friendsScroller.style.alignItems = 'center';

		friendsScroller.innerHTML = `<span style="font-size:1em;">Link your Discord or Twitch to use this feature.</span>`
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
						if (data.auth.service === condition && regexInput(data.auth.id, input)) {
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
							for (let i = 0; i < linkElements.length; i++) {
								const linkElement = linkElements[i]
								var isChanged = true;
								var replacementNode = null;
								fetch(linkElement.href.replace('http://', 'https://'))
								.then(r => {
									var href = r.url;
									var link_type = r.headers.get('content-type').split('/')[0];

									if (link_type === 'image') {
										// Destroy link element, add an image node
										const imageNode = document.createElement('img');
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
