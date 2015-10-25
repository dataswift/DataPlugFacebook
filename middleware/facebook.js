var request = require('request');
var Accounts = require('../models/accounts');

module.exports.loadDBentry = function (req, res, next) {
  Accounts.findOne({ hat_token: req.query.hat_token }, function(err, account) {
    req.account = account;
    next();
  });
};

module.exports.updateProfile = function (req, res, next) {
  request.get('https://graph.facebook.com/me?fields=id,name,education&access_token=' + req.account.facebook.user_access_token, function(err, response, body) {
    next();
  });
};