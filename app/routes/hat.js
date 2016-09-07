'use strict';

const express = require('express');
const router = express.Router();

const hat = require('../services/hat.service');
const config = require('../config');

const hatLoginForm = require('../views/hatLoginForm.marko');

router.get('/login', (req, res, next) => {
  // TODO: check HAT domain with regex
  return res.marko(hatLoginForm, {
    hat: req.session.hat,
    hatDomain: req.query['hat'] || null });
});

router.get('/logout', (req, res, next) => {
  req.session.hat = { authenticated: false, domain: '', url: '' };
  req.session.fb = {};

  return req.session.save(function (err) {
    return res.redirect('/');
  });
});

router.get('/authenticate', (req, res, next) => {
  if (!req.query['token']) {
    return res.send('No token detected!');
  }

  const jwtToken = req.query['token'];

  hat.verifyToken(jwtToken, (err, authenticated, hatDomain) => {
    if (err || authenticated === false) {
      return res.send('Token could not be validated.');
    } else {
      req.session.hat = {
        domain: hatDomain,
        url: `${config.protocol}://${hatDomain}`,
        authenticated: authenticated
      };

      return req.session.save(function (err) {
        return res.redirect('/dataplug/main');
      });
    }
  });
});

module.exports = router;
