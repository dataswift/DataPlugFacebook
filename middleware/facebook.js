var request = require('request');
var async = require('async');
var Accounts = require('../models/accounts');
var helpers = require('./helpers');

module.exports.getProviderAuthToken = function(req, res, next) {
  Accounts.findOne({ hat_token: req.query.hat_token }, function(err, account) {
    if (err) return next(err);
    req.account = account;
    next();
  });
};

module.exports.getDataSourceId = function(req, res, next) {
  request.get('http://localhost:8080/data/table/search?access_token='+req.account.hat_token+'&name='+req.params.nodeName+'&source=facebook', function(err, response, body) {
    if (err) return next(err);
    var dataSourceId = JSON.parse(body).id;
    req.dataSourceId = dataSourceId;
    next();
  });
};

module.exports.getDataSourceModel = function(req, res, next) {
  request.get('http://localhost:8080/data/table/'+req.dataSourceId+'?access_token='+req.account.hat_token, function(err, response, body) {
    if (err) return next(err);
    var dataModel = JSON.parse(body);
    req.idMapping = helpers.mapDataSourceModel(dataModel, '');
    next();
  });
};

module.exports.getFbData = function(req, res, next) {
  request.get('https://graph.facebook.com/me/'+req.params.nodeName+'?access_token='+req.account.facebook.user_access_token, function(err, response, body) {
    if (err) return next(err);
    var fbData = JSON.parse(body);
    if (fbData.error) {
      var fbError = new Error('There was an issue with Facebook API');
      fbError.facebookError = fbData.error;
      return next(fbError);
    }
    req.submissionData = helpers.convertDataToHat(req.idMapping, fbData.data);
    next();
  });
};

module.exports.postToHat = function(req, res, next) {
  async.eachSeries(req.submissionData, postRecord, function(err) {
    if (err) {
      next(err);
    } else {
      next();
    }
  });

  function postRecord(hatRecord, callback) {
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
      body: { name: "event" }
    }, function(err, response, body) {
      var recordId = body.id;

      request(
      {
        url: 'http://localhost:8080/data/record/' + recordId + '/values?access_token=' + req.account.hat_token,
        headers: {
          "User-Agent": "MyClient/1.0.0",
          "Accept": "application/json",
          "Host": "example.hatdex.org",
          "Content-Type": "application/json"
        },
        method: 'post',
        body: JSON.stringify(hatRecord, helpers.hatFormat)
      }, function(err, response, body) {
        if (err) {
          callback(err);
        } else {
          callback();
          console.log("Just posted to hat: " + body);
        }
      });
    });
  }
};


