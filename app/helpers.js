"use strict";

const config = require('./config');

const hat = require('./services/hat.service');

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

exports.authApplication = (req, res, next) => {
  if (req.headers && req.headers['x-auth-token']) {
    hat.verifyToken(req.headers['x-auth-token'], (err, authenticated, hatDomain) => {
      if (err || authenticated === false) {
        return res.status(401).json({ error: "Access denied." });
      } else {
        req.hat = { domain: hatDomain };
        return next();
      }
    });
  } else {
    return res.status(400).json({ error: "Missing authentication headers." })
  }
};

exports.ensureRequiredPermissionsGiven = (permissionArray) => {
  const requiredPermissionsArray = config.fb.accessScope.split(",");

  return requiredPermissionsArray.every(permission => {
    const foundPermission = permissionArray.find(p => p.permission === permission);

    if (foundPermission) {
      return foundPermission.status === "granted";
    } else {
      return false;
    }
  });
};
