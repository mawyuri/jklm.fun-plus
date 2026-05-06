//
import { $log, $get, $set, $token } from '../../features/common.js';
import { plusAuthId, plusUserId } from '../../features/auth.js';
import { getPlusId, getFriends, friendRequest } from '../../features/backend.js';
import { languages } from '../../features/languages.js';

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
			if (!emojiMenu.hidden && emojiMenu) {
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

				if (emojiMenu.children.length > 0){
					Array.from(emojiMenu.children).forEach(el => el.style.backgroundColor = 'rgba(0,0,0,0)');
					emojiMenu.children[currentEmoji].style.backgroundColor = 'rgba(0,0,0,0.5)';
				}

				if (event.key === 'Enter') {
					event.preventDefault();
					if (emojiMenu.children.length > 0) emojiMenu.children[currentEmoji].click();
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
					`).join('\n');

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
				});

				const originalText = textMessage.textContent;
				fetch(`https://translate-pa.googleapis.com/v1/translate?params.client=gtx&dataTypes=TRANSLATION&key=AIzaSyDLEeFI5OtFBwYBIoK_jj5m32rZK5CkCXA&query.sourceLanguage=auto&query.targetLanguage=${$get('chat+transLang', 'en')}&query.text=${textMessage.textContent}`)
				.then(r => r.json())
				.then(response => {
					if (response.translation.toLowerCase() == textMessage.textContent.toLowerCase()) return;
					if (response.detectedLanguages.srclang != $get('chat+transLang', 'en')) {
						var transButton = $make('button');
						transButton.classList.add('chat-translate');
						transButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-translate" viewBox="0 0 16 16"><path d="M4.545 6.714 4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286zm1.634-.736L5.5 3.956h-.049l-.679 2.022z"></path><path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm7.138 9.995q.289.451.63.846c-.748.575-1.673 1.001-2.768 1.292.178.217.451.635.555.867 1.125-.359 2.08-.844 2.886-1.494.777.665 1.739 1.165 2.93 1.472.133-.254.414-.673.629-.89-1.125-.253-2.057-.694-2.82-1.284.681-.747 1.222-1.651 1.621-2.757H14V8h-3v1.047h.765c-.318.844-.74 1.546-1.272 2.13a6 6 0 0 1-.415-.492 2 2 0 0 1-.94.31"></path></svg>'
						textMessage.after(transButton);

						transButton.addEventListener('click', () => {
							if (textMessage.textContent == originalText) {
								textMessage.textContent = response.translation;
								textMessage.style.fontStyle = 'italic';
							}

							else {
								textMessage.textContent = originalText;
								textMessage.style.fontStyle = 'normal';
							}
						});
					}
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
