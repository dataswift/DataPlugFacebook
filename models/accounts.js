var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Accounts = new Schema({
  hat_token: String,
  graph_access_token: String,
  last_posts_update: String,
  last_events_update: String,
  last_profile_update: String
});

module.exports = mongoose.model('Accounts', Accounts);