var express = require('express');
var request = require('request');
var router = express.Router();
var Accounts = require('../models/accounts');
var appConfig = require('../config');
var fbToHat = require('../middleware/fbToHat');
var fbConfig = require('../config/fbHatModels');

function getProviderAuthToken(req, res, next) {
  Accounts.findOne({ hat_token: appConfig.hatAccessToken }, function(err, account) {
    if (err) return next(err);
    req.account = account;
    next();
  });
}

function updateDatabase(req, res, next) {
  var databaseUpdateKey = {};
  databaseUpdateKey['last_'+req.params.nodeName+'_update'] = req.session['last_'+req.params.nodeName+'_update'];
  console.log(databaseUpdateKey);
  Accounts.findOneAndUpdate(
    { hat_token: req.query.hat_token },
    databaseUpdateKey,
    function(err, account) {
      if (err) return next(err);
      res.send("Cool, we're done.");
    });
}

router.get('/', function(req, res, next) {
  if (req.query.code) {
    request.get('https://graph.facebook.com/v2.5/oauth/access_token?client_id=' +
      process.env.FB_APP_ID + '&redirect_uri='+appConfig.appBaseUrl+'/facebook/&client_secret=' +
      process.env.FB_APP_SECRET + '&code=' + req.query.code, function(err, response, body){
        var parsedBody = JSON.parse(body);
        Accounts.findOneAndUpdate(
          { hat_token: req.session.hatToken },
          { graph_access_token: parsedBody.access_token },
          function(err, account) {
            if (err) return next(err);
            res.send('Access token generated!');
          });
    });
  }
});

router.get('/:nodeName/init', fbToHat.postDataSourceModel);

router.get('/:nodeName/update', getProviderAuthToken, function(req, res, next) {
  var state = fbToHat.initialRun(req.params.nodeName, req.query.hat_token, req.account.graph_access_token, req, next);
}, updateDatabase);

module.exports = router;