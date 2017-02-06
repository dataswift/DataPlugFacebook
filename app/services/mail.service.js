/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

"user strict";

const config = require('../config');

const ses = require('node-ses');
const client = ses.createClient({
  key: config.ses.key,
  secret: config.ses.secret,
  amazon: config.ses.amazon
});

exports.sendErrorNotification = (message) => {
  client.sendEmail({
    to: 'systems@hatdex.org'
    , from: 'systems@hubofallthings.net'
    , subject: 'Action required: Social Data Plug'
    , altText: message
  }, (err, data, res) => {
    if (err) {
      console.error("[SES] Failed to send admin notification.");
    } else {
      console.log("[SES] Sent admin notification.");
    }
  });
};
