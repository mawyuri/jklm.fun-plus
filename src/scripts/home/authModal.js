import { $log, $token, $get, $set } from '../../features/common.js';
import { changeProfile } from '../../features/backend.js';
import { plusUserId, discordLogin, twitchLogin } from '../../features/auth.js';
import * as modal from '../../features/home/modal.js';

export function init() {
	var { nickname } = settings;
	const authModal = modal.createModal('authModal');

	function getUserPictureURL() {
		return `data:image/jpeg;base64,${settings.picture}` || `https://jklm.fun/images/auth/guest.png`;
	}

	function getUserAuthPicture() {
		return `https://jklm.fun/images/auth/${settings.auth?.service || 'guest'}.png`;
	}

	showAuthPage = function() {
		$hide('.page.auth');
		$show('.home');

		modal.openModal('authModal');
	};

	authModal.content.insertAdjacentHTML('beforeend', `
		<div class="columns section" style="display:flex;">
			<div class="auth-modal-section left">
				<form id="jklmp-profile" class="profile-form">
					<div class="form-pfp-container" style="width: 15%;">
						<img class="form-pfp-image" src="${getUserPictureURL()}" class="square" style="width:80%;">
						<p class="comment" style="margin-top: 0.1em;">Profile pictures are compressed to fit 10KB.</p>
					</div>

					<div class="form-nickname">
						<div style="width: 40px;">
							<img src="${getUserAuthPicture()}" class="form-service square">
						</div>

						<div>
							<input class="form-nickname-input" placeholder="Nickname" maxlength="20" style="padding: 0.2em;" value="${settings.nickname}">
							<p class="comment" style="margin-top: 0.1em;">This is what others will see you as.<br>Explicit/insulting names are not allowed.</p>
						</div>

						<div>
							<p class="form-service-text"></p>
							<div class="form-service-list"></div>
						</div>
					</div>
				</form>
			</div>

			<div class="auth-modal-section right">
				<div class="auth-modal-chat-log"></div>
				<textarea class="auth-modal-chat-area" placeholder="Type here to see how your messages look like in chat"></textarea>
			</div>
		</div>
	`);

	const chatlogs = $('.auth-modal-chat-log');
	const exchatarea = $('.auth-modal-chat-area');

	function exampleChat(message){
		var date = new Date();
		chatlogs.innerHTML += `<div class="exampleChat"><span style="color:#888; font-size:0.7em;">${`0${date.getHours()}`.slice(-2)}:${`0${date.getMinutes()}`.slice(-2)} </span><a style="color: rgb(238, 238, 238);"><img src="${getUserPictureURL()}" class="exampleChat profile" style="width:1em; height:auto;vertical-align: middle;margin-right: 0.25em;border-radius: 0.125em;"><img src="${getUserAuthPicture()}" class="exampleChat service" style="width:1em; height:auto;vertical-align: middle;margin-right: 0.25em;border-radius: 0.125em;">${settings.nickname}: </a><span style="color:#EEE;">${message}</span></div>`;
	}

	exchatarea.addEventListener('keydown', (event) => {
		if (!event.shiftKey && event.key === "Enter") {
			event.preventDefault();
			exampleChat(exchatarea.value.trim());
			exchatarea.value = '';
		}
	});

	function updateAuthentication() {
		updateAuthButton();
		$('.form-service').src = getUserAuthPicture();
		$set('jklmSettings', JSON.stringify(settings));
	}

	function updateProfile() {
		if (nickname !== settings.nickname){
			nickname = settings.nickname;
			return changeProfile(plusUserId, settings.auth, $token(), settings.nickname, settings.picture);
		}
	}

	const profileForm = $('#jklmp-profile');
	const pictureChanger = $(profileForm, '.form-pfp-image');
	const pictureChanged = setupUserPictureFromUrl;
	setupUserPictureFromUrl = function(url, callback) {
		pictureChanged(url, callback);
		updateProfile();

		pictureChanger.src = getUserPictureURL();
	}

	pictureChanger.addEventListener('click', event => {
		event.preventDefault();
		$('.pictureUpload').click();
	})

	const nicknameInput = $(profileForm, '.form-nickname-input');
	nicknameInput.addEventListener('input', e => {
		settings.nickname = nicknameInput.value;
		updateAuthentication();
	});

	function makeAuthButton(type) {
		const button = $make('img', $(profileForm, '.form-service-list'));
		button.classList.add('square');
		button.style.width = '12%';
		button.src = `/images/auth/${type || 'guest'}.png`;

		button.addEventListener('click', async (event) => {
			event.preventDefault();

			if (type) {
				const authenticate = (type === 'discord' ? discordLogin : (type === 'twitch' ? twitchLogin : function() {}))
				authenticate().then(authData => {
					settings.auth = authData;
					updateAuthentication();
					updateAuthButtons();
				});
			}
			else {
				settings.auth = null;
				location.reload();
			}

			updateAuthentication();
			updateAuthButtons();
		});
	};

	function updateAuthButtons() {
		$(profileForm, '.form-service-list').replaceChildren();
		if (!settings.auth) {
			$(profileForm, '.form-service-text').textContent = `You're not logged in. Authenticate with:`;
			makeAuthButton('discord');
			makeAuthButton('twitch');
		} else {
			$(profileForm, '.form-service-text').textContent = `People can see you as ${settings.auth.username} on ${getAuthServiceName(settings.auth.service)}. Change authentication service:`;
			makeAuthButton();

			if (settings.auth === 'discord')
				makeAuthButton('twitch');
			else
				makeAuthButton('discord');
		}
	}

	updateAuthButtons();
	authModal.addCallback('close', updateProfile);

	$hide('.page.auth');
	$show('.home');
}
