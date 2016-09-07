'use strict';

const express = require('express');
const router = express.Router();

const config = require('../config');
const errors = require('../errors');

const db = require('../services/db.service');
const hat = require('../services/hat.service');
const market = require('../services/market.service');
const update = require('../services/update.service');

const hatLoginForm = require('../views/hatLoginForm.marko');
const facebookLoginForm = require('../views/facebookLoginForm.marko');
const plugConfigurationPage = require('../views/plugConfiguration.marko');
const accountStatsPage = require('../views/accountStats.marko');
const setupConfirmPage = require('../views/setupConfirmPage.marko');

router.get('/', (req, res, next) => {
  // TODO: check HAT domain with regex
  return res.marko(hatLoginForm, { hatDomain: req.query['hat'] || null });
});

router.get('/hat', (req, res, next) => {
  return res.marko(facebookLoginForm, {
    fbAppId: config.fb.appID,
    fbAccessScope: config.fb.accessScope,
    redirectUri: config.webServerURL + '/facebook/authenticate'
  });
});

router.post('/hat', (req, res, next) => {
  if (!req.body['hatDomain']) return res.marko(hatLoginForm, { hatDomain: req.query.hat });

  req.session.hatUrl = req.body['hatDomain'];

  market.connectHat(req.session.hatUrl, (err) => {
    if (err) {
      console.log(`[ERROR][${new Date()}]`, err);
      req.dataplug = { statusCode: '502' };
      return next();
    }

    hat.getAccessToken(req.session.hatUrl, (err, hatAccessToken) => {
      if (err) {
        console.log(`[ERROR][${new Date()}]`, err);
        req.dataplug = { statusCode: '401' };
        return next();
      }

      req.session.hatAccessToken = hatAccessToken;

      db.countDataSources(req.session.hatUrl, (err, count) => {
        if (err) {
          console.log(`[ERROR][${new Date()}]`, err);
          req.dataplug = { statusCode: '500' };
          return next();
        }

        if (count === 0) {
          return res.marko(facebookLoginForm, {
            fbAppId: config.fb.appID,
            fbAccessScope: config.fb.accessScope,
            redirectUri: config.webServerURL + '/facebook/authenticate'
          });
        } else {
          return res.marko(accountStatsPage);
        }
      });
    });
  });

}, errors.renderErrorPage);

router.get('/options', (req, res, next) => {
  return res.marko(plugConfigurationPage);
});

router.post('/options', (req, res, next) => {
  var dataSources = req.body['dataSource'];

  if (!dataSources) return res.redirect('/dataplug/options');
  if (!Array.isArray(dataSources)) dataSources = [dataSources];

  dataSources.push('profile_picture');

  db.createDataSources(dataSources,
                       'facebook',
                       req.session.hatUrl,
                       req.session.sourceAccessToken,
                       (err, savedEntries) => {
    if (err) { req.dataplug = { statusCode: '500' }; return next(); }

      db.createUpdateJobs(savedEntries, (err, savedJobs) => {
        if (err) { req.dataplug = { statusCode: '500' }; return next(); }

        update.addInitJobs(savedEntries);
        return res.marko(setupConfirmPage, {
          rumpelLink: 'https://rumpel.hubofallthings.com/'
        });
      });

  }, errors.renderErrorPage);

});

module.exports = router;