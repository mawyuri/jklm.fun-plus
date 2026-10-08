
import { win, html, doc } from '../common.js';
const getBounds = () => {
	return [win.innerWidth || html.clientWidth, win.innerHeight || html.clientHeight];
}

const isOutOfBounds = (e) => {
 	const rect = e.getBoundingClientRect();
  	return [(
		rect.top < 0 ||
		rect.left < 0 ||
   	 	rect.bottom > (win.innerHeight || html.clientHeight) ||
		rect.right > (win.innerWidth || html.clientWidth)
  	), rect.bottom, rect.right];
};

export function createContextContainer() {
	const container = $make('div');
	container.classList.add('ctx-menu');
	container.style.display = 'none';
	$('body').append(container);

	doc.addEventListener('click', () => {
		container.style.display = 'none';
	});

	return container;
}

export function contextMenu(e, items) {
	// From a contextmenu event
	e.preventDefault();

	const contextMenu = $('.ctx-menu');
	contextMenu.style.display = `flex`;
	contextMenu.style.inset = '';
	contextMenu.style.left = `${e.pageX}px`;
	contextMenu.style.top = `${e.pageY}px`;
	contextMenu.innerHTML = '';

	for (const ctx of items) {
		if (ctx === null)
			continue;
		const contextItem = $make('button', contextMenu);
		contextItem.id = `ctx-${ctx.id}`;

		const contextIcon = $make('span', contextItem);
		contextIcon.classList.add('material-symbols-outlined');
		contextIcon.innerText = `${ctx.icon}`;
		contextItem.append(doc.createTextNode(` ${ctx.text}`));

		contextItem.style.color = ctx.color;
		contextItem.onclick = () => {ctx.callback()};
	}

	// Bounds calculation; done after display
	const [boundWidth, boundHeight] = getBounds();
	const [outOfBounds, boundBottom, boundRight] = isOutOfBounds(contextMenu);

	if (outOfBounds) {
		if (boundRight > boundWidth)
			contextMenu.style.left = `${(boundWidth - contextMenu.clientWidth) - (boundWidth - e.pageX)}px`;
		if (boundBottom > boundHeight)
			contextMenu.style.top = `${(boundHeight - contextMenu.clientHeight) - (boundHeight - e.pageY)}px`;
	}
};
