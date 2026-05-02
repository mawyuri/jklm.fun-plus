//
import { $log } from '../common.js';

const settings = $('.darkSettings.darkScrollbar');
export function fieldset(id, text) {
	var set = $make('fieldset');
	var option = $make('div', set);
	var label = $make('div', option);

	option.classList.add('setting', id);
	option.id = id;

	label.classList.add('label');
	label.innerText = text;
	label.style.backgroundColor = 'rgba(255,255,255,.1)';
	label.style.cursor = 'pointer';

	var field = $make('div', option);
	field.classList.add('field');
	field.style.display = 'none';

	label.addEventListener('click', event => {
		event.preventDefault();
		field.style.display = field.style.display === 'none' ? '' : 'none';
	})

	settings.prepend(set);
	return field;
}

/* Custom elements */
export function formgroup(field, html) {
	var form = $make('div', field);
	form.classList.add('formgroup');
	form.innerHTML = html;
	return form;
}
