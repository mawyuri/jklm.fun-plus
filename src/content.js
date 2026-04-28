import {$log, $isPlaying} from './features/common.js';
import * as api from './features/backend.js';
import './scripts/ping.js';
import './style.css';

$log(`JKLM.fun+ Initialized`);
if ($isPlaying(location)) {
	// Playing a game
} else {
	// In lobby/homepage
	const	authModal	= await import('./scripts/home/authModal.js'),
			friends		= await import('./scripts/home/friends.js');

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
}
