/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

"use strict";

const express = require('express');
const router = express.Router();
const fb = require('../services/fb.service');
const db = require('../services/db.service');
const errors = require('../errors');
const helpers = require('../helpers');

const facebookRejectPage = require('../views/facebookRejectPage.marko');
const deauthoriseConfirmPage = require('../views/confirmationPage.marko');

router.get('/authenticate', (req, res, next) => {
  if (req.query.error === 'access_denied') {
    return res.marko(facebookRejectPage, {
      hat: req.session.hat,
      message: "It seems that you've denied the plug access to your Facebook data. Without the correct access, the plug will not be able to function correctly. Please try the login process again by clicking the button below.",
      rumpelLink: 'https://rumpel.hubofallthings.com/'
      });
  }

  if (!req.query.code) {
    console.log(`[ERROR][${new Date()}] Facebook redirected without the Code variable`);
    req.dataplug = { statusCode: '502' };
    return next();
  }

  fb.exchangeCodeForToken(req.query.code, (err, userPermissions) => {
    if (err) {
      console.log(`[ERROR][${new Date()}]`, err);
      req.dataplug = { statusCode: '502' };
      return next();
    }

    req.session.fb = {
      accessToken: userPermissions.accessToken
    };

    fb.getUserPermissions(req.session.fb.accessToken, (err, permissionArray) => {
      if (err) {
        console.log(`[ERROR][${new Date()}]`, err);
        req.dataplug = { statusCode: '502' };
        return next();
      }

      if (helpers.ensureRequiredPermissionsGiven(permissionArray)) {
        userPermissions.permissions = permissionArray;
        userPermissions.hatDomain = req.session.hat.domain;

        db.upsertUser(userPermissions, (err, newUserRecord, rawResult) => {
          if (err) {
            console.log(`[ERROR][${new Date()}]`, err);
            req.dataplug = { statusCode: '500' };
            return next();
          }

          db.updateAccessToken(newUserRecord.hatDomain, newUserRecord.accessToken, (err, dbResponse) => {
            if (err) {
              console.log(`[ERROR][${new Date()}]`, err);
              req.dataplug = { statusCode: '500' };
              return next();
            }

            req.session.save((err) => {
              if (rawResult.lastErrorObject.updatedExisting) {
                console.log("[LOGIN] Updated user credentials.");
                return res.redirect('/dataplug/complete');
              } else {
                console.log("[LOGIN] Created new user.");
                return res.redirect('/dataplug/complete');
              }
            });
          });
        });
      } else {
        return res.marko(facebookRejectPage, {
          hat: req.session.hat,
          message: "It seems that you've denied the plug access to certain parts of your Facebook data. Without the correct access, the plug will not be able to function correctly. Please try the login process again by clicking the button below and making sure that all of the checkboxes are ticked on Facebook's permissions dialog box.",
          rumpelLink: 'https://rumpel.hubofallthings.com/'
        });
      }
    });
  });
}, errors.renderErrorPage);

router.get('/deauthorize', (req, res, next) => {
  fb.revokeLogin(req.session.fb.accessToken, (err) => {
    if (err) {
      console.log(`[ERROR][${new Date()}]`, err);
      req.dataplug = { statusCode: '502' };
      return next();
    }

    req.session.fb.accessToken = '';

    db.deleteJobsAndDataSourcesByDomain(req.session.hat.domain, (err) => {
      if (err) {
        console.log(`[ERROR][${new Date()}]`, err);
        req.dataplug = { statusCode: '500' };
        return next();
      }

      req.session.activeDataGroups = [];

      db.deleteUser(req.session.hat.domain, (err) => {
        if (err) {
          console.log(`[ERROR][${new Date()}]`, err);
          req.dataplug = { statusCode: '500' };
          return next();
        }

        return res.marko(deauthoriseConfirmPage, {
          hat: req.session.hat,
          rumpelLink: 'https://rumpel.hubofallthings.com/',
          mainText: `You have successfully logged out of Facebook and fully deauthorised access to your data.`,
          note: ``
        });
      });
    });
  });
}, errors.renderErrorPage);

module.exports = router;