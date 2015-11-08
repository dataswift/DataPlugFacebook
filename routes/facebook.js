var express = require('express');
var request = require('request');
var router = express.Router();
var Accounts = require('../models/accounts');
var appConfig = require('../config');
var fb = require('../middleware/facebook');
var fbToHat = require('../middleware/fbToHat');
var fbConfig = require('../config/fbHatModels');

router.get('/', function(req, res, next) {
  if (req.query.code) {
    request.get('https://graph.facebook.com/v2.5/oauth/access_token?client_id=' +
      process.env.FB_APP_ID + '&redirect_uri='+appConfig.appBaseUrl+'/facebook/&client_secret=' +
      process.env.FB_APP_SECRET + '&code=' + req.query.code, function(err, response, body){
        var parsedBody = JSON.parse(body);
        Accounts.findOneAndUpdate(
          { hat_token: req.session.hatToken },
          { facebook: { user_access_token: parsedBody.access_token } },
          function(err, account) {
            if (err) return next(err);
            res.send('Access token generated!');
          }
        );
    });
  }
});

router.get('/:nodeName/init', fbToHat.postDataSourceModel);

router.get('/:nodeName/update', fb.getProviderAuthToken, function(req, res, next) {
  fbToHat.initialize(req.params.nodeName, req.query.hat_token, req.account.facebook.user_access_token);
  fbToHat.fetchData();
  setTimeout(function() {
    fbToHat.postRecords();
  }, 1000);
  res.send("Cool, we're done.");
});

module.exports = router;