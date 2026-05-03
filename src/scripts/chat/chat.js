//
import { $log, $get, $set, $token } from '../../features/common.js';
import { plusAuthId, plusUserId } from '../../features/auth.js';
import { getPlusId, getFriends, friendRequest } from '../../features/backend.js';

export function init() {
	const chatLog = $('.log.darkScrollbar');
	const chatArea = $('textarea');
	const emojiMenu = $('.emojiOptions');

	if (chatArea && socket) {
		var chatCounter = 0;
		var currentEmoji = 0;
		var currentReply = 0;
		var isReplying = false;
		const chatCallback = afterAppendingToChat;

		chatArea.removeEventListener('keydown', onChatTextAreaKeyDown);
		onChatTextAreaKeyDown = function(e, chat) {
			if (!e.shiftKey && e.keyCode === 13) {
				e.preventDefault();
				if (chatArea.value.trim().length > 0){
					socket.emit('chat', chat);
					isReplying = false;
					currentReply = 0;
					chatArea.placeholder = `Type here to chat`;

					if ($('.chatMessage')){
						$$(`.chatMessage`).forEach(el =>{
							el.classList.remove('highlight');
							el.style.backgroundColor = '';
						});
					}
				}
				chatArea.value = '';
			}
		}

		emojiMenu.hidden = true;
		chatArea.addEventListener('keydown', (event) => {
			if (!emojiMenu.hidden) {
				if (event.key === 'ArrowUp') {
					event.preventDefault();
					currentEmoji--;
				}

				if (event.key === 'ArrowDown') {
					event.preventDefault();
					currentEmoji++;
				}

				if (currentEmoji < 0) currentEmoji = emojiMenu.children.length - 1;
				if (currentEmoji > emojiMenu.children.length - 1) currentEmoji = 0;

				if (emojiMenu.children.length){
					emojiMenu.children.forEach(el => el.style.backgroundColor = 'rgba(0,0,0,0)');
					emojiMenu.children[currentEmoji].style.backgroundColor = 'rgba(0,0,0,0.5)';
				}

				if (event.key === 'Enter') {
					event.preventDefault();
					emojiMenu.children[currentEmoji].click();
				}
			}
			else {
				// Not choosing an emoji / mention
				if (event.key === 'Escape') {
					event.preventDefault();
					isReplying = false;
					currentReply = 0;
					chatArea.placeholder = `Type here to chat`;
					if ($('.chatMessage')){
						$$(`.chatMessage`).forEach(el => {
							el.classList.remove('highlight');
							el.style.cssText = '';
						});
					}
					return;
				}

				if (event.key === 'ArrowUp') {
					event.preventDefault();
					currentReply--;
					isReplying = true;
				}

				if (event.key === 'ArrowDown') {
					event.preventDefault();
					currentReply++;
					isReplying = true;
				}

				if ((currentReply < 0 || !$(`#cid-${currentReply}`) || currentReply > chatCounter) && isReplying) currentReply = chatCounter - 1;
				if ($('.chatMessage') && $(`#cid-${currentReply}`)) {
					$$(`.chatMessage`).forEach(el => el.classList.remove('highlight'));

					if (isReplying) {
						var selectedReply = $(`#cid-${currentReply}`);
						selectedReply.classList.add('highlight');
						chatArea.placeholder = `Replying to @${$(selectedReply, '.author').textContent}`;
						onChatTextAreaKeyDown(event, `${$(selectedReply, '.author').textContent}: ${$(selectedReply, '.text').textContent}\r\r${chatArea.value.trim()}`);
					}
					else {
						chatArea.placeholder = `Type here to chat`;
						onChatTextAreaKeyDown(event, chatArea.value.trim());
					}
				}
				else {
					chatArea.placeholder = `Type here to chat`;
					onChatTextAreaKeyDown(event, chatArea.value.trim());
				}
			}
		});

		chatArea.addEventListener('input', (event) => {
			const text = chatArea.value;
			const words = text.split(/\s+/);
			const lastWord = words[words.length - 1];

			if (lastWord.startsWith('@')) {
				const query = lastWord.slice(1).toLowerCase();
				socket.emit('getChatterProfiles', (profiles) => {
					const matches = profiles.filter(p =>
						p.nickname.toLowerCase().includes(query) &&
						!p.roles.includes('banned')
					);

					if (matches.length === 0) return $hide(emojiMenu);
					emojiMenu.innerHTML = matches.map(user => `
						<span class="emojiOption mentioner" data-input="${lastWord}" data-emoji="@${user.nickname}">
							<img class="picture square" style="width: 10%;" src="${user.picture ? 'data:image/jpeg;base64,' + user.picture : 'https://jklm.fun/images/auth/guest.png'}">
							<span>@${user.nickname}</span>
						</span>
					`);

					emojiMenu.hidden = false;
					emojiMenu.style.display = '';
				})
			} else {
				if (!lastWord.startsWith(':')){
					emojiMenu.hidden = true;
					currentEmoji = 0;
				}

				else {
					emojiMenu.hidden = false;
					emojiMenu.style.display = '';
				}
			}
		})

		afterAppendingToChat = function() {
			chatCallback();
			if ($('.newMessages'))
				$('.newMessages').classList.add('chat-message');
			const myId = chatCounter;
			const message = $('.log > div:last-of-type');
			message.classList.add('chat-message');

			if ($(message, '.author')) { // Attached to an author, not system
				message.id = `cid-${chatCounter}`;
				message.classList.add('chatMessage');
				chatCounter++;

				const textMessage = $(message, '.text');
				const replyRegExp = /^\@?(.+): (.+)[\n|\r]+(.+)$/gm.exec(textMessage.textContent);
				if (replyRegExp !== null && replyRegExp.length > 0) {
					message.insertAdjacentHTML('afterbegin', `
						<span class="chat-reply" style="${$get('partyplus_settings-timestampFormat', 0) == '1' ? 'padding-left: 4.5em;' : ''}">
						</span>
					`);

					$(message, '.chat-reply').textContent = `↱ ${replyRegExp[1]}: ${replyRegExp[2]}`;
					textMessage.textContent = replyRegExp[3];
				}

				message.addEventListener('dblclick', (event) => {
					event.preventDefault();

					isReplying = isReplying ? (!currentReply == myId) : true;
					currentReply = myId;
					chatArea.dispatchEvent(new KeyboardEvent('keydown', {
						key: 'Enter',
						code: 'Enter',
						keyCode: 13,
						which: 13,
						bubbles: true,
						cancelable: true
					}));
				})
			}
		};

		if ($$('div[class=""], div[class="system"], div[class="highlight"]')) {
			// Loaded before initialization
			$$('div[class=""], div[class="system"], div[class="highlight"]').forEach(e => e.remove());
		}

		// Socket events
		const renderProfile = renderViewedUserProfile;
		var storedRoles = [];
		socket.on('setSelfRoles', (roles) => {
			for (const role of roles) {
				if (!storedRoles.includes(role))
					appendToChat(null, `${badgesByRole[role].icon} You have been granted the ${badgesByRole[role].text} role.`);
			}

			for (const role of storedRoles) {
				if (!roles.includes(role))
					appendToChat(null, `${badgesByRole[role].icon} You have been demoted from the ${badgesByRole[role].text} role.`);
			}

			storedRoles = roles;
		})

		renderViewedUserProfile = function() {
			renderProfile();

			const profile = viewedUserProfile;
			if (profile.auth && profile.auth.id !== plusAuthId) {
				getPlusId(profile.auth.id).then(id => {
					if (id && plusUserId !== id && settings.auth) {
						$('.userProfile .badges').insertAdjacentHTML('beforeend', `
							<div>➕️ JKLM.fun+ ID: ${id}</div>
							<button id="request" class="styled">Add friend</button>
						`);

						var isFriends = false;
						var requested = false;
						var isPending = false;
						getFriends(id).then(friends => {
							if (friends.length > 0) {
								for (var i = 0; i < friends.length; i++) {
									var friend = friends[i];
									if (friend.id === plusUserId) {
										isFriends = (friend.status === 'friend');
										isPending = (friend.status === 'pending');
										requested = (!isFriends && friend.isRecipient);
										break;
									}
								}

								if (isFriends || requested) {
									$('#request').textContent = isFriends ? `Remove friend` : `Cancel request`;
									$('#request').addEventListener('click', async () => {
										await friendRequest(plusUserId, id, settings.auth, $token(), true);
										renderViewedUserProfile();
									})
								} else {
									$('#request').textContent = isPending ? `Accept request` : `Add friend`;
									$('#request').addEventListener('click', async () => {
										await friendRequest(plusUserId, id, settings.auth, $token());
										renderViewedUserProfile();
									})
								}
							}
						}).catch(() => {
							$('#request').addEventListener('click', async () => {
								await friendRequest(plusUserId, id, settings.auth, $token());
								renderViewedUserProfile();
							})
						})
					}
				})
			}
		}
	}
}
