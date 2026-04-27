# JKLM.fun+

> [!IMPORTANT]
> This extension is built for Chromium-based browsers. If you need the extension for Firefox, change `service_worker` under `background` in `manifest.json` to `scripting`.

> [!NOTE]
> This extension stores a randomly generated string directly inside `localStorage` used to authenticate with the backend server. Switching browsers/clearing data may lead to losing your JKLM.fun+ account. To save your token, open developer tools (F12) on [JKLM.fun](https://jklm.fun) and click on Application > Local Storage > https://jklm.fun or go inside Console and run `localStorage.getItem('chat+token')`.

An extension that aims to improve the social experience, quality-of-life of many functions and more customizability in [JKLM.fun](https://jklm.fun/)
- [x] Friends system
- [x] Faster authentication
- [x] Automoderation in chats
- [x] Embedding media links sent in chat
- [ ] Joining friends' game
- [ ] Privacy settings
- Suggest anything over at the issues page or contact me on Discord (same username.)

## Installation
> [!NOTE]
> This extension is currently unstable. Bugs will exist, if any was found contact me on Discord (same username) or make open an issue in the repository page.

1. Download source as ZIP. Extract it anywhere and remember the folder that has `manifest.json` in it.
2. Navigate to the browser's extensions page. On most Chromium-based browsers, you may need to enable Developer Mode inside the extensions page.
3. Click on "Load unpacked" and select the folder with the `manifest.json` file.
