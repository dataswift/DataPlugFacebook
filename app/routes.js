var express = require('express');
var router = express.Router();
var request = require('request');
var models = require('./models');
var services = require('./services');
var fbConfig = require('./config/fbHatModels');
var config = require('./config');

router.get('/facebook', function (req, res, next) {

  // TODO: implement method to validate access token for given url
  if (req.query.hatAccessToken && req.query.hatUrl) {

    var query = { hatToken: req.query.hatAccessToken, hatBaseUrl: req.query.hatUrl };

    models.Accounts.findOneAndUpdate(query, {}, { new: true, upsert: true },
      function(err, account) {
        if (err) return res.render('error', { message: err });

        req.session.hatAccessToken = account.hatToken;
        req.session.hatUrl = account.hatBaseUrl;
        req.session.accountId = account._id;
        res.render('index', {
          title: 'Welcome to HAT Facebook Data Plug',
          stepInformation: 'Step 1 - Authorise us to access your private Facebook data',
          facebookAppId: process.env.FB_APP_ID,
          redirectUri: config.webServerURL + '/facebook/authenticate',
          fbAccessScope: config.fb.accessScope });

    });

  } else {
    res.send("Sorry, provided access token or hat url address are not valid. Please try again.");
  }

});

router.get('/facebook/authenticate', function (req, res, next) {
  if (req.query.code) {

    var tokenRequestUrl = 'https://graph.facebook.com/v2.5/oauth/access_token?client_id=' +
      config.fb.appID + '&redirect_uri=' + config.webServerURL + '/facebook/authenticate&client_secret=' +
      config.fb.appSecret + '&code=' + req.query.code;

    request.get(tokenRequestUrl, function (err, response, body) {
        if (err) return res.send('Facebook authentication failed.');

        var parsedBody = JSON.parse(body);
        req.session.fbAccessToken = parsedBody.access_token;

        // Workaround for a bug in a session module
        req.session.save(function (err) {
          res.redirect('/facebook/authenticate');
        });

    });

  } else if (true) {
    res.render('services', {
    title: 'HAT Facebook Data Plug',
    stepInformation: 'Step 2 - Schedule record synchronisation',
    hatServicesLink: config.webServerURL + '/services' });
  } else {
    res.send('Authentication with facebook failed. Please start again.');
  }

});

router.post('/services', function (req, res, next) {

  var dataSources = req.body.dataSources;
  if (typeof dataSources === 'string') dataSources = [dataSources];

  var numberOfDataSources = dataSources.length;
  var completed = 0;

  dataSources.forEach(function (dataSource) {
    services.findModelOrCreate(dataSource, 'facebook', req.session.hatUrl, req.session.hatAccessToken, fbConfig[dataSource], function (err, hatIdMapping) {

      var hatDataSource = {
        name: dataSource,
        source: 'facebook',
        sourceAccessToken: req.session.fbAccessToken,
        dataSourceModel: fbConfig[dataSource],
        hatIdMapping: hatIdMapping,
        lastUpdated: null
      };

      var dbEntry = new models.HatDataSource(hatDataSource);

      dbEntry.save(function (err, result) {
        if (err) return console.log(err);

        models.Accounts.findByIdAndUpdate(
          req.session.accountId,
          { $push: { 'dataSources': result._id } },
          { safe: true, upsert: true, new: true },
          function (err, newAccount) {

              completed++;
              services.addUpdateJob(dataSource, 'facebook', req.session.hatAccessToken, '2 minutes');

              if (completed >= numberOfDataSources) {
                res.send('Congratulations! ' + dataSources + ' are now being automatically synchronized with your HAT.');
              }
          });
        });
      });
    });
});

module.exports = router;
