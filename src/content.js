//
import { $version, $log, $isPlaying, $waitUntilElement } from './features/common.js';
import * as api from './features/backend.js';
import './style.css';

$log(`JKLM.fun+ Initialized`);
if ($isPlaying(location)) {
	$waitUntilElement('a.settings').then(async (element) => {
		const 	ping	= await import('./scripts/ping.js'),
				automod = await import('./scripts/chat/automod.js'),
				options	= await import('./scripts/chat/options.js'),
				chat 	= await import('./scripts/chat/chat.js');

		automod.init();
		options.init();
		chat.init();
	});
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
