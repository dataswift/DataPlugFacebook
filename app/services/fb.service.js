const request = require('request');
const qs = require('qs');
const config = require('../config');

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

  request.get(tokenRequestOptions, (err, res, body) => {
    if (err) return callback(err);

    const accessToken = JSON.parse(body).access_token;

    return callback(null, accessToken);
  });
};