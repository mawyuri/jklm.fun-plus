//
import { $log, $get, $set } from '../../features/common.js';
import { fieldset, formgroup } from '../../features/chat/fieldset.js';

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

	const tabPosSelector = $(tabPos, 'select');
	const chatDirSelector = $(chatDir, 'select');
	if ($get('chat+tabsPosition', null)) tabPosSelector.value = $get('chat+tabsPosition');
	if ($get('chat+chatFlow', null)) chatDirSelector.value = $get('chat+chatFlow');

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

	$(tabPos, 'select').addEventListener('change', event => onTabChange(event.target.value));
	$(chatDir, 'select').addEventListener('change', event => onChatChange(event.target.value));
	onTabChange(tabPosSelector.value);
	onChatChange(chatDirSelector.value);

	$('a.settings').addEventListener('click', () => {
		$hide('.userProfile');
	})
}
