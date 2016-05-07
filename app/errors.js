const errorHandlers = {
  badRequest: (req, res, next) => {
    var err = new Error('Bad Request');
    err.status = 400;
    return res.render('error', { errors: err });
  },

  notFound: function(req, res, next) {
    var err = new Error('Page Not Found');
    err.status = 404;
    next(err);
  },

  catchAll: function(err, req, res, next) {
    errorReport = {
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