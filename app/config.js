var PRODUCTION = process.env.NODE_ENV === 'production';
var TEST = process.env.NODE_ENV === 'test';

var config = {};
config.currentEnv = process.env.NODE_ENV || 'development';

config.webServer = {
  host: process.env.HOST || 'localhost',
  port: normalizePort(process.env.PORT || 3000),
};

config.mongodb = {
  host: process.env.MONGODB_HOST || 'localhost',
  port: process.env.MONGODB_PORT || 27017,
  db: 'data_plug_fb'
};

config.fb = {
  appID: process.env.FB_APP_ID,
  appSecret: process.env.FB_APP_SECRET,
  accessScope: 'user_about_me,user_birthday,public_profile,user_friends,user_events,user_likes,user_location,user_posts,user_relationships,user_tagged_places'
};

config.market = {
  host: 'marketsquare.hubofallthings.net',
  id: process.env.MARKET_ID,
  accessToken: process.env.MARKET_ACCESS_TOKEN
};

config.hat = {
  username: process.env.HAT_USER,
  password: process.env.HAT_PASSWORD
};

config.updateIntervals = {
  profile: 7 * 24 * 60 * 60 * 1000,
  events: 24 * 60 * 60 * 1000,
  posts: 1 * 60 * 60 * 1000,
  profile_picture: 100 * 24 * 60 * 60 * 1000,
  music_listens: 24 * 60 * 60 * 1000,
};

config.updateService = {
  repeatInterval: 60 * 1000,
  dbCheckInterval: 2 * 60 * 1000
}

if (TEST) config.webServer.port = 5525;

config.webServerURL = 'https://' + config.webServer.host + ':' + config.webServer.port;

config.dbURL = 'mongodb://' + config.mongodb.host + ':' + config.mongodb.port +
'/' + config.mongodb.db + '_' + config.currentEnv;

config.market.url = 'https://' + config.market.host + '/api/dataplugs/' + config.market.id +
'/connect';

module.exports = config;

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}