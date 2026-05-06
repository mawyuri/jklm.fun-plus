//
import { $log, $set, $rules, $refreshRules } from '../../features/common.js';
import * as automod from '../../features/chat/automod.js';
import { fieldset, formgroup } from '../../features/chat/fieldset.js';

export function init() {
	if (!$rules){
		$set('chat+automod', JSON.stringify([{c:null,i:null,o:null}]));
		$refreshRules();
	}
	const automodField = fieldset('automod', '⚔️ Automod');
	const actionTable = automod.actionTable(automodField, 'Actions');
	$('.manage').insertAdjacentHTML('beforeend', `<button class="styled" id="trust">Trust</button>`);

	function render() {
		actionTable.tableElement.innerHTML = '';

		if ($rules) {
			$rules.forEach((rule, index) => {
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
					render();
				});

				automod.createRule(index, rule);
			});
		}

		var addChild = $make('button', actionTable.tableElement);
		addChild.id = 'addchild';
		addChild.style.color = 'white';
		addChild.style.width = '100%';
		addChild.innerText = '+';

		$(actionTable.tableElement, '#addchild').onclick = function() {
			$rules.push({c: null, i: null, o: null})
			$set('chat+automod', JSON.stringify($rules));
			$refreshRules();
			render();
		}
	}

	render();

	$('#trust').addEventListener('click', () => {
		if (viewedUserProfile.auth) {
			var data = {
				c: viewedUserProfile.auth.service,
				i: `/${viewedUserProfile.auth.id}(@${viewedUserProfile.auth.username})?/`,
				o: 'moderate'
			};
			$rules.push(data);
			$set('chat+automod', JSON.stringify($rules));
			$refreshRules();
			render();
		}
	});
}
