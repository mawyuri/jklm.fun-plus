//
import { $log, $get, $set, $token } from '../../features/common.js';
import { plusAuthId, plusUserId } from '../../features/auth.js';
import { getPlusId, getFriends, friendRequest } from '../../features/backend.js';
import { createContextContainer, contextMenu } from '../../features/chat/context.js';
import { attachmentBar, attachmentButton, attachmentSelect } from '../../features/chat/chatbar.js';

export function init() {
	const chatLog = $('.log.darkScrollbar');
	const chatArea = $('textarea');
	const emojiMenu = $('.emojiOptions');

	const fetchCallbacks = new Map();
	const uploadCallbacks = new Map();
	window.addEventListener('message', (e) => {
		const { id, response } = e.data;
		if (!response) return;

		if (fetchCallbacks.has(id)) {
			const callback = fetchCallbacks.get(id);

			const mockResponse = {
				status: response.status,
				headers: {
					get: (key) => response.headers[key.toLowerCase()]
				},
				text: () => {
					if (response.dataType === 'json') return Promise.resolve(JSON.stringify(response.body));
					return Promise.resolve(response.body);
				},
				json: () => {
					if (response.dataType === 'text') return Promise.resolve(JSON.parse(response.body));
					return Promise.resolve(response.body);
				},
				blob: () => {
					if (response.dataType === 'binary') {
						const uint8 = new Uint8Array(response.body);
						const contentType = response.headers['content-type'] || 'application/octet-stream';
						return Promise.resolve(new Blob([uint8], { type: contentType }));
					}
					throw new Error("Response was not fetched as binary");
				},
				arrayBuffer: () => {
					if (response.dataType === 'binary') {
						const uint8 = new Uint8Array(response.body);
						return Promise.resolve(uint8.buffer);
					}
					throw new Error("Response was not fetched as binary");
				}
			};

			callback(mockResponse);
			fetchCallbacks.delete(id);
		}
		else if (e.data.type === 'CRX_FileUpload_Response') {
			const { id, response } = e.data;

			if (uploadCallbacks.has(id)) {
				const callback = uploadCallbacks.get(id);
				callback(response);
				uploadCallbacks.delete(id);
			}
		}
	});

	function newId() {
		return Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
	}

	if (chatArea && socket) {
		socket.on('setGame', () => {$('iframe').src += '?'});

		const chatbar = attachmentBar('main');
		const uploadBar = attachmentBar('uploads');
		uploadBar.style.display = 'none';
		uploadBar.style.height = '3.5em';
		uploadBar.style.overflowX = 'scroll';
		chatLog.after(uploadBar);

		const uploadQueue = new Array();
		const queueElements = new Array();
		uploadQueue.clear = function() {
			let writeIndex = 0;
			for (let i = 0; i < uploadQueue.length; i++) {
				if (uploadQueue[i] !== null) {
					uploadQueue[writeIndex] = uploadQueue[i];
					writeIndex++;
				}
			}
			uploadQueue.length = writeIndex;
		}

		uploadQueue.update = function() {
			if (uploadQueue.length > 0) {
				uploadBar.style.display = '';
				for (const [index, url] of uploadQueue.entries()) {
					if (typeof(url) !== 'string') continue;

					if (queueElements[index]) {
						const queueElement = queueElements[index];
						queueElement.style = '';
					}
				}
			} else {
				uploadBar.style.display = 'none';
				uploadBar.replaceChildren();
			}
		}

		const uploadButton = attachmentButton('add_circle', chatbar);
		uploadButton.callback(() => {
			uploadButton.activate();

			const fileInput = $make('input');
			const allowedTypes = ['image/*', 'video/*'];
			fileInput.accept = '' + allowedTypes.join(',');
			fileInput.type = 'file';
			fileInput.click();

			fileInput.addEventListener('change', async (event) => {
				const files = fileInput.files;
				const uploadUrl = $get('chat+uploader', 'https://catbox.moe/user/api.php');

				const uploadPromises = Array.from(files).map(async (file) => {
					if (!allowedTypes.some(type => file.type.match(type))) {
						alert(`File type not allowed: ${file.type}`);
						return;
					}

					const index = uploadQueue.length;
					const arrayBuffer = await file.arrayBuffer();
					const blob = new Blob([arrayBuffer], { type: file.type });
					const uploadId = newId();
					const detail = {
						id: uploadId,
						fileName: file.name,
						fileType: file.type,
						fileData: Array.from(new Uint8Array(arrayBuffer)),
						domain: uploadUrl
					}

					uploadCallbacks.set(uploadId, function(response) {
						const data = response.data;
						if (uploadUrl.includes('catbox.moe')) {
							uploadQueue[index] = data;
						} else {
							uploadQueue[index] = data.file_url;
						}

						queueElements[index] = $make('div', uploadBar);
						const queueElement = queueElements[index];
						queueElement.classList.add("upload-container");
						
						const deathButton = $make('button', queueElement);
						deathButton.classList.add('upload-delete');
						deathButton.addEventListener('click', () => {
							queueElement.remove();
							if (queueElements[index] != null)
								queueElements[index] = null;
							uploadQueue[index] = null;
						})

						const queueImage = $make('img', queueElement);
						queueImage.classList.add("uploaded-img");
						queueImage.src = uploadQueue[index];
						uploadQueue.update();
					});

					uploadQueue[index] = URL.createObjectURL(blob);
			  		window.postMessage({type: 'CRX_FileUpload', detail: detail}, '*');
	  			});

	  			Promise.all(uploadPromises).then((results) => {
					results.forEach((result) => {
						uploadButton.deactivate();
					});
				});
			})
		});

		var chatCounter = 0;
		var currentEmoji = 0;
		var currentReply = 0;
		var isReplying = false;
		const chatCallback = afterAppendingToChat;
		createContextContainer();

		chatArea.removeEventListener('keydown', onChatTextAreaKeyDown);
		onChatTextAreaKeyDown = function(e, chat) {
			if (!e.shiftKey && e.keyCode === 13) {
				e.preventDefault();
				if (chatArea.value.trim().length > 0 || uploadQueue.length > 0) {
					if (uploadQueue.length > 0) {
						for (let i = 0; i < uploadQueue.length; i++) {
							if (typeof(uploadQueue[i]) !== 'string') continue;
							chat += ' ' + uploadQueue[i];
							uploadQueue[i] = null;
							if (queueElements[i] != null)
								queueElements[i].remove();
							queueElements[i] = null;
						}

						uploadQueue.clear();
						uploadQueue.update();
						uploadBar.replaceChildren();
						uploadBar.style.display = 'none';
					}

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
			if (emojiMenu && !emojiMenu.hidden && emojiMenu.children.length > 0) {
				emojiMenu.style.bottom = '4.5em';

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
			const message = $('.log > div:not(.chatMessage):not(.chat-message)');
			message.classList.add('chat-message');

			if ($(message, '.author')) { // Attached to an author, not system
				message.id = `cid-${chatCounter}`;
				message.classList.add('chatMessage');
				chatCounter++;

				const messageAuthor = +$(message, '.author').dataset.peerId;
				const textMessage = $(message, '.text');
				var originalText = textMessage.textContent;
				var translatedText = null;
				const replyRegExp = /^\@?(.+): ([^:]+)[\n|\r]+([^:]+)$/gm.exec(textMessage.textContent);
				if (replyRegExp !== null && replyRegExp.length > 0) {
					message.insertAdjacentHTML('afterbegin', `
						<span class="chat-reply" style="${$get('partyplus_settings-timestampFormat', 0) == '1' ? 'padding-left: 4.5em;' : ''}">
						</span>
					`);

					$(message, '.chat-reply').textContent = `↱ ${replyRegExp[1]}: ${replyRegExp[2]}`;
					textMessage.innerHTML = linkifyText(replyRegExp[3]);
					originalText = textMessage.textContent;
				}

				const links = $$(textMessage, 'a');
				for (const [index, link] of links.entries()) {
					const fetchId = newId();
					fetchCallbacks.set(fetchId, function(response) {
						const fileType = response.headers.get('content-type');
						if (fileType.startsWith('video')) {
							const videoElement = $make('video');
							const sourceElement = $make('source', videoElement);
							sourceElement.src = links[index].href;
							sourceElement.type = fileType;

							videoElement.classList.add("attachment-chat");
							videoElement.controls = true;
							links[index].remove();

							message.append(videoElement);
							videoElement.before($make('br'));
						}
						else if (fileType.startsWith('image')) {
							const imageElement = $make('img');
							imageElement.src = links[index].href;
							imageElement.classList.add("attachment-chat");
							links[index].remove();

							message.append(imageElement);
							imageElement.before($make('br'));
						}
					})

					window.postMessage({type: 'CRX_Fetch', detail: {
						id: fetchId,
						domain: link.href.replace("http://", "https://"),
						options: null
					}}, '*');
				}

				function replyToMessage(id) {
					isReplying = isReplying ? (!currentReply == id) : true;
					currentReply = id;
					/* chatArea.dispatchEvent(new KeyboardEvent('keydown', {
						key: 'Enter',
						code: 'Enter',
						keyCode: 13,
						which: 13,
						bubbles: true,
						cancelable: true
					})); */
				}

				message.addEventListener('contextmenu', () => {
					const contextItems = [
						(true) ? {
							id: 'copy',
							icon: 'content_copy',
							text: 'Copy',
							color: 'white',
							callback: () => {
								navigator.clipboard.writeText(textMessage.textContent);
							}
						} : null,

						(true) ? {
							id: 'reply',
							icon: 'reply',
							text: 'Reply',
							color: 'white',
							callback: () => {
								replyToMessage(myId);
							}
						} : null,

						(true) ? {
							id: 'trans',
							icon: 'translate',
							text: originalText === textMessage.textContent ? 'Translate' : 'View original',
							color: 'white',
							callback: () => {
								if (originalText !== textMessage.textContent) {
									textMessage.textContent = originalText;
									textMessage.style.fontStyle = 'normal';
									return;
								}

								if (translatedText != null) {
									textMessage.textContent = translatedText;
									textMessage.style.fontStyle = 'italic';
									return;
								}

								fetch(`https://translate-pa.googleapis.com/v1/translate?params.client=gtx&dataTypes=TRANSLATION&key=AIzaSyDLEeFI5OtFBwYBIoK_jj5m32rZK5CkCXA&query.sourceLanguage=auto&query.targetLanguage=${$get('chat+transLang', 'en')}&query.text=${textMessage.textContent}`)
								.then(r => r.json())
								.then(response => {
									if (response.translation.toLowerCase() == textMessage.textContent.toLowerCase()) return;
									translatedText = response.translation;
									textMessage.textContent = translatedText;
									textMessage.style.fontStyle = 'italic';
								})
							}
						} : null,

						(selfRoles.includes('leader') || selfRoles.includes('moderator')) ? {
							id: 'm-kick',
							icon: 'person_remove',
							text: 'Kick',
							color: 'red',
							callback: () => {
								socket.emitWithAck('setUserBanned', messageAuthor, true);
								socket.emitWithAck('setUserBanned', messageAuthor, false);
							}
						} : null,

						(selfRoles.includes('leader') || selfRoles.includes('moderator')) ? {
							id: 'm-ban',
							icon: 'block',
							text: 'Ban',
							color: 'red',
							callback: () => {
								socket.emitWithAck('setUserBanned', messageAuthor, true);
							}
						} : null,
					];

					contextMenu(event, contextItems);
				});

				message.addEventListener('dblclick', (event) => {
					event.preventDefault();
					replyToMessage(myId);
				});
			}
		};

		if ($$('.log > div:not(.chatMessage):not(.chat-message)')) {
			$$('.log > div:not(.chatMessage):not(.chat-message)').forEach(e => {
				if ($(e, 'span.text')) {
					afterAppendingToChat();
				}
			});
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
		};
	}
}
