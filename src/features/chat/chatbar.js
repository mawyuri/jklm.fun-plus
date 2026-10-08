
export function getAttachmentBar(id) {
	return $(`#${id}.attachment-bar`);
}

export function attachmentBar(id) {
	const attachmentBar = $make('div');
	attachmentBar.classList.add('attachment-bar');
	attachmentBar.id = id;
	$('.chat > .input').append(attachmentBar);
	return attachmentBar;
}

export function attachmentButton(icon, bar) {
	const button = $make('button');
	button.classList.add('attachment-button', 'material-symbols-outlined');
	button.innerText = icon;

	bar.append(button);

	return {
		activate: () => {
			button.classList.add('active');
		}, deactivate: () => {
			button.classList.remove('active');
		}, callback: (c) => {
			button.onclick = (e) => {c(e)};
		}, element: button
	}
}

export function attachmentSelect(options, def, callback, bar) {
	const select = $make('select');
	select.classList.add('attachment-select');
	for (const [key, value] of Object.entries(options)) {
		const option = $make('option')
		option.innerText = value;
		option.value = key;
		select.append(option);

		if (key === def)
			select.value = key;
	}

	select.onchange = (e) => {
		callback(e);
	};

	bar.append(select);

	return select;
}
