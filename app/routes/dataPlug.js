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

const registeredUserPage = require('../views/registeredUserOptions.marko');
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

        const callbackUrl = config.webServerURL + '/facebook/authenticate';
        const redirectUrl = `https://www.facebook.com/dialog/oauth?client_id=${config.fb.appID}&redirect_uri=${callbackUrl}&scope=${config.fb.accessScope}`

        if (users.length === 0) {
          return res.redirect(redirectUrl);
        } else {
          return res.marko(registeredUserPage,
                          { hat: req.session.hat,
                            tokenExpired: moment(users[0].validUntil).isBefore(),
                            redirectUrl: redirectUrl }
          );
        }
      });
    });
  });
}, errors.renderErrorPage);

router.get('/complete', (req, res, next) => {
  db.createDataSources(config.fb.activeEndpoints,
                      'facebook',
                      req.session.hat.domain,
                      req.session.fb.accessToken,
                      (err, savedEntries) => {

    if (err && err.code === 11000) {
      return res.marko(setupConfirmPage, {
        hat: req.session.hat,
        rumpelLink: 'https://rumpel.hubofallthings.com/',
        mainText: `Facebook access token has been updated.`,
        note: ``,
        shareNote: 'Tell your friends on Facebook that you now have your Facebook data on your HAT!'
      });
    } else if (err) {
      console.log(err);
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
        note: `It may take up to 5 minutes before the data appears on Rumpel.`,
        shareNote: 'Tell your friends on Facebook that you now have your Facebook data on your HAT!'
      });
    });
  });
}, errors.renderErrorPage);

module.exports = router;