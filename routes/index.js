var express = require('express');
var router = express.Router();
var Accounts = require('../models/accounts');

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.query.hat_token) {
    Accounts.findOneAndUpdate(
      { hat_token: req.query.hat_token },
      {},
      { new: true, upsert: true },
      function(err, account) {
        req.session.hatToken = req.query.hat_token;
        res.render('index', { title: 'HAT Sync Tools', facebookAppId: process.env.FB_APP_ID });
      }
    );
  } else {
    res.send('HAT token needs to be provided to continue.');
  }
});

module.exports = router;
