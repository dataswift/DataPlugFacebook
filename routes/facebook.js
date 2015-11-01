var express = require('express');
var request = require('request');
var router = express.Router();
var Accounts = require('../models/accounts');
var fb = require('../middleware/facebook');
var fbConfig = require('../config/facebook');

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
            res.send('Access token generated!');
          }
        );
    });
  }
});

router.get('/:nodeName/update', fb.getProviderAuthToken, fb.getDataSourceId, fb.getDataSourceModel, fb.getFbData, fb.postToHat, function(req, res, next) {
  res.send("Cool, we're done.");
});

router.get('/events/init')

module.exports = router;