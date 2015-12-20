
var request = require('request');
var async = require('async');
var fbReqGen = require('./config/fbFields');
var hat = require('./hatRestApi');
var models = require('./models');
var config = require('./config');

var Agenda = require('agenda');
var agenda = new Agenda({ db: { address: config.dbURL } });

var internals = {};

exports.addUpdateJob = function (name, source, hatAccessToken, frequency) {

  var jobName = 'update ' + source + ' ' + name + ' for ' + hatAccessToken;

  agenda.define(jobName, function (job, done) {

  var data = job.attrs.data;

  models.Accounts.find({ hatToken: data.hatAccessToken })
    .populate({ path: 'dataSources', match: { name: data.name, source: data.source } })
    .exec(function (err, accounts) {

      var sourceData = accounts[0].dataSources[0];
      console.log(sourceData);
      internals.getGraphNode(sourceData.name, sourceData.sourceAccessToken, sourceData.lastUpdated, function (err, fbData, lastUpdated) {

        var hatRecord = hat.transformObjectToHat(data.name, fbData, sourceData.hatIdMapping);

        hat.createRecords(hatRecord, function (err) {
          if (err) return;

          sourceData.lastUpdated = lastUpdated;
          sourceData.save(function (err) {
            done();
          });
        });
      });
    });

});

  var options = {
    name: name,
    source: source,
    hatAccessToken: hatAccessToken
  };

  agenda.every(frequency, jobName, options);

  agenda.start();
};

exports.findModelOrCreate = function (name, source, url, accessToken, dataSourceModelConfig, callback) {

  hat.setUrl(url);
  hat.setAccessToken(accessToken);

  procedure = [
    async.apply(hat.getDataSourceId, name, source),
    hat.getDataSourceModel
  ];

  async.waterfall(procedure, function (err, result) {

    if (err) {
      console.log('we reached the end of waterfall');
      return hat.createDataSourceModel(dataSourceModelConfig, function (error, body) {
        // TO DO:
        // if (error) TRY AGAIN
        var hatIdMapping = hat.mapDataSourceModelIds(body, '');

        callback(null, hatIdMapping);
      });

    }

    console.log('we reached the end of waterfall');
    var hatIdMapping = hat.mapDataSourceModelIds(result, '');

    callback(null, hatIdMapping);

  });

};

internals.getGraphNode = function (node, accessToken, lastUpdated, callback) {
  var requestOptions = {
    url: fbReqGen.getRequestUrl(node, accessToken, lastUpdated),
    method: 'GET',
    json: true
  };

  request(requestOptions, function (err, response, body) {
    if (err) return callback(err);

    var newLastUpdated = parseInt(Date.now() / 1000, 10).toString();

    if (node === 'profile') {
      return callback(null, [body], newLastUpdated);
    } else {
      return callback(null, body.data, newLastUpdated);
    }
  });
}

