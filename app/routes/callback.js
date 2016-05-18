const express = require('express');
const router = express.Router();
const fb = require('../services/fb.service');
const errors = require('../errors');

router.get('/authenticate', (req, res, next) => {
  if (!req.query.code) return next();

  fb.exchangeCodeForToken(req.query.code, (err, sourceAccessToken) => {
    if (err) return next();

    req.session.sourceAccessToken = sourceAccessToken;

    req.session.save((err) => {
      res.redirect('/dataplug/options');
    });
  });
}, errors.badRequest);

module.exports = router;