var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var errors = require('./errors');
var routes = require('./routes/index');
var facebook = require('./routes/facebook');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('express-session')({
  secret: 'very secret secret',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/facebook', facebook);

// mongoose
if (process.env.MONGOLAB_URI) {
  mongoose.connect(process.env.MONGOLAB_URI);
} else {
  mongoose.connect('mongodb://localhost:27017/HAT_sync_accounts');
}

// catch 404 and forward to error handler
app.use(errors.notFound);

// error handlers
app.use(errors.catchAll);

module.exports = app;
