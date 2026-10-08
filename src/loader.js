import c from './content.js?script&module';
const script = document.createElement('script');
script.src = chrome.runtime.getURL(c);
script.type = 'module';
document.body.appendChild(script);
window.addEventListener('message', (e) => {
	if (e.data.type && e.data.type === 'CRX_Fetch') {
		const { id, domain, options } = e.data.detail;
		chrome.runtime.sendMessage({action: 'fetch', payload: { domain, options }},
		(response) => {
			window.postMessage({
				type: 'CRX_Fetch_Response',
				id: id,
				response: response
			}, '*')
		});
	}
	else if (e.data.type && e.data.type === 'CRX_FileUpload') {
		const { id, fileName, fileType, fileData, domain } = e.data.detail;

		chrome.runtime.sendMessage({action: 'uploadFile', payload: { fileName, fileType, fileData, domain }},
		(response) => {
			window.postMessage({
				type: 'CRX_FileUpload_Response',
				id: id,
				response: response
			}, '*')
		});
	}
});
