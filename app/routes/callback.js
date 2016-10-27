"use strict";

const express = require('express');
const router = express.Router();
const fb = require('../services/fb.service');
const db = require('../services/db.service');
const errors = require('../errors');

const facebookRejectPage = require('../views/facebookRejectPage.marko');
const deauthoriseConfirmPage = require('../views/confirmationPage.marko');

router.get('/authenticate', (req, res, next) => {
  if (req.query.error === 'access_denied') {
    return res.marko(facebookRejectPage, {
      hat: req.session.hat,
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
              return res.redirect('/dataplug/main');
            } else {
              console.log("[LOGIN] Created new user.");
              return res.redirect('/dataplug/options');
            }
          });
        });
      });
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