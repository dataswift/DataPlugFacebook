var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var errors = require('./errors');
var config = require('./config');
var routes = require('./routes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'very secret secret',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// mongoose

mongoose.connect(config.dbURL);

// catch 404 and forward to error handler
app.use(errors.notFound);

// error handlers
app.use(errors.catchAll);

module.exports = app;
