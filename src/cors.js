function sleep(ms) {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

const fetchAllowList = [
	"frisk.page",
	"files.catbox.moe",
	"media.tenor.com"
];

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.action === 'fetch') {
		const { domain, options } = request.payload;
		if (!fetchAllowList.includes(new URL(domain).hostname)) return sendResponse({ error: "Disallowed hostname" });

		// get header first, make sure it's not an html page or other
		// ^ otherwise you'd get ip-grabbed without doing anything lol
		const headers = {};
		let contentType;

		fetch(domain, {method: "HEAD"})
		.then(async (response) => {
			response.headers.forEach((value, key) => {
				headers[key] = value;
			});

			contentType = response.headers.get('content-type') || '';
			if (contentType.includes("text/html")){
				sendResponse({ error: "Target link is HTML" });
			} else {
				try {
					const response = await fetch(domain, options);
					let bodyData;
					let dataType;

					if (contentType.includes('application/json')) {
						bodyData = await response.json();
						dataType = 'json';
					}
					else if (contentType.match(/(image|video|audio|application\/pdf)/)) {
						const arrayBuffer = await response.arrayBuffer();
						bodyData = Array.from(new Uint8Array(arrayBuffer));
						dataType = 'binary';
					}
					else {
						bodyData = await response.text();
						dataType = 'text';
					}

					sendResponse({
						status: response.status,
						headers: headers,
						body: bodyData,
						dataType: dataType
					});
				} catch (err) {
					sendResponse({ error: err.message })
				}
			}
		});

		return true;
	}
	else if (request.action === 'uploadFile') {
		const { fileName, fileType, fileData, domain } = request.payload;

		const uint8Array = new Uint8Array(fileData);
		const blob = new Blob([uint8Array], { type: fileType });
		const file = new File([blob], fileName, { type: blob.type,lastModified: Date.now()});
		const formData = new FormData();

		if (domain === 'https://catbox.moe/user/api.php') {
			formData.append('reqtype', 'fileupload');
			formData.append('userhash', '');
			formData.append('fileToUpload', file);
		}
		else if (domain === 'https://frisk.page/api/files/upload') {
			formData.append('file', file);
		}

		fetch(domain, {method: 'POST', body: formData})
		.then(response => {
			if (domain.includes('catbox.moe')) {
				return response.text();
			}

			else {
				return response.json().then(jobResponse => {
					if (jobResponse.job_id) {
						function checkJob() {
							const jobId = jobResponse.job_id;
							const jobDomain = domain + '-jobs/' + jobId;

							return fetch(jobDomain).then(jobCheckResponse => jobCheckResponse.json())
							.then(jobState => {
								if (jobState.job_id && jobState.job_id === jobId) {
									const progress = Number.isFinite(jobState.progress) ? jobState.progress : 0;
									return progress === 100 ? jobState.upload : sleep(1000).then(() => {checkJob()});
								}

								throw new Error('Job state invalid or missing ID');
							})
						}

						return checkJob();
					}
					throw new Error('Initial response missing job_id');
				});
			}
		}).then(data => sendResponse({ success: true, data }))
		.catch(error => sendResponse({ success: false, error: error.message }));

		return true;
	}
});
