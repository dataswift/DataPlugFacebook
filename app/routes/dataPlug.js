/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

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
        const redirectUrl = `https://www.facebook.com/dialog/oauth?client_id=${config.fb.appID}&redirect_uri=${callbackUrl}&scope=${config.fb.accessScope}&auth_type=reauthenticate`;

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
        mainText: `The plug has been successfully activated. Close the current window and refresh your Rumpel application to see the newly acquired data. Alternatively, click the button below to navigate back to Rumpel.`,
        note: `It may take up to 5 minutes before the data appears on Rumpel applications.`,
        shareNote: 'Tell your friends on Facebook that you now have your Facebook data on your HAT!'
      });
    });
  });
}, errors.renderErrorPage);

module.exports = router;