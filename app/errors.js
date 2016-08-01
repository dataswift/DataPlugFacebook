'use strict';

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

    return res.render('error', { errors: err });
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