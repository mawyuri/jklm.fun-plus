//
import { $log } from '../common.js';
const settings = $('.darkSettings.darkScrollbar');
var activeListeners = new Map();

export const inputMatcher = (pattern, value) => {
	const exp = pattern.match(/\/(.*)\/(.*)/);
	if (exp){
		const regexp = new RegExp(exp[1], exp[2] || 'gmi');
		return regexp.test(value);
	}
	return value.includes(pattern);
}

export function actionExecute(outcome, peer) {
	if (outcome === 'ban') socket.emitWithAck('setUserBanned', peer, true);
	if (outcome === 'moderate') socket.emitWithAck('setUserModerator', peer, true);
	if (outcome === 'kick') {
		socket.emitWithAck('setUserBanned', peer, true);
		socket.emitWithAck('setUserBanned', peer, false);
	}
}

export function actionTable(field, name) {
	var actionArray = {};
	var label = $make('label', field);
	label.innerHTML = name;

	var table = $make('div', field);
	table.classList.add('actionTable');
	table.style.backgroundColor = 'rgba(0,0,0,.5)';

	actionArray.actionRow = function(preset, values, updateCallback, removeCallback) {
		var row = $make('div', table);
		row.classList.add('action-row');

		var condition = $make('select', row);
		var parameter = $make('input', row);
		var outcome = $make('select', row);
		condition.style.width = '40%';
		parameter.style.width = '60%';
		parameter.placeholder = '...';

		condition.innerHTML = `<option disabled selected hidden>Condition</option>`;
		outcome.innerHTML = `<option disabled selected hidden>Outcome</option>`;

		var removeButton = $make('button', row);
		removeButton.classList.add('action-remove');
		removeButton.innerText = 'Remove action';

		var spacer = $make('hr', row);
		spacer.style.margin = '5px';
		spacer.style.borderColor = 'grey';
		spacer.style.width = '100%';

		if (values && values.i)
			parameter.value = values.i;

		for (const [id, name] of Object.entries(preset.condition)) {
			var con = $make('option', condition);
			con.value = id;
			con.innerText = name;

			if (values && values.c === id)
				con.selected = true;
		}

		for (const [id, name] of Object.entries(preset.outcome)) {
			var out = $make('option', outcome);
			out.value = id;
			out.innerText = name;

			if (values && values.o === id)
				out.selected = true;
		}

		const update = () => {
			updateCallback({
				c: condition.value,
				i: parameter.value,
				o: outcome.value
			});
		}

		$$(row, 'select, input').forEach(element => element.onchange = update);
		$(row, '.action-remove').addEventListener('click', () => {
			row.remove();
			removeCallback();
		});
	}

	actionArray.table = {};
	actionArray.tableElement = table;
	return actionArray;
}

export function createRule(id, {c: condition, i: input, o: outcome}) {
	removeRule(id);

	if (input == false) return;

	let listener;
	if (condition === 'name') {
		listener = (data) => {
			if (inputMatcher(input, data.nickname))
				actionExecute(outcome, data.peerId);
		}
		socket.on('chatterAdded', listener);
		socket.emit('getChatterProfiles', (profiles) => {
			profiles.forEach(p => {if (!p.roles.includes('banned')) listener(p)});
		});
	}
	else if (condition === 'twitch' || condition === 'discord') {
		listener = (data) => {
			if (inputMatcher(input, (data.auth && (data.auth.service === condition)) ? data.auth.id : null)){
				actionExecute(outcome, data.peerId);
			}
		}
		socket.on('chatterAdded', listener);
		socket.emit('getChatterProfiles', (profiles) => {
			profiles.forEach(p => {if (!p.roles.includes('banned')) listener(p)});
		});
	}
	else if (condition === 'chat') {
		listener = (profile, text) => {
			if (inputMatcher(input, text))
				actionExecute(outcome, profile.peerId);
		}
		socket.on('chat', listener)
	}

	if (listener) activeListeners.set(id, {type: condition, fn: listener});
}

export function removeRule(id) {
	const rule = activeListeners.get(id);
	if (rule) {
		const eventType = rule.type === 'chat' ? 'chat' : 'chatterAdded';
		socket.off(eventType, rule.fn);
		activeListeners.delete(id);
	}
}
