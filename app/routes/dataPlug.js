'use strict';

const express = require('express');
const router = express.Router();
const moment = require('moment');

const config = require('../config');
const errors = require('../errors');
const helpers = require('../helpers');

const db = require('../services/db.service');
const hat = require('../services/hat.service');
const market = require('../services/market.service');
const update = require('../services/update.service');

const facebookLoginForm = require('../views/facebookLoginForm.marko');
const plugConfigurationPage = require('../views/plugConfiguration.marko');
const accountStatsPage = require('../views/accountStats.marko');
const setupConfirmPage = require('../views/confirmationPage.marko');

router.use(helpers.authMiddleware);

router.get('/main', (req, res, next) => {
  market.connectHat(req.session.hat.domain, (err) => {
    if (err) {
      console.log(`[ERROR][${new Date()}]`, err);
      req.dataplug = { statusCode: '502' };
      return next();
    }

    hat.getAccessToken(req.session.hat.domain, (err, hatAccessToken) => {
      if (err) {
        console.log(`[ERROR][${new Date()}]`, err);
        req.dataplug = { statusCode: '401' };
        return next();
      }

      req.session.hat.accessToken = hatAccessToken;

      db.getUser(req.session.hat.domain, (err, users) => {
        if (err) {
          console.log(`[ERROR][${new Date()}]`, err);
          req.dataplug = { statusCode: '500' };
          return next();
        }

        if (users.length === 0 || moment(users[0].validUntil).isBefore()) {
          return res.marko(facebookLoginForm, {
            hat: req.session.hat,
            fbAppId: config.fb.appID,
            fbAccessScope: config.fb.accessScope,
            redirectUri: config.webServerURL + '/facebook/authenticate',
            tokenRenewal: users.length > 0
          });
        } else {
          db.getDataSourcesByDomain(req.session.hat.domain, (err, dataSources) => {
            let idArray = dataSources.map(source => source._id);
            req.session.fb.accessToken = users[0].accessToken;
            db.findUpdateJobsByIdList(idArray, (err, updateJobs) => {
              let activeDataGroups = updateJobs.map(job => job.dataSource.name);
              req.session.activeDataGroups = activeDataGroups;
              return res.marko(accountStatsPage, { hat: req.session.hat, dataStats: updateJobs });
            });
          });
        }
      });
    });
  });

}, errors.renderErrorPage);

router.get('/options', (req, res, next) => {
  return res.marko(plugConfigurationPage, {
    hat: req.session.hat,
    activeDataGroups: req.session.activeDataGroups || []
  });
});

router.post('/options', (req, res, next) => {
  var dataSources = req.body['dataSource'];

  if (!dataSources) return res.redirect('/dataplug/options');
  if (!Array.isArray(dataSources)) dataSources = [dataSources];

  db.createDataSources(dataSources,
                       'facebook',
                       req.session.hat.domain,
                       req.session.fb.accessToken,
                       (err, savedEntries) => {
    if (err) {
      req.dataplug = { statusCode: '500' };
      return next();
    }

      db.createUpdateJobs(savedEntries, (err, savedJobs) => {
        if (err) {
          req.dataplug = { statusCode: '500' };
          return next();
        }

        update.addInitJobs(savedEntries);
        return res.marko(setupConfirmPage, {
          hat: req.session.hat,
          rumpelLink: 'https://rumpel.hubofallthings.com/',
          mainText: `The Data Plug has been set up to synchronize data between Facebook and your personal HAT.`,
          note: `It may take up to 5 minutes before the data appears on Rumpel.`
        });
      });
  });

}, errors.renderErrorPage);

module.exports = router;