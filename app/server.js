/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

'use strict';

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const session = require('express-session');
const bodyParser = require('body-parser');
require('marko/express');
require('marko/node-require').install();

const mongoose = require('./config/db');
const errors = require('./errors');
const config = require('./config');
const logger = require('./config/logger');
const helpers = require('./helpers');

const updateSvc = require('./services/update.service');

const app = express();

app.disable('etag');

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(require('morgan')('combined', { 'stream': logger.stream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'very secret secret',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, '../public')));
app.use(helpers.createSessionData);

/* App routes */
const indexRoutes = require('./routes/index');
const hatRoutes = require('./routes/hat');
const dataPlugRoutes = require('./routes/dataPlug');
const callbackRoutes = require('./routes/callback');
const facebookPushRoutes = require('./routes/facebookPush');
const userRoutes = require('./routes/user');

app.use('/', indexRoutes);
app.use('/hat', hatRoutes);
app.use('/api/facebook', facebookPushRoutes);
app.use('/api/user', userRoutes);
app.use('/dataplug', dataPlugRoutes);
app.use('/facebook', callbackRoutes);

// mongoose

var db = mongoose();

// catch 404 and forward to error handler
app.use(errors.notFound);

// error handlers
app.use(errors.catchAll);

module.exports = app;
