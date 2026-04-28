//
import DOMPurify from 'dompurify';
import { getFriends, getPerson, friendRequest } from '../../features/backend.js';
import { plusAuthId, plusUserId } from '../../features/auth.js';
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
					: `<span style="font-size:1em;">You don't have a JKLM.fun+ account linked to your ${settings.auth.service.charAt(0).toUpperCase() + settings.auth.service.slice(1)} account yet.</span><button id="jklm+" class="styled">Create JKLM.fun+ account</button>`)}
			</div>
		</div>
	`);

	if ($('#jklm\\+')) {
		$('#jklm\\+').addEventListener('click', event => {
			const account = createAccount(settings.auth, plusAuthId, $token(), settings.nickname, settings.picture);
			if (account.id) {
				location.refresh(true);
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
			<header>Friend requests</header>
			<div class="friends-list"></div>
		</div>
	`);

	function friendCard(friend) {
		const isFriend = friend.status === 'friend';
		var lastOnline = Math.floor(Date.now() / 1e3) - friend.ping;
		var isOnline = lastOnline <= 180;
		var picture = friend.picture ? `data:image/jpeg;base64,${friend.picture}` : `https://jklm.fun/images/auth/guest.png`;
		var room = friend.room
		const card = $make('div', isFriend ? $(friendsList, '.friends-list') : $('.requests .friends-list'));
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
		const changeStatus = (pf) => status.innerHTML = `${isOnline && room ? `Playing in <a href="/${DOMPurify.sanitize(room)}">${room}</a>` : (isOnline ? `Browsing rooms` : `Last online ${$rt(pf.ping)}`)}`;
		changeStatus(friend);

		var cardInteractions = $(card, '.friend-interact');
		$(cardInteractions, '.decline').addEventListener('click', event => {
			const data = friendRequest(plusUserId, friend.id, settings.auth, $token(), true);
			if (data.status) card.remove();
		})

		if (!isFriend) {
			$(cardInteractions).innerHTML = `<a href="#" class="accept">Accept</a> / <a href="#" class="decline">Decline</a>`;
			$(cardInteractions, '.accept').addEventListener('click', event => {
				const data = friendRequest(plusUserId, friendFetch.id, settings.auth, $token());
				if (data.status) {
					$('.friends-list').appendChild(card);
					$(cardInteractions).innerHTML = `<a href="#" class="decline">Unfriend</a>`;
				}
			})
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

	getFriends(plusUserId).then(friendList => {
		if (friendList) {
			friendList.forEach(friend => {
				friendCard(friend);
			})
		}
	});
}
