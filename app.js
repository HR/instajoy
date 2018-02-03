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
	request = require('request'),
	FormData = require('form-data'),
	BASE_PATH = `${__dirname}/app`,
	ENV = process.env.NODE_ENV || 'development',
	DEFAULT_PORT = 3001,
	SOCKET_PORT = 8000,
	EMOTION_FPS = 5; // return the analysed data after n frames

/* Configuration */
app.set('views', `${BASE_PATH}/views`)
app.engine('html', require('ejs')
	.renderFile);
app.set('view engine', 'html');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded(
{
	extended: false
}))
app.use(cookieParser())
app.use('/assets', express.static(`${BASE_PATH}/public`))

if (ENV === 'development')
{
	console.log('DEVELOPMENT env')
	app.use(errorHandler(
	{
		dumpExceptions: true,
		showStack: true
	}))
	app.use(logger('dev'))
}
else
{
	console.log('PRODUCTION env')
	app.use(errorHandler())
	app.use(logger())
}


app.locals = {
	userAccessToken: undefined,
	accEmotions:
	{
		anger: 0,
		contempt: 0,
		disgust: 0,
		fear: 0,
		happiness: 0,
		neutral: 0,
		sadness: 0,
		surprise: 0
	}
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
server.on('error', (err) =>
{
	throw err
})
server.on('listening', (err) =>
{
	let addr = server.address()
	let bind = typeof addr === 'string' ?
		'pipe ' + addr :
		'port ' + addr.port
	debug('InstaJoy is alive on ' + bind)
})

/**
 * Init websockets
 */
const io = socketio(server);
io.listen(SOCKET_PORT);
console.log('Listening on SOCKET_PORT ', SOCKET_PORT);

io.on('connection', (client) =>
{
	client.on('imagePost', (imgData) =>
	{
		// console.log('timestamp:', imgData.timestamp)

		axios(
			{
				method: 'post',
				url: consts.endpoints.faceAPI,
				data: imgData.uri,
				headers:
				{
					'Content-Type': 'application/octet-stream',
					'Ocp-Apim-Subscription-Key': process.env.SUB_KEY
				},
				params:
				{
					'returnFaceId': 'true',
					'returnFaceLandmarks': 'false',
					'returnFaceAttributes': 'headPose,emotion,blur,exposure,noise',
				},
			})
			.then(function (response)
			{
				let faceData = response.data
				if (faceData.length <= 0)
				{
					// console.log(faceData.length)
					return;
				}
				// Only include attentive faces
				// let attentiveFaces = faceData.filter((item) => {
				//   return parseInt(item['headPose']['pitch']) == 0;
				// });
				let attentiveFaces = faceData
				app.locals.lecturer.lecture.count++;

				// console.log(attentiveFaces)
				// console.log(app.locals.lecturer.lecture.count)
				let maxEmotionMapping = {
					anger: 1,
					sadness: 2,
					disgust: 3,
					fear: 4,
					neutral: 5,
					contempt: 6,
					surprise: 7,
					happiness: 8,
				}
				let maximumEmotion = 0
				let sum = {
					anger: 0,
					contempt: 0,
					disgust: 0,
					fear: 0,
					happiness: 0,
					neutral: 0,
					sadness: 0,
					surprise: 0,
				}
				let max = 0

				function avg(count, x1, x2)
				{
					return ((count - 1) * x1 + x2) / 2
				}

				attentiveFaces.forEach(elem =>
				{
					for (let prop in elem['faceAttributes']['emotion'])
					{
						app.locals.accEmotions[prop] = avg(app.locals.lecturer.lecture.count, app.locals.accEmotions[prop], elem['faceAttributes']['emotion'][prop])
						// console.log(prop)
						sum[prop] = sum[prop] + elem['faceAttributes']['emotion'][prop]
						if (elem['faceAttributes']['emotion'][prop] > max)
						{
							max = elem['faceAttributes']['emotion'][prop]
							maximumEmotion = maxEmotionMapping[prop]
						}
					}
				});
				console.log(require('util')
					.inspect(plotData,
					{
						depth: null
					}));


				if (--app.locals.lecturer.lecture.accFrames < 0)
				{
					let plotData = {
						emotion: maximumEmotion,
						timestamp: imgData.timestamp
					}

					app.locals.lecturer.lecture.timeline.append(plotData)
					app.locals.lecturer.lecture.avgcount++;
					app.locals.lecturer.lecture.emotion = app.locals.lecturer.overall.emotion = avg(app.locals.lecturer.lecture.avgcount, app.locals.lecturer.lecture.emotion, maximumEmotion)



					// Reset the accumlated frames
					app.locals.lecturer.lecture.accFrames = EMOTION_FPS

					// send back off to client
					client.emit('results', plotData)
				}

			})
			.catch(function (error)
			{
				// console.error(error);
			});
	});
});


// const websocket = socketio(server)

app.get('/', function (req, res)
{
	if (app.locals.userAccessToken)
	{
		res.render('index')
	}
	else
	{
		res.render('noauth.ejs',
		{
			clientId: process.env.CLIENT_ID
		})
	}
})

app.get('/auth', function (req, res)
{
	if (req.query.code)
	{
		console.log("Authorization code is: " + req.query.code);
		var formData = {
			'client_id': process.env.CLIENT_ID,
			'client_secret': process.env.CLIENT_SECRET,
			'grant_type': 'authorization_code',
			'redirect_uri': 'http://localhost:3001/auth',
			'code': req.query.code
		}
		request.post(
		{
			url: 'https://api.instagram.com/oauth/access_token',
			formData: formData
		}, function (err, httpResponse, body)
		{
			if (err)
			{
				return console.error('Failed to get user access token', err);
			}

      app.locals.userAccessToken = body["access_token"];
			console.log('Got user access token:', app.locals.userAccessToken);
      // start processing user images
      res.render('index');
		});
	}
	else
	{
		// error
	}
	// res.render('index')
})

module.exports = app