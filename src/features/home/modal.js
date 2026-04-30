//
try {$('body');} catch {throw Error('Home modules cannot be imported into ISOLATED world');}

export function createModal(id) {
	var callbacks = {};
	var modalArray = {};
	const modal = $make('div');
	modal.id = id;
	modal.classList.add('jklmp-modal');
	document.body.prepend(modal);

	modal.addEventListener('click', e => {
		if (e.target === modal)
			closeModal(id, callbacks.close || null);
	})

	const modalContent = $make('div', modal);
	modalContent.classList.add('jklmp-modal-content');

	const closeButton = $make('div', modalContent);
	closeButton.classList.add('jklmp-modal-close');
	closeButton.innerText = 'x';
	closeButton.addEventListener('click', e => {
		e.preventDefault();
		closeModal(id, callbacks.close || null);
	})

	modalArray.addCallback = function(name, callback) {
		callbacks[name] = callback;
	}
	modalArray.content = modalContent

	return modalArray;
}

export function openModal(id) {
	const modal = $(`#${id}`);
	document.body.style.overflowY = 'hidden';
	modal.style.display = 'block';
}

export function closeModal(id, callback) {
	const modal = $(`#${id}`);
	document.body.style.overflowY = 'scroll';
	modal.style.display = 'none';

	if (callback)
		callback();
}
