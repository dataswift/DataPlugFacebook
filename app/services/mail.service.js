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
