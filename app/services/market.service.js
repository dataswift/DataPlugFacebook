const request = require('request');
const qs = require('qs');
const config = require('../config');

exports.connectHat = (hatUrl, callback) => {
  const registrationReqOptions = {
    url: config.market.url,
    qs: { hat: hatUrl },
    headers: { 'X-Auth-Token': config.market.accessToken }
  };

  request.get(registrationReqOptions, (err, res, body) => {
    if (err) return callback(err);

    try {
      const parsedBody = JSON.parse(body);
      if (parsedBody.error) return callback(new Error(parsedBody.message));
    } catch(e) {
      return callback(e);
    }

    return callback(null, parsedBody.message);
  });
};