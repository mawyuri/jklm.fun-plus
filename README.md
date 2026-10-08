# JKLM.fun+

> [!NOTE]
> This extension stores a randomly generated string directly inside `localStorage` used to authenticate with the backend server. Switching browsers/clearing data may lead to losing your JKLM.fun+ account. To save your token, open developer tools (F12) on [JKLM.fun](https://jklm.fun) and click on Application > Local Storage > https://jklm.fun or go inside Console and run `localStorage.getItem('chat+token')`.

An extension that aims to improve the social experience, quality-of-life of many functions and more customizability in [JKLM.fun](https://jklm.fun/)
- [x] Friends system
- [x] Faster authentication
- [x] Automoderation in chats
- [X] Embedding media links sent in chat (supports catbox.moe and frisk.page)
- [X] Upload media to chat
- [X] Right click chat messages for quick actions
- [x] Joining friends' game
- [x] Privacy settings
- [x] Chat translation
- [X] Custom keybind for hyphens (💣 BombParty)
- [ ] Using GIFs
- Suggest anything over at the issues page or contact me on Discord (same username.)

## Installation
> [!NOTE]
> This extension is currently unstable. Bugs will exist, if any was found contact me on Discord (same username) or make open an issue in the repository page.

* Download the ZIP file from the [latest release](https://github.com/mawyuri/jklm.fun-plus/releases/latest) (not source code).
* Extract the ZIP file to a directory, then depending on your browser of choice,
  - **Chromium**:
      - Go to the extensions page located at `about:extensions`. Enable developer mode and then click on **Load Unpacked**. Navigate to the directory you extracted the ZIP to, make sure it has `manifest.json` inside.
      - **Alternative method**: Go to the extensions page located at `about:extensions`. Enable developer mode and drag the downloaded ZIP file on to the page.
  - **Firefox**: Go to the addons page at `about:addons`. Click on the gear icon and go to `Debug Add-ons`. There, you should be able to load a temporary add-on. Navigate to the directory you extracted the ZIP to and select the manifest file.
