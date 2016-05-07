const express = require('express');
const router = express.Router();
const errors = require('../errors');
const db = require('../services/db.service');
const config = require('../config');

router.get('/', (req, res, next) => {
  return res.render('dataPlugLanding');
});

router.post('/hat', (req, res, next) => {
  if (!req.body['hat_url']) return next();

  db.countDataSources(req.body['hat_url'], (err, count) => {
    if (err) return next();

    if (count === 0) {
      return res.render('fbAuthoriseLanding', {
        facebookAppId: config.fb.appID,
        fbAccessScope: config.fb.accessScope,
        redirectUri: config.webServerURL + '/facebook/authenticate',
      });
    } else {
      return res.render('dataPlugStats');
    }

  });
}, errors.badRequest);

router.get('/options', (req, res, next) => {
  res.send('It works!!');
});

module.exports = router;