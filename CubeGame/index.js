const http = require('http');
const fs = require('fs');

http.createServer(function(request, response) {
	const {url} = request;
	let readStream;

	if (url === '/')
	{
		response.setHeader('Content-Type', 'text/html');
		readStream = fs.createReadStream('public/index.html');
		readStream.pipe(response);
	}
	else 
	{
		let filePath;

		//Request with params
		if (url.indexOf('?') !== -1)
		{
			filePath = 'public' + url.split('?')[0];
		}
		else
		{
			//Request without params
			filePath = 'public' + url;
		}

		fs.exists(filePath, (exists) => {
			if (exists) 
			{
				let fileExtension = getFileExtension(filePath),
					contentType = getContentType(fileExtension);

				if (fileExtension && contentType) 
				{
					response.setHeader('Content-Type', contentType);
					readStream = fs.createReadStream(filePath);
					readStream.pipe(response);
				}
			}
			else 
			{
				//File not found
				response.writeHead(404, { 'Content-Type': 'text/plain' });
				response.end('File not found');
			}

		});

	}

	function getFileExtension(fileName) {
		for(let i = fileName.length - 1; i > 0; i--)
		{
			if (fileName.charAt(i) === '.') return fileName.slice(i + 1);
		}
		return null;
	}

	function getContentType(extension) {
		let contentType = '';

		switch(extension) {
			case 'css': 
				contentType = 'text/css'
				break;
			case 'js':
				contentType = 'application/javascript';
				break;
			case 'woff':
				contentType = 'font/woff';
				break;
			case 'woff2':
				contentType = 'font/woff2';
				break;
			case 'ttf':
				contentType = 'font/ttf';
				break;
			case 'ico':
				contentType = 'image/x-icon';
				break;
			case 'svg':
				contentType = 'image/svg+xml';
				break;
			case 'wav':
				contentType = 'audio/x-wav';
				break;
			default:
				contentType = null;
		}
		return contentType;
	}

}).listen(8080);