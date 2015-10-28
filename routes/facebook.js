var express = require('express');
var request = require('request');
var router = express.Router();
var Accounts = require('../models/accounts');
var FBmiddleware = require('../middleware/facebook');

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

router.get('/update', FBmiddleware.loadDBentry, FBmiddleware.updateProfile, function(req, res, next) {
  res.end();
});

router.get('/events/update', FBmiddleware.loadDBentry, FBmiddleware.updateEvents, function(req, res, next) {
  res.send("Cool, we're done.");
});

module.exports = router;