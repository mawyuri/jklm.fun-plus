// Backend stuff
import { $log } from './common.js';

const production = true;
const endpoint = production ? `https://mawyuri.alwaysdata.net/` : `http://localhost/jklmplus/`;
export const $apiget = (a) => fetch(endpoint + a);
export const $apipost = (a, b) => fetch(endpoint + a, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(b)});

export async function getPlusId(authId) {
	if (!authId) return null;
	try {
		const response = await $apiget(`getid.php?auth=${authId}`);
		const data = await response.json();

		if (data) {
			return data.id;
		} else return null;
	}
	catch (e) {};
};

export async function getPerson(person) {
	if (!person) return null;
	try {
		const response = await $apiget(`person.php?id=${person}`);
		const data = await response.json();
		if (data) {
			return data.data;
		} else return null;
	}
	catch (e) {};
}

export async function getFriends(person) {
	if (!person) return null;
	try {
		const response = await $apiget(`friends.php?id=${person}`);
		if (!response.ok)
			return null;
		const data = await response.json();
		if (data) {
			return data;
		} else return null;
	}
	catch (e) {};
}

export async function createAccount(auth, authId, token, nickname, picture) {
	if (!auth || !authId || !token || !nickname) return null;
	try {
		const response = await $apipost(`register.php`, {
			service: auth.service,
			authid: authId,
			token: token,
			nickname: nickname,
			picture: picture
		});
		const data = await response.json();
		return data;
	}
	catch (e) {}
}

export async function pingBackend(plusId, auth, token, room) {
	if (!plusId || !auth || !token) return null;
	try {
		await $apipost(`ping.php`, {
			id: plusId,
			service: auth.service,
			token: token,
			room: room || null
		});
	}
	catch (e) {}
};

export async function changeProfile(plusId, auth, token, nickname, picture) {
	if (!plusId || !auth || !token) return null;
	if (!nickname && !picture) return null;
	try {
		await $apipost(`profile.php`, {
			id: plusId,
			service: auth.service,
			token: token,
			nickname: nickname,
			picture: picture
		});
	}
	catch (e) {
		$log(e);
	}
};

export async function friendRequest(plusId, other, auth, token, decline) {
	if (!plusId || !other || !auth || !token) return null;
	try {
		const response = await $apipost(`request.php`, {
			id: plusId,
			other: other,
			service: auth.service,
			token: token,
			request: decline ? -1 : 0
		});
		const data = await response.json();
		return data;
	}
	catch (e) {}
}

export async function checkAuth(url, token) {
	if (!token) return null;
	const response = await fetch(url, {method: 'GET', headers: {
		'Authorization': `Bearer ${token}`
	}});
	const data = await response.json();
	return data;
}
