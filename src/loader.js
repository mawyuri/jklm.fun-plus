import c from './content.js?script&module';
const script = document.createElement('script');
script.src = chrome.runtime.getURL(c);
script.type = 'module';
document.body.appendChild(script);
