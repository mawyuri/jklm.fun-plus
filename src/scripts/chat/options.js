//
import { $log, $get, $set } from '../../features/common.js';
import { fieldset, formgroup } from '../../features/chat/fieldset.js';
import { languages } from '../../features/languages.js';

export function init() {
	const plusOptions = fieldset('plusOptions', '⚙️ Chat+ Options');
	const tabPos = formgroup(plusOptions, `
		<label>Tab positioning</label>
		<select>
			<option value="1" selected>Top</option>
			<option value="0">Bottom</option>
		</select>
	`);

	const chatDir = formgroup(plusOptions, `
		<label>Chat direction</label>
		<select>
			<option value="0">Messages stick to the top</option>
			<option value="1">Messages stick to the bottom</option>
		</select>
	`);

	const transLang = formgroup(plusOptions, `
		<label>Translator language</label>
		<select></select>
	`);

	const uploadingProvider = formgroup(plusOptions, `
		<label>Uploading provider</label>
		<select>
			<option value="https://catbox.moe/user/api.php">Catbox.moe</option>
			<option value="https://frisk.page/api/files/upload">Frisk.page</option>
		</select>

		<small>By using this provider, you agree to its terms and policies. ("no illegal content")</small>
	`);

	const tabPosSelector = $(tabPos, 'select');
	const chatDirSelector = $(chatDir, 'select');
	const transLangSelector = $(transLang, 'select');
	const uploadingProviderSelector = $(uploadingProvider, 'select');

	Object.entries(languages).forEach(([langCode, langName]) => {
		var langOption = $make('option', transLangSelector);
		langOption.value = langCode;
		langOption.innerText = langName;
	});

	if ($get('chat+tabsPosition', null)) tabPosSelector.value = $get('chat+tabsPosition');
	if ($get('chat+chatFlow', null)) chatDirSelector.value = $get('chat+chatFlow');
	if ($get('chat+transLang', null)) transLangSelector.value = $get('chat+transLang');
	if ($get('chat+uploader', null)) uploadingProviderSelector.value = $get('chat+uploader');

	function onTabChange(value) {
		$set('chat+tabsPosition', value);
		if (value == 0) $('.sidebar').appendChild($('.tabs'));
		else $('.sidebar').insertBefore($('.tabs'), $('.chat.pane'));
	}

	function onChatChange(value) {
		$set('chat+chatFlow', value);
		if (value == 1) $('.log.darkScrollbar').classList.add('chat-bottom');
		else $('.log.darkScrollbar').classList.remove('chat-bottom');
	}

	function onLangChange(value) {
		$set('chat+transLang', value);
	}

	function onUploaderChange(value) {
		$set('chat+uploader', value);
	}

	tabPosSelector.addEventListener('change', event => onTabChange(event.target.value));
	chatDirSelector.addEventListener('change', event => onChatChange(event.target.value));
	transLangSelector.addEventListener('change', event => onLangChange(event.target.value));
	uploadingProviderSelector.addEventListener('change', event => onUploaderChange(event.target.value));
	onTabChange(tabPosSelector.value);
	onChatChange(chatDirSelector.value);
	onLangChange(transLangSelector.value);
	onUploaderChange(uploadingProviderSelector.value);

	$('a.settings').addEventListener('click', () => {
		$hide('.userProfile');
	})

	let bombpartyInitialized = false;
	function initBombparty(childWindow) {
		bombpartyInitialized = true;
		const bpOptions = fieldset('bpOptions', '💣 BombParty+ Options');
		const hyphenBind = formgroup(bpOptions, `
			<label>Hyphen bind</label>
			<input placeholder="Press a key...">
		`);

		const hyphenBindInput = $(hyphenBind, 'input');

		if ($get('bombparty+hyphenBind', null)) hyphenBindInput.value = $get('bombparty+hyphenBind');

		function hyphenBindInputChanged(target, code) {
			const input = target;
			input.value = `${code}`;
			input.blur();
			$set('bombparty+hyphenBind', code);
			childWindow.postMessage({ name: 'bombparty+hyphenBind', bind: code }, '*')
		}

		hyphenBindInput.addEventListener('keydown', e => hyphenBindInputChanged(e.target, e.code));
		hyphenBindInputChanged(hyphenBindInput, hyphenBindInput.value);
	}

	let childWindow;
	window.addEventListener("message", (d) => {
		childWindow = d.source;
		switch (d.data.name) {
			case "gameInit+bombparty":
				if (!bombpartyInitialized)
					initBombparty(childWindow);
				break;
			case "gameInit+other":
				if (bombpartyInitialized){
					bombpartyInitialized = false;
					$('#bpOptions').parentNode.remove();
				}
				break;
		}
	})
}
