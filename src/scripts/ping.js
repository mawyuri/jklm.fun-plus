//
import { $token, $room } from '../features/common.js'
import { pingBackend } from '../features/backend.js';
import { plusUserId, plusAuthId } from '../features/auth.js';

pingBackend(plusUserId, settings.auth, $token(), $room || null);
setInterval(() => {
	pingBackend(plusUserId, settings.auth, $token(), $room || null);
}, 60 * 1e3)
