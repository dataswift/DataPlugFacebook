/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

const request = require('request');
const qs = require('qs');
const config = require('../config');

exports.connectHat = (hatDomain, callback) => {
  const registrationReqOptions = {
    url: config.market.url,
    qs: { hat: hatDomain },
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