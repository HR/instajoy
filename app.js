const express = require('express'),
	app = express(),
	logger = require('morgan'),
	errorHandler = require('errorhandler'),
	debug = require('debug')('server'),
	socketio = require('socket.io'),
	http = require('http'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	utils = require('./app/src/utils'),
	consts = require('./consts'),
	axios = require('axios'),
	req = require('request-promise-native'),
	request = require('request'),
	FormData = require('form-data'),
	BASE_PATH = `${__dirname}/app`,
	ENV = process.env.NODE_ENV || 'development',
	DEFAULT_PORT = 3001;

/* Configuration */
app.set('views', `${BASE_PATH}/views`)
app.engine('html', require('ejs')
	.renderFile);
app.set('view engine', 'html');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: false
}))
app.use(cookieParser())
app.use('/assets', express.static(`${BASE_PATH}/public`))

if (ENV === 'development') {
	console.log('DEVELOPMENT env')
	app.use(errorHandler({
		dumpExceptions: true,
		showStack: true
	}))
	app.use(logger('dev'))
} else {
	console.log('PRODUCTION env')
	app.use(errorHandler())
	app.use(logger())
}


app.locals = {
	userAccessToken: process.env.TEST_ACCESS_TOKEN,
  data: null,
  fetching: false
}

/**
 * Get port from environment and use it for Express.
 */
const PORT = utils.normalizePort(process.env.PORT || DEFAULT_PORT)
app.set('port', PORT)

/**
 * Create HTTP server.
 */
const server = http.createServer(app)

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(PORT)

/**
 * Server event handling
 */
server.on('error', (err) => {
	throw err
})
server.on('listening', (err) => {
	let addr = server.address()
	let bind = typeof addr === 'string' ?
		'pipe ' + addr :
		'port ' + addr.port
	debug('InstaJoy is alive on ' + bind)
})

console.log('Server alive on http://localhost:' + PORT);

// axios.interceptors.request.use(request => {
//   console.log('Starting Request', request)
//   return request
// })
//
// axios.interceptors.response.use(response => {
//   console.log('Response:', response)
//   return response
// })

app.get('/', function (req, res) {
	if (app.locals.userAccessToken) {
    if (!app.locals.data && !app.locals.fetching) {
      getImages()
    }
    console.log('app.locals.data:', app.locals.data);
    res.status(200).render('index')
	} else {
		res.status(200).render('noauth.ejs', {
			clientId: process.env.CLIENT_ID
		})
	}
})

app.get('/data', function (req, res) {
  if (app.locals.data) {
    res.status(200).json(app.locals.data);
  } else {
    res.status(404).json({error: 'data not yet fetched or processed'});
  }
})

app.get('/auth', function (req, res) {
	if (req.query.code) {
		console.log("Authorization code is: " + req.query.code);
		var formData = {
			'client_id': process.env.CLIENT_ID,
			'client_secret': process.env.CLIENT_SECRET,
			'grant_type': 'authorization_code',
			'redirect_uri': 'http://localhost:3001/auth',
			'code': req.query.code
		}
		request.post({
			url: 'https://api.instagram.com/oauth/access_token',
			formData: formData
		}, function (err, httpResponse, body) {
			if (err) {
				return console.error('Failed to get user access token', err);
			}
			var parsedBody = JSON.parse(body);

			app.locals.userAccessToken = parsedBody["access_token"];
			console.log('Got user access token:', app.locals.userAccessToken);
      // redirect
      res.redirect('/');
			// start processing user images
			getImages();
		});
	} else {
		// error
    res.redirect('/');
	}

})

function getImages() {
  app.locals.fetching = true;
	let count = 100000000000;
	request.get(consts.endpoints.instagramMedia + app.locals.userAccessToken + '&count=' + count, function (err, httpResponse, body) {
		if (err) {
			return console.error('Failed to get data', err);
		}
		let parsedBody = JSON.parse(body);
		let data = parsedBody["data"];
		let images = data.filter(img => img.type === "image");
		let imageData = images.map(img => img["images"]["standard_resolution"]["url"]);
		let timeData = images.map(img => img["created_time"]);
		console.log('imageData:', imageData);
		console.log('timeData:', timeData);
		getData(imageData, timeData)
			.then((res) => {
				console.log('Got Data:', JSON.stringify(res));
        app.locals.data = res;
        app.locals.fetching = false;
			})
	})
}

async function getData(images, times) {
	let res = [];
	for (let i = 0; i < images.length; i++) {
		let imageSentiments = await getImageSentiments(images[i]);
		if (imageSentiments) {
			res.push({
				emotion: imageSentiments,
				time: times[i]
			});
		}
	}
	return res;
}

async function getImageSentiments(image) {
	try {
		let imgSents = await axios({
			method: 'post',
			url: consts.endpoints.faceAPI,
			data: '{"url": ' + '"' + image + '"}',
			headers: {
				'Content-Type': 'application/json',
				'Ocp-Apim-Subscription-Key': process.env.SUB_KEY
			},
			params: {
				'returnFaceId': 'true',
				'returnFaceLandmarks': 'false',
				'returnFaceAttributes': 'emotion'
			},
		})

		let faceData = imgSents.data
		if (faceData.length <= 0) {
			console.log("No faces detected for ", image)
			return null;
		}

		console.log(JSON.stringify(faceData));

		let modeEmotions = faceData.map(face => Object.keys(face['faceAttributes']['emotion'])
			.reduce((a, b) => face['faceAttributes']['emotion'][a] > face['faceAttributes']['emotion'][b] ? a : b));
		let modeEmotion = mode(modeEmotions);
		return modeEmotion;
	} catch (err) {
		console.error(err);
		return null;
	}
}

function mode(array) {
	if (array.length == 0)
		return null;
	var modeMap = {};
	var maxEl = array[0],
		maxCount = 1;
	for (var i = 0; i < array.length; i++) {
		var el = array[i];
		if (modeMap[el] == null)
			modeMap[el] = 1;
		else
			modeMap[el]++;
		if (modeMap[el] > maxCount) {
			maxEl = el;
			maxCount = modeMap[el];
		}
	}
	return maxEl;
}

module.exports = app