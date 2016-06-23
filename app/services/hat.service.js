'use strict';

const hat = require('hat-node-sdk');
const async = require('async');
const _ = require('lodash');
const request = require('request');
const qs = require('qs');

const db = require('../services/db.service');
const fb = require('../services/fb.service');
const config = require('../config');

var internals = {};

exports.getAccessToken = (hatHost, callback) => {
  const reqOptions = {
    url: 'http://' + hatHost + '/users/access_token',
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    qs: {
      username: config.hat.username,
      password: config.hat.password
    },
    json: true
  };

  request.get(reqOptions, (err, res, body) => {
    if (err) return callback(err);

    return callback(null, body.accessToken);
  });
};

exports.updateDataSource = (dataSource, callback) => {
  if (!dataSource.hatIdMapping) {
    return callback(new Error('Updated cancelled. Inconsistent database record'));
  }

  exports.getAccessToken(dataSource.hatHost, (err, hatAccessToken) => {
    if (err) return callback(err);

    const procedure = [
      async.apply(fb.getGraphNode,
                  dataSource.name,
                  dataSource.sourceAccessToken,
                  dataSource.latestRecordDate),
      async.apply(internals.asyncTranformObjToHat,
                  dataSource.hatIdMapping),
      async.apply(internals.createHatRecords,
                  dataSource.hatHost,
                  hatAccessToken)
    ];

    async.waterfall(procedure, (err, records) => {
      if (err) {
        console.log('There has been a problem updating ' + dataSource.hatHost + ' at ' + Date.now());
        return callback(err);
      } else {
        console.log('Update successful with ', records);
        return callback(null);
      }
    });
  });
};

exports.mapOrCreateModel = (dataSource, accessToken, callback) => {
  const client = new hat.Client('http://' + dataSource.hatHost, accessToken);

  if (!dataSource.dataSourceModelId) {
    client.getDataSourceId(dataSource.name, dataSource.source, (err, model) => {
      if (model && model.id) {
        db.updateDataSource({ dataSourceModelId: model.id }, dataSource, (err, savedDataSource) => {
          if (err) return callback(err);

          return exports.mapOrCreateModel(savedDataSource, accessToken, callback);
        });
      } else {
        client.createDataSourceModel(dataSource.dataSourceModel, (err, createdModel) => {
          if (err) return callback(err);

          db.updateDataSource({ dataSourceModelId: createdModel.id }, dataSource, (err, savedDataSource) => {
            if (err) return callback(err);

            return exports.mapOrCreateModel(savedDataSource, accessToken, callback);
          });
        });
      }
    });
  } else if (!dataSource.hatIdMapping) {
    client.getDataSourceModel(dataSource.dataSourceModelId, (err, model) => {
      if (err) return callback(err);

      let hatIdMapping;

      try {
        hatIdMapping = hat.transform.mapDataSourceModelIds(model);
      } catch (e) {
        return callback(e);
      }

      db.updateDataSource({ hatIdMapping: hatIdMapping }, dataSource, callback);
    });
  } else {
    return callback(null);
  }
};

internals.asyncTranformObjToHat = (hatIdMapping, data, callback) => {
  try {
    const newHatRecords = hat.transform.transformObjToHat(data, hatIdMapping);
    return callback(null, newHatRecords);
  } catch (e) {
    return callback(e);
  }
};

internals.createHatRecords = (hatHost, hatAccessToken, records, callback) => {
  var client = new hat.Client('http://' + hatHost, hatAccessToken);
  client.createMultipleRecords(records, callback);
};