var request = require('request');
var async = require('async');
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
    fbData = JSON.parse(body).data;

    var parseAndSubmit = function(fbObject, callback) {
      var hatRecord = [];

      var traverseObject = function(obj) {
        Object.keys(obj).forEach(function(key, index) {
          if (typeof(obj[key]) === 'object') {
            traverseObject(obj[key]);
          } else {
            var hatValueObject = {
              value: obj[key],
              field: {
                id: index,
                name: key
              }
            };
            hatRecord.push(hatValueObject);
          }
        });
      };

      traverseObject(fbObject);

      request(
      {
        url: 'http://localhost:8080/data/record?access_token=' + req.account.hat_token,
        headers: {
          "User-Agent": "MyClient/1.0.0",
          "Accept": "application/json",
          "Host": "example.hatdex.org",
          "Content-Type": "application/json"
        },
        method: 'post',
        json: true,
        body: JSON.stringify({ name: fbObject.name })
      }, function(err, response, body) {
        console.log(JSON.stringify({ name: fbObject.name }))
        console.log("Boom" + body);
      });
    };
    async.each(fbData, parseAndSubmit, next);
  });
};

