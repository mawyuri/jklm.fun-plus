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

	const tabPosSelector = $(tabPos, 'select');
	const chatDirSelector = $(chatDir, 'select');
	const transLangSelector = $(transLang, 'select');

	Object.entries(languages).forEach(([langCode, langName]) => {
		var langOption = $make('option', transLangSelector);
		langOption.value = langCode;
		langOption.innerText = langName;
	});

	if ($get('chat+tabsPosition', null)) tabPosSelector.value = $get('chat+tabsPosition');
	if ($get('chat+chatFlow', null)) chatDirSelector.value = $get('chat+chatFlow');
	if ($get('chat+transLang', 'en')) transLangSelector.value = $get('chat+transLang', 'en');

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

	$(tabPos, 'select').addEventListener('change', event => onTabChange(event.target.value));
	$(chatDir, 'select').addEventListener('change', event => onChatChange(event.target.value));
	transLangSelector.addEventListener('change', event => onLangChange(event.target.value));
	onTabChange(tabPosSelector.value);
	onChatChange(chatDirSelector.value);
	onLangChange(transLangSelector.value);

	$('a.settings').addEventListener('click', () => {
		$hide('.userProfile');
	})
}
