var express = require('express');
var router = express.Router();
var Accounts = require('../models/accounts');
var appConfig = require('../config');

/* GET home page. */
router.get('/', function(req, res, next) {
  if (appConfig.hatAccessToken) {
    Accounts.findOneAndUpdate(
      { hat_token: appConfig.hatAccessToken },
      {},
      { new: true, upsert: true },
      function(err, account) {
        req.session.hatToken = appConfig.hatAccessToken;
        res.render('index', { title: 'HAT Sync Tools', facebookAppId: process.env.FB_APP_ID });
      }
    );
  } else {
    res.send('HAT token needs to be provided to continue.');
  }
});

module.exports = router;
