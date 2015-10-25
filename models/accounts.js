var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Accounts = new Schema({
  hat_token: String,
  facebook: {
    user_id: String,
    user_access_token: String,
    last_updated: { type: Date, default: Date.now }
  }
});

module.exports = mongoose.model('Accounts', Accounts);