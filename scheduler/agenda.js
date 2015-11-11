var Agenda = require('agenda');
var agenda = new Agenda({ db: { address: 'mongodb://localhost:27017/facebook_agenda' } });
var fbToHat = require('../middleware/fbToHat');
var Accounts = require('../models/accounts');

var updateShedule = {
  posts: '2 minutes',
  events: '3 minutes',
  profile: '24 hours'
};

module.exports.addJob = function(node, hatAccessToken) {
  agenda.define('update facebook '+node, function(job, done) {
    Accounts.findOne({ hat_token: hatAccessToken }, function(err, account) {
      fbToHat.updateRun(node, account.hat_token, account.graph_access_token, account['last_'+node+'_update'], done);
    });
  });

  agenda.every(updateShedule.node, 'update facebook '+node);
};

agenda.start();
