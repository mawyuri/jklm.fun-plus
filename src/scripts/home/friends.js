//
import DOMPurify from 'dompurify';
import { createAccount, getFriends, getPerson, friendRequest } from '../../features/backend.js';
import { plusAuthId, plusUserId, discordLogin, twitchLogin } from '../../features/auth.js';
import { $log, $get, $set, $token, $rt } from '../../features/common.js';
import * as modal from '../../features/home/modal.js';

export function init() {
	const requestsModal = modal.createModal('requestsModal');
	const friendsList = $make('div');
	friendsList.classList.add('friends');
	$('.home .section').after(friendsList);
	friendsList.insertAdjacentHTML('beforeend', `
		<div class="friends box">
			<header>Friends</header>
			<div class="friends-list">
				${settings.auth && plusUserId ? `<div class="friend-card" id="openRequests">
					<h2 class="friend-plus" style="cursor: pointer;">+</h2>
					<span class="friend-name">Requests</span>
				</div>` : (!settings.auth
					? `<span style="font-size:1em;">Link your Discord or Twitch to use this feature.</span>`
					: `<span style="font-size:1em;">You don't have a JKLM.fun+ account linked to your ${settings.auth.service.charAt(0).toUpperCase() + settings.auth.service.slice(1)} account yet.</span><button style="margin-left: 10px;" id="jklm+" class="styled">Create JKLM.fun+ account</button>`)}
			</div>
		</div>
	`);

	if ($('#jklm\\+')) {
		$('#jklm\\+').addEventListener('click', async (event) => {
			if (!plusAuthId) {
				if (settings.auth) {
					if (settings.auth.service === 'discord'){
						await discordLogin();
					}

					if (settings.auth.service === 'twitch'){
						await twitchLogin();
					}
				}
			}

			const account = await createAccount(settings.auth, plusAuthId, $token(), settings.nickname, settings.picture);
			if (account.id) {
				location.reload(true);
			}
		})
		return;
	}

	if (!settings.auth)
		return;

	$('#openRequests > h2').addEventListener('click', event => {
		event.preventDefault();
		modal.openModal('requestsModal');
	});

	requestsModal.content.insertAdjacentHTML('beforeend', `
		<div class="requests box" style="margin-top:1.2em;">
			<header>Incoming requests</header>
			<div class="friends-list incoming"></div>
			<header class="friend-request-id" style="column-gap:0.4em;">
				Outgoing requests
				<div class="friend-request-id">
					<input type="number" placeholder="Your ID is ${plusUserId}." class="friend-request-id-input">
					<button class="styled" style="font-size:0.8em;">Add by ID</button>
				</div>
			</header>
			<div class="friends-list outgoing"></div>
		</div>
	`);

	function friendCard(friend) {
		const isFriend = friend.status === 'friend';
		const isRecipient = (friend.isRecipient);
		var lastOnline = Math.floor(Date.now() / 1e3) - friend.ping;
		var isOnline = lastOnline <= 180;
		var picture = friend.picture ? `data:image/jpeg;base64,${friend.picture}` : `https://jklm.fun/images/auth/guest.png`;
		var room = friend.room
		const card = $make('div', isFriend ? $(friendsList, '.friends-list') : $('.friends-list.incoming'));
		card.classList.add('friend-card');
		card.insertAdjacentHTML('beforeend', `
			<img src="${picture}" style="width: 90px; height: auto;">
			<div class="${isOnline ? 'friend-online' : 'friend-offline'}"></div>
			<span class="friend-name">${DOMPurify.sanitize(friend.nickname)}</span>
			<span class="friend-status"></span>
			<div>
				<span style="font-size: 0.6em;" class="friend-interact"><a href="#" class="decline">Unfriend</a></span>
			</div>
		`);

		const image = $(card, 'img');
		const online = $(card, 'div');
		const nickname = $(card, '.friend-name');
		const status = $(card, '.friend-status');
		const changeStatus = (pf) => {var j=(Math.floor(Date.now() / 1e3) - pf.ping) <= 180; status.innerHTML = `${j && pf.room ? (`Playing in ${pf.room !== 'a private room' && pf.room !== 'a room' ? `<a href="/${DOMPurify.sanitize(pf.room)}">${pf.room}</a>` : DOMPurify.sanitize(pf.room)}`) : (j ? `Browsing rooms` : `Last online ${$rt(pf.ping)}`)}`;};
		changeStatus(friend);

		var cardInteractions = $(card, '.friend-interact');
		$(cardInteractions, '.decline').addEventListener('click', async (event) => {
			const data = await friendRequest(plusUserId, friend.id, settings.auth, $token(), true);
			if (data.status) card.remove();
		})

		if (!isFriend && isRecipient) {
			cardInteractions.innerHTML = `<a href="#" class="accept">Accept</a> / <a href="#" class="decline">Decline</a>`;
			$(cardInteractions, '.accept').addEventListener('click', async (event) => {
				const data = await friendRequest(plusUserId, friend.id, settings.auth, $token());
				if (data.status) {
					$('.friends .friends-list').appendChild(card);
					cardInteractions.innerHTML = `<a href="#" class="decline">Unfriend</a>`;
				}
			})
		} else if (!isFriend && !isRecipient) {
			$(cardInteractions, '.decline').textContent = `Cancel`;
			$('.friends-list.outgoing').appendChild(card);
		}

		const fetchInterval = setInterval(async () => {
			if (card) {
				var friendFetch = await getPerson(friend.id);
				var lastOnline = Math.floor(Date.now() / 1e3) - friendFetch.ping;
				var isOnline = lastOnline <= 180;
				image.src = friendFetch.picture ? `data:image/jpeg;base64,${friendFetch.picture}` : `https://jklm.fun/images/auth/guest.png`;
				online.className = isOnline ? 'friend-online' : 'friend-offline';
				nickname.innerText = friend.nickname;
				changeStatus(friendFetch);
			}
			else {
				clearInterval(fetchInterval);
			}
		}, 90 * 1e3);
	}

	const requestInput = $('.friend-request-id-input');
	const requestButton = $('.friend-request-id > button');
	requestButton.addEventListener('click', async (event) => {
		const friendId = Number(requestInput.value);

		try {
			const data = await friendRequest(plusUserId, friendId, settings.auth, $token());
			if (data) {
				if (data.status === 'success') {
					const profile = await getPerson(friendId);
					friendCard({
						status: 'pending',
						isRecipient: false,
						ping: profile.ping,
						picture: profile.picture,
						nickname: profile.nickname,
						room: profile.room
					});
				}
			}
		} catch (e) {}
	})

	getFriends(plusUserId).then(friendList => {
		if (friendList.length) {
			friendList.forEach(friend => {
				friendCard(friend);
			})
		}
	});
}
