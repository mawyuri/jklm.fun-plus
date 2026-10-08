//
import { $version, $log, $isPlaying, $waitUntilElement, $get, $set } from './features/common.js';
import * as api from './features/backend.js';
import './style.css';

$log(`JKLM.fun+ Initialized`);
if ($isPlaying(location) && location.host === 'jklm.fun') {
	$waitUntilElement('a.settings').then(async (element) => {
		const 	ping	= await import('./scripts/ping.js'),
				automod = await import('./scripts/chat/automod.js'),
				options	= await import('./scripts/chat/options.js'),
				chat 	= await import('./scripts/chat/chat.js');

		automod.init();
		options.init();
		chat.init();
		gameWindow.postMessage({name: 'jklm.fun+'}, '*')
	});
} else if (location.host.match(/(phoenix|falcon)/i)) {
	if (location.pathname.includes("bombparty")) {
		// Bombparty
		parentWindow.postMessage({name: 'gameInit+bombparty'}, '*');
		window.addEventListener("message", (d) => {
			switch (d.data.name) {
				case "jklm.fun+":
					parentWindow.postMessage({name: 'gameInit+bombparty'}, '*');
					break;
				case "bombparty+hyphenBind":
					$set('bombparty+hyphenBind', d.data.bind);
					break;
			}
		})

		$waitUntilElement("form > input.styled").then(async (input) => {
			input.addEventListener("keydown", (e) => {
				const hyphenBind = $get('bombparty+hyphenBind', 'Minus');
				if (e.code === hyphenBind) {
					e.preventDefault();

					const start = input.selectionStart;
					const end = input.selectionEnd;
					const originalValue = input.value;
					input.value = originalValue.slice(0, start) + '-' + originalValue.slice(end);
					input.selectionStart = input.selectionEnd = start + 1;

					const inputEvent = new InputEvent('input', {
						bubbles: true,
						cancelable: true,
						inputType: 'insertText',
						data: '-'
					});
					input.dispatchEvent(inputEvent);
				}
			})
		})
	} else {
		parentWindow.postMessage({name: 'gameInit+other'}, '*');
	}
} else {
	// In lobby/homepage
	const	authModal	= await import('./scripts/home/authModal.js'),
			friends		= await import('./scripts/home/friends.js'),
			ping		= await import('./scripts/ping.js');

	authModal.init();
	friends.init();

	$('.links').insertAdjacentHTML('beforeend', `
		<br><span class="comment" style="color:black;">
			<a target="_blank" href="https://github.com/mawyuri/jklm.fun-plus">JKLM.fun+</a>
			made with ❤️ by
			<a target="_blank" href="https://github.com/mawyuri">mawy</a>
		</span>
	`);
	$('h1>a').textContent += '+';

	fetch('https://api.github.com/repos/mawyuri/jklm.fun-plus/releases/latest').then(response => response.json())
	.then(data => {
		if (data) {
			if (data.tag_name !== $version) {
				$('.friends').insertAdjacentHTML('afterend', `
					<div class="enjoyJklm">➕ Your version of JKLM.fun+ might be outdated. <a href="https://github.com/mawyuri/jklm.fun-plus/releases/latest">Install</a> the latest version for a more stable experience.</div>
				`);
			}
		}
	})
}
