// Common Shit.
export const $version = '1.0.2.3';

export const win = window;
export const doc = document;
export const $get = (s,n) => localStorage.getItem(s) || n;
export const $set = (s,v) => localStorage.setItem(s,v);
export const $log = (x) => console.log(x);
export const $rt = (e) => {let n=new Intl.RelativeTimeFormat("en",{timeZone:"UTC",numeric:"auto"}),o=e-Math.floor(Date.now()/1e3);for(let s of[{name:"year",seconds:31536e3},{name:"month",seconds:2628e3},{name:"day",seconds:86400},{name:"hour",seconds:3600},{name:"minute",seconds:60},{name:"second",seconds:1}])if(Math.abs(o)>=s.seconds||"second"===s.name){let a=Math.round(o/s.seconds);return n.format(a,s.name)}}
export const $room = (l) => {return l.pathname.slice(1,5);}
export const $private = () => {return ($('.roomCode') ? $('.roomCode').textContent === '●●●●' : false)};
export const $isPlaying = (l) => {return !!$room(l);}
export const $token = () => {
	if (!$get('chat+token', null)) {
		var array = new Uint8Array(16);
		win.crypto.getRandomValues(array);

		const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
		$set('chat+token', token);

		return token;
	}

	return $get('chat+token', null);
};

export async function $waitUntilElement(selector, b) {
	return new Promise((resolve) => {
		var element = null;
		if (!b){element = $(selector);}
		else{element = $(selector, b)};
		if (element) {return resolve(element)};

		const observer = new MutationObserver((mutations) => {
			var el = null;
			if (!b) {el = $(selector)}
			else {el = $(selector, b)};
			if (el) {
				resolve(el);
				observer.disconnect();
			}
		});

		observer.observe(doc.body, {childList: true, subtree: true})
	})
}

export var $rules = $get('chat+automod') ? JSON.parse($get('chat+automod')) : null;
export function $refreshRules() {
	$rules = $get('chat+automod') ? JSON.parse($get('chat+automod')) : null
};
