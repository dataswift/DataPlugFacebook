'use strict';

const request = require('request');
const qs = require('qs');
const _ = require('lodash');
const moment = require('moment');

const config = require('../config');
const fbReqGenerator = require('../config/fbFields');

exports.exchangeCodeForToken = (code, callback) => {
  const tokenRequestOptions = {
    url: 'https://graph.facebook.com/v2.5/oauth/access_token',
    qs: {
      code: code,
      client_id: config.fb.appID,
      client_secret: config.fb.appSecret,
      redirect_uri: config.webServerURL + '/facebook/authenticate'
    }
  };

  let now = moment();

  request.get(tokenRequestOptions, (err, res, body) => {
    if (err) return callback(err);

    let bodyJson;

    try {
      bodyJson = JSON.parse(body);
    } catch (e) {
      return callback(e);
    }

    let userPermissions = {
      accessToken: bodyJson.access_token,
      validUntil: now.add(bodyJson.expires_in, "s")
    };

    return callback(null, userPermissions);
  });
};

exports.post = (accessToken, message, callback) => {
  const reqOptions = {
    url: 'https://graph.facebook.com/v2.5/me/feed',
    qs: { access_token: accessToken },
    body: { message: message },
    json: true
  };

  request.post(reqOptions, (err, res, body) => {
    if (err) return callback(err, body);

    return callback(null, body.id);
  });
};

exports.update = (accessToken, message, postId, callback) => {
  const reqOptions = {
    url: `https://graph.facebook.com/v2.5/${postId}`,
    qs: { access_token: accessToken },
    body: { message: message },
    json: true
  };

  request.post(reqOptions, (err, res, body) => {
    if (err) return callback(err);

    return callback(null, body);
  });
};

exports.delete = (accessToken, postId, callback) => {
  const reqOptions = {
    url: `https://graph.facebook.com/v2.5/${postId}`,
    qs: { access_token: accessToken },
    json: true
  };

  request.delete(reqOptions, (err, res, body) => {
    if (err) return callback (err);

    return callback(null, body);
  });
};

exports.getUserPermissions = (accessToken, callback) => {
  const reqOptions = {
    url: 'https://graph.facebook.com/v2.5/me/permissions',
    qs: { access_token: accessToken },
    json: true
  };

  request.get(reqOptions, (err, res, body) => {
    if (err) return callback(err);

    return callback(null, body.data)
  });
};

exports.getGraphNode = (node, accessToken, lastestUpdateTime, callback) => {
  let fbUrl;
  if (node === 'profile_picture') {
    fbUrl = fbReqGenerator.getProfilePictureUrl(accessToken);
  } else if (node === 'music_listens') {
    fbUrl = fbReqGenerator.getBaseUrl(accessToken, lastestUpdateTime);
  } else {
    fbUrl = fbReqGenerator.getRequestUrl(node, accessToken, lastestUpdateTime);
  }

  request.get({ url: fbUrl, json: true }, (err, res, body) => {
    if (err) return callback(err);

    const data = body.data ? body.data : body;
    const dataArray = Array.isArray(data) ? data : [data];

    if (dataArray.length < 1) {
      console.log('[FB] No data to process.')
      return callback(new Error('No data to process'));
    }

    return callback(null, dataArray);
  });
};

exports.revokeLogin = (accessToken, callback) => {
  const reqOptions = {
    url: 'https://graph.facebook.com/me/permissions',
    qs: { access_token: accessToken },
    json: true
  };

  request.delete(reqOptions, (err, res, body) => {
    if (err) return callback(err);
    if (body.success === true) {
      console.log('Successfully DEAUTHORIZED.');
      return callback(null);
    }
  });
};