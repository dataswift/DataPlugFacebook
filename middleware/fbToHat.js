var request = require('request');
var qs = require('qs');
var async = require('async');
var _ = require('lodash');
var config = require('../config');
var fbFieldsConfig = require('../config/fbHatModels');
var fbReqGen = require('../config/fbFields');
var Accounts = require('../models/accounts');

module.exports = (function() {
  var publicObject = {};
  var state = {};

  publicObject.initialRun = function(node, hatAccessToken, graphAccessToken, req, next) {
    initialize(node, hatAccessToken, graphAccessToken);
    async.waterfall([
      publicObject.fetchData,
      publicObject.postRecords
    ], function(err) {
      if (err) return next(err);

      req.session['last_'+node+'_update'] = state.lastUpdated;

      return next();

    });
  }

  publicObject.updateRun = function(node, hatAccessToken, graphAccessToken, lastUpdated, done) {
    initialize(node, hatAccessToken, graphAccessToken, lastUpdated);
    async.waterfall([
      publicObject.fetchData,
      publicObject.postRecords
    ], function(err) {
      if (err) return done(err);

      console.log('update running');

      var databaseUpdateKey = {};
      databaseUpdateKey['last_'+node+'_update'] = state.lastUpdated;

      Accounts.findOneAndUpdate(
        { hat_token: hatAccessToken },
        databaseUpdateKey,
        function(err, account) {
          if (err) return next(err);
            done();
        });
    });
  }

  publicObject.postDataSourceModel = function(req, res, next) {
    request({
      url: config.hatBaseUrl+'/data/table',
      qs: { access_token: req.query.hat_token },
      headers: config.hatHeaders,
      method: 'POST',
      json: true,
      body: fbFieldsConfig[req.params.nodeName]
    }, function (err, response, body) {
      if (err) return next(err);
      res.send(req.params.nodeName + ' source model was successfully created.');
    });
  }

  publicObject.fetchData = function(callback) {
    async.parallel([getGraphData, fetchHatInfo], function(err, results) {
      if (err) return callback(err);
      /* WARNING: executes asynchronously */
      results[0].forEach(function(node) {
        var convertedNode = transformFbToHat(node, results[1], '');
        state.data.push(convertedNode);
      });

      return callback(null);
    });
  };

  publicObject.postRecords = function(callb) {
    async.forEachOfSeries(state.data,
      function(record, index, callback) {
        async.waterfall([
          async.apply(createNewRecord, state.node+index, record),
          postRecordValues
        ], function (err) {
          if (err) return callback(err);
          return callback(null);
        });
      }, function(err) {
        callb(null);
      });
  }

  function initialize(node, hatAccessToken, graphAccessToken, lastUpdated) {
    state.node = node || '';
    state.hatAccessToken = hatAccessToken || '';
    state.graphAccessToken = graphAccessToken || '';
    state.lastUpdated = lastUpdated;
    state.data = [];
  };

  function createNewRecord(recordName, record, callback) {
    request({
      url: config.hatBaseUrl+'/data/record',
      qs: { access_token: state.hatAccessToken },
      headers: config.headers,
      method: 'POST',
      json: true,
      body: { name: recordName }
    }, function (err, response, body) {
      if (err) return callback(err);
      console.log('Created new HAT record '+body.name);
      return callback(null, body, record);
    });
  }

  function postRecordValues(recordInfo, record, callback) {
    request({
      url: config.hatBaseUrl+'/data/record/'+recordInfo.id+'/values',
      qs: { access_token: state.hatAccessToken },
      headers: {
        "User-Agent": "MyClient/1.0.0",
        "Accept": "application/json",
        "Host": "example.hatdex.org",
        "Content-Type": "application/json"
      },
      method: 'POST',
      body: JSON.stringify(record, hatJsonFormat)
    }, function (err, response, body) {
      if (err) return callback(err);
      console.log('Updated values for '+recordInfo.name+' record');
      console.log(body);
      callback(null);
    });
  }

  function fetchHatInfo(cb) {
    async.waterfall([
      getDataSourceId,
      getDataSourceModel,
      function(dataSourceModel, callback) {
        var hatIdMapping = mapDataSourceModel(dataSourceModel, '');
        return callback(null, hatIdMapping);
      }
    ], function(err, hatIdMapping) {
      if (err) return cb(err);
      return cb(null, hatIdMapping);
    });
  }

  function hatJsonFormat(key, value) {
    if ((typeof value === 'number' && key !== 'id') || typeof value === 'boolean') {
      return value.toString();
    } else {
      return value;
    }
  }

  function getDataSourceId(callback) {
    request({
      url: config.hatBaseUrl+'/data/table/search',
      qs: {
        access_token: state.hatAccessToken,
        name: state.node,
        source: 'facebook'
      },
      headers: config.hatHeaders,
      method: 'GET',
      json: true
    }, function (err, response, body) {
      if (err) {
        return callback(err);
      } else if (response.statusCode === 404) {
        var newError = new Error('HAT resource \"facebook '+state.node+'\" not found');
        newError.status = response.statusCode;
        return callback(newError);
      }

      var dataSourceId = body.id;
      return callback(null, dataSourceId);
    });
  }

  function getDataSourceModel(dataSourceId, callback) {
    request({
      url: config.hatBaseUrl+'/data/table/'+dataSourceId,
      qs: {
        access_token: state.hatAccessToken
      },
      headers: config.hatHeaders,
      method: 'GET',
      json: true
    }, function (err, response, body) {
      if (err) {
        return callback(err);
      } else if (response.statusCode === 404) {
        var newError = new Error('HAT resource \"facebook '+state.node+'\" not found');
        newError.status = response.statusCode;
        return callback(newError);
      }

      return callback(null, body);
    });
  }

  function getGraphData(callback) {
    request({
      url: fbReqGen.getRequestUrl(state.node, state.graphAccessToken, state.last),
      method: 'GET',
      json: true
    }, function (err, response, body) {
      if (err) return callback(err);

      console.log(body);

      state.lastUpdated = parseInt(Date.now() / 1000, 10).toString();

      if (state.node === 'profile') {
        return callback(null, [body]);
      } else {
        return callback(null, body.data);
      }
    });
  }

  function mapDataSourceModel(tree, prefix) {
    var hatIdMapping = {};
    /* WARNING: executes asynchronously */
    tree.fields.forEach(function(leaf) {
      hatIdMapping[prefix+'_'+leaf.name] = leaf.id;
    });

    /* WARNING: executes asynchronously */
    if (tree.subTables.length > 0){
      tree.subTables.forEach(function(subTree) {
        var mappedSubTree = mapDataSourceModel(subTree, subTree.name);
        hatIdMapping = _.defaults(hatIdMapping, mappedSubTree);
      });
    }
    return hatIdMapping;
  }

  function transformFbToHat(node, hatIdMapping, prefix) {
    var convertedData = [];
    /* WARNING: executes asynchronously */
    Object.keys(node).forEach(function(key) {
      if (typeof node[key] === 'object') {
        var convertedSubNode = transformFbToHat(node[key], hatIdMapping, key);
        convertedData = _.defaults(convertedData, convertedSubNode);
      } else {
        var hatEntry = {
          value: node[key],
          field: {
            id: hatIdMapping[prefix+'_'+key],
            name: key
          }
        };
        convertedData.push(hatEntry);
      }
    });
    return convertedData;
  }



  return publicObject;

}());