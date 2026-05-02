//
import { $set, $rules } from '../../features/common.js';
import * as automod from '../../features/chat/automod.js';
import { fieldset, formgroup } from '../../features/chat/fieldset.js';

export function init() {
	const automodField = fieldset('automod', '⚔️ Automod');
	const actionTable = automod.actionTable(automodField, 'Actions');
	actionTable.innerHTML = '';

	$('.manage').insertAdjacentHTML('beforeend', `<button class="styled" id="trust">Trust</button>`);

	function createRow(rule) {
		actionTable.actionRow({
			condition: {
				name: 'Name includes:',
				chat: 'Chat includes:',
				discord: 'Has Discord ID:',
				twitch: 'Has Twitch ID:'
			}, outcome: {
				ban: 'Ban player',
				kick: 'Kick player',
				moderate: 'Moderate player'
			}
		}, rule, (data) => {
			$rules[index] = data;
			$set('chat+automod', JSON.stringify($rules));
			automod.createRule(index, data);
		}, () => {
			$rules.splice(index, 1);
			$set('chat+automod', JSON.stringify($rules));
			automod.removeRule(index);
		})
	}

	if ($rules) {
		$rules.forEach((rule, index) => {
			createRow(rule);
			automod.createRule(index, rule);
		})
	} else createRow();

	$('#trust').addEventListener('click', () => {
		if (viewedUserProfile.auth) {
			var data = {
				c: viewedUserProfile.auth.service,
				i: `/${viewedUserProfile.auth.id}(@${viewedUserProfile.auth.username})?/`,
				o: 'moderate'
			};
			createRow(data);
			automod.createRule($rules.length, data);
			$set('chat+automod', JSON.stringify($rules));
		}
	});
}
