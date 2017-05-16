/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

'use strict';

const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../config/logger');

const options = {
  server: { socketOptions: { keepAlive: 10000, connectTimeoutMS: 30000 } },
  replset: { socketOptions: { keepAlive: 10000, connectTimeoutMS : 30000 } }
};

module.exports = function() {
  var db = mongoose.connect(config.dbURL, options);

  mongoose.connection.on('connected', () => {
    logger.info(`Successfully connected to MongoDB.`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.info(`Server has disconnected from MongoDB.`);
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`Error occured while processing database request: `, err);
  });

  process.on('SIGINT', () => {
    mongoose.connection.close(() => {
      console.log(`[DB][${new Date()}] Database connection terminated due to app termination`);
      process.exit(0);
    });
  });

  return db;
};
