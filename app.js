var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
const axios = require('axios')

var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');
var apiRouter = require('./server/api/api');
var app = express();
const bodyParser = require('body-parser');

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true, parameterLimit:50000}));
app.use(bodyParser.raw({
  inflate: true,
  limit: '50mb',
  type: 'application/octet-stream'
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

if (process.env.LOGS && process.env.LOGS !== 'disabled') {
    //server logs
    app.use(morgan(function (tokens, req, res) {
      let parse = function (arr) {
        // console.log("array =", arr)
        let params = new URLSearchParams(arr[1]);
        params = [...params.entries()]
        let paramsObj = {}
        params.forEach((key, i) => {
          paramsObj[key[0]] = key[1]
        })
        return {
          path: arr[0][arr[0].length - 1] === '/' ? arr[0] : arr[0] + '/',
          params: JSON.stringify(paramsObj)
        }
      }
      let ref = tokens.referrer(req, res) !== undefined ? parse(String(tokens.referrer(req, res)).split('?')) : {path: null, params: null}
      let u = tokens.url(req, res) !== undefined ? parse(String(tokens.url(req, res)).split('?')) : {path: null, params: null}
      console.log("u.path =", u.path)
      console.log("u.params =", u.params)
      console.log("ref.path =", ref.path)
      console.log("ref.params =", ref.params)
      let data = {
        remote_address: tokens['remote-addr'](req, res),
        remote_user: tokens['remote-user'](req, res)!==undefined?tokens['remote-user'](req, res):"",
        date: new Date(),
        method: tokens.method(req, res),
        url: u.path,
        url_parameters: u.params,
        referrer: ref.path,
        status: tokens.status(req, res),
        content_length: parseInt(tokens.res(req, res, 'content-length')),
        response_time: parseFloat(tokens['response-time'](req, res)),
        referrer_parameters: ref.params,
        request_headers: JSON.stringify(req.headers),
        request_cookies: req.cookies,
        response_headers: JSON.stringify(res.headers),
        response_cookies: res.cookies,
      };
      // axios.post('http://localhost:5001/server/data', data)
    }));
}
app.use(morgan('dev'))
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

app.use('/', indexRouter);
// app.use('/users', usersRouter);
app.use('/api', apiRouter);

require('dotenv').config();
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Helpital',
            version: '1.0.0',
        },
        servers : [{
            url: ((process.env.EXTERNAL_SERVER_ADDRESS && process.env.EXTERNAL_SERVER_ADDRESS !== '') ? process.env.EXTERNAL_SERVER_ADDRESS : process.env.SERVER_ADDRESS),
            description: 'Development server'
        },{
            url: 'http://helpital.fr:3000',
            description: 'Production server'
        }]
    },
    apis: [
        __dirname + '/./server/api/**/*.js',
        __dirname + '/./routes/**/*.js',
    ]
});

app.use(express.static(path.join(__dirname, 'documentation/docs')));
app.use('/docs/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/docs', function (req, res, next) {
  res.sendFile(path.join(__dirname, 'documentation/docs/index.html'));
})

app.use('/files', express.static('server/files'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
