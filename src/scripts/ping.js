//
import { $token, $room, $get, $private, $log } from '../features/common.js'
import { pingBackend } from '../features/backend.js';
import { plusUserId, plusAuthId } from '../features/auth.js';

const room = $room(document.location)
const ping = () => {pingBackend(plusUserId, settings.auth, $token(), room ? ($get('chat+privacy:showRoom', true) ? (!($get('chat+privacy:lockedRoom', false).toLowerCase() === 'false' && $private() === true) ? room : `a private room` ) : `a room`) : null);}
const interval = () => {
	if ($get('chat+privacy:pingServer', null))
		ping();
}
setInterval(interval, 60 * 1e3);
interval();
