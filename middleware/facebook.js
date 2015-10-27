var request = require('request');
var Accounts = require('../models/accounts');

module.exports.loadDBentry = function(req, res, next) {
  Accounts.findOne({ hat_token: req.query.hat_token }, function(err, account) {
    req.account = account;
    console.log(req.account.facebook);
    next();
  });
};

module.exports.updateProfile = function(req, res, next) {
  request.get('https://graph.facebook.com/me?fields=id,name&access_token=' + req.account.facebook.user_access_token, function(err, response, body) {
    console.log(body);
    next();
  });
};

module.exports.updateEvents = function(req, res, next) {
  request.get('https://graph.facebook.com/me/events?access_token=' + req.account.facebook.user_access_token, function(err, response, body) {
    for (var i=0; i < body.data.length; i++) {
      var values;

      request({
        url: 'http://localhost:8080/data/record?access_token=' + req.account.hat_token,
        method: 'POST',
        json: true,
        body: {
          name: body.data[i].name
        }
      }, function(err, response, body) {
        var recordid = JSON.parse(body).id;
        request({
          url: 'http://localhost:8080/record/' + recordid + '/values?access_token=' + req.account.hat_token,
          method: 'POST',
          json: true,
          body: values
        });
      });
    }

  });
};

next();