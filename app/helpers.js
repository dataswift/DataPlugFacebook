"use strict";

const config = require('./config');

exports.createSessionData = (req, res, next) => {
  if (req.session.hat) {
    return next();
  } else {
    req.session.hat = {
      authenticated: false,
      domain: '',
      url: ''
    };

    return next();
  }
};

exports.authMiddleware = (req, res, next) => {
  if (req.session.hat.authenticated === true) {
    return next();
  } else {
    return res.redirect('/hat/login');
  }
};

exports.authServices = (req, res, next) => {
  if (req.headers['x-auth-token'] && req.headers['x-auth-token'] === config.services.accessToken) {
    return next();
  } else {
    return res.status(401).json({ error: "Access denied." });
  }
};
