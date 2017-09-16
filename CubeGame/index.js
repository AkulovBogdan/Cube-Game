const http = require('http');
const fs = require('fs');

const types = {
	css: {
		contentType: 'text/css'
	},
	js: {
		contentType: 'application/javascript'
	},
	woff: {
		contentType: 'font/woff'
	},
	woff2: {
		contentType: 'font/woff2'
	},
    ttf: {
		contentType: 'font/ttf'
	},
    ico: {
		contentType: 'image/x-icon'
	},
    svg: {
		contentType: 'image/svg+xml'
	},
    wav: {
		contentType: 'audio/x-wav'
	},
	default: {
		contentType: 'text/plain'
	}
}

http.createServer(function(request, response) {
	const {method, url, headers} = request;

	if (method === "POST")
	{
		let postData = '';
		request.on('data', data => {
			postData += data;
		});

		request.on('end', () => {
			processPost(request, response, postData);
		});
	}
	else 
	{
		processGet(request, response);
	}

	function processPost(request, response, postData) {
		let data = {};
		try {
			data = JSON.parse(postData);
			response.statusCode = 201;
		} catch(e) {
			response.statusCode = 400;
		}

		appendResult(data);
		response.end();
	}

	function processGet(request, response) {
		const resultPath = 'results.json';

		if (url === '/getTop')
		{
			getTop10((err, top10) => {
				if (err)
				{
					response.writeHead(500, { 'Content-Type': 'text/plain' });
					response.end('File not found');
				}
				else 
				{
					let data = JSON.stringify(top10);
					response.writeHead(200, {'Content-Type': 'application/json'});
					response.end(data);
				}
			});
			return;
		}


		if (url === '/')
		{
			sendFile('public/index.html', 'text/html', response);
		}
		else
		{
			let filePath;
			//Cut requests with params
			if (url.indexOf('?') !== -1)
			{
				filePath = 'public' + url.split('?')[0];
			}
			else
			{
				//Requests without params
				filePath = 'public' + url;
			}

			fs.exists(filePath, (exists) => {
				if (exists) 
				{
					let fileExtension = getFileExtension(filePath),
						type = types[fileExtension] || types['default'];

					if (fileExtension && type.contentType) 
					{
						sendFile(filePath, type.contentType, response);
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

		function sendFile(filePath, contentType, response) {
			response.setHeader('Content-Type', contentType);
			let readStream = fs.createReadStream(filePath);
			readStream.pipe(response);
		}
	}

	function getTop10(sendResponse) {
	    fs.readFile('results.json', (err, data) => {
			if (err)
			{
				return sendResponse(err);
			}
			let results = JSON.parse(data);
			results = results.slice(0,10);
			sendResponse(null, results);
		});
	}

	function appendResult(resultToAppend) {
		fs.readFile('results.json', (err, data) => {
			if (err) {
				console.log('error while reading');
			}
			else {
				saveResults(JSON.parse(data));
			}

		});

		function saveResults(results) {
			if (isAvailable(resultToAppend, results)) 
			{
				results.push(resultToAppend);
			}
			sortStatistics(results);
			resultsJSON = JSON.stringify(results);
			fs.exists('results.json', (exists) => {
				if (exists) {
					fs.writeFile('results.json', resultsJSON, 'utf8',() => {});
				}

			});

			function sortStatistics(stats) {
				stats.sort((a, b) => a.score < b.score);
			}

			function isAvailable(player, results) {
				for(let i = 0; i < results.length; i++)
				{
					if (results[i].name === player.name)
					{
						if (player.score > results[i].score)
						{
							results[i].score = player.score;
						}
						return false;
					}
				}
				return true;
			}		
		}
	}

	function getFileExtension(fileName) {
		for(let i = fileName.length - 1; i > 0; i--)
		{
			if (fileName.charAt(i) === '.') return fileName.slice(i + 1);
		}
		return null;
	}
}).listen(8080);