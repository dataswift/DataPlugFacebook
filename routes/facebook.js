var express = require('express');
var request = require('request');
var router = express.Router();
var Accounts = require('../models/accounts');
var fb = require('../middleware/facebook');
var fbConfig = require('../config/fbHatModels');

router.get('/', function(req, res, next) {
  if (req.query.code) {
    request.get('https://graph.facebook.com/v2.5/oauth/access_token?client_id=' +
      process.env.FB_APP_ID + '&redirect_uri=http://localhost:3000/facebook/&client_secret=' +
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

router.get('/:nodeName/init', fb.getProviderAuthToken, function(req, res, next) {
  request(
    {
      url: 'http://localhost:8080/data/table?access_token=' + req.account.hat_token,
      headers: {
        "User-Agent": "MyClient/1.0.0",
        "Accept": "application/json",
        "Host": "example.hatdex.org",
        "Content-Type": "application/json"
      },
      method: 'post',
      json: true,
      body: fbConfig[req.params.nodeName]
    }, function(err, response, body) {
      if (err) return next(err);
      console.log(JSON.stringify(body));
      res.send(req.params.nodeName + ' source model was successfully created.');
    });
});

router.get('/:nodeName/update', fb.getProviderAuthToken, fb.getDataSourceId, fb.getDataSourceModel, fb.getFbData, fb.postToHat, function(req, res, next) {
  res.send("Cool, we're done.");
});

module.exports = router;