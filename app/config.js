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
  accessScope: 'publish_actions,public_profile,user_friends,user_events,user_posts,email'
};

config.market = {
  host: process.env.MARKET_DOMAIN,
  id: process.env.MARKET_ID,
  accessToken: process.env.MARKET_ACCESS_TOKEN
};

config.hat = {
  username: process.env.HAT_USER,
  password: process.env.HAT_PASSWORD
};

config.services = {
  accessToken: process.env.SERVICES_ACCESS_TOKEN
};

config.protocol = process.env.SECURE === 'true' ? 'https' : 'http';

config.updateIntervals = {
  profile: 7 * 24 * 60 * 60 * 1000,
  events: 6 * 60 * 60 * 1000,
  posts: 1 * 60 * 60 * 1000,
  profile_picture: 24 * 60 * 60 * 1000,
  music_listens: 24 * 60 * 60 * 1000,
};

config.updateService = {
  repeatInterval: 60 * 1000,
  dbCheckInterval: 2 * 60 * 1000
}

if (TEST) config.webServer.port = 5525;

const protocol = process.env.SECURE === 'true' ? 'https' : 'http';

config.webServerURL = config.protocol + '://' + config.webServer.host;

if (!PRODUCTION) config.webServerURL += ':' + config.webServer.port;

config.dbURL = 'mongodb://' + config.mongodb.host + ':' + config.mongodb.port +
'/' + config.mongodb.db + '_' + config.currentEnv;

config.market.url = config.protocol + '://' + config.market.host + '/api/dataplugs/' + config.market.id +
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