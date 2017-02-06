/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

'use strict';

const errorPage = require('./views/errorPage.marko');

const HTTP_STATUS_CODES = {
  '400': 'Bad Request',
  '401': 'Unauthorized',
  '404': 'Page Not Found',
  '500': 'Internal Server Error',
  '502': 'Bad Gateway',
  '504': 'Gateway Timeout'
};

const errorHandlers = {
  renderErrorPage: function(req, res, next) {
    if (req.dataplug && req.dataplug.statusCode) {
      var err = new Error(HTTP_STATUS_CODES[req.dataplug.statusCode]);
      err.status = req.dataplug.statusCode;
    } else {
      var err = new Error('Unknown Error');
      err.status = 520;
    }

    console.log(`[ERROR][${new Date()}]`, err);

    return res.marko(errorPage, { errors: err, hat: req.session.hat });
  },

  notFound: function(req, res, next) {
    var err = new Error('Page Not Found');
    err.status = 404;
    next(err);
  },

  catchAll: function(err, req, res, next) {
    let errorReport = {
      message: err.message,
      status: err.status || 500,
    }
    if (process.env.NODE_ENV === 'development') {
      errorReport.error = err;
    }
    res.json(errorReport);
  }
};

module.exports = errorHandlers;