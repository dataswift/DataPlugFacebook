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

  req.session.hatUrl = req.body['hat_url'];
  req.session.hatAccessToken = req.body['hat_access_token'];

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
  res.render('syncOptions');
});

router.post('/options', (req, res, next) => {
  var dataSources = req.body['data_source'];

  if (!dataSources) return res.redirect('/dataplug/options');

  db.createDataSources(dataSources,
                       'facebook',
                       req.session.hatUrl,
                       req.session.hatAccessToken,
                       req.session.sourceAccessToken,
                       (err, savedEntries) => {
    if (err) return next();

    return res.render('confirmation');

  }, errors.badRequest);

});

module.exports = router;