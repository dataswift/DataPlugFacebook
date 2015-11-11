var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Accounts = new Schema({
  hat_token: String,
  graph_access_token: String,
  posts_update_link: { type: String, default: '' },
  last_posts_update: { type: Date },
  last_events_update: { type: Date },
  last_profile_update: { type: Date }
});

module.exports = mongoose.model('Accounts', Accounts);