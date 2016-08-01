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
    url: config.protocol + '://' + hatHost + '/users/access_token',
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
    if (res.statusCode === 401 || res.statusCode === 500) return callback(body);

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
                  dataSource.lastUpdateTime),
      async.apply(internals.asyncTranformObjToHat,
                  dataSource.hatIdMapping),
      async.apply(internals.createHatRecords,
                  dataSource.hatHost,
                  hatAccessToken)
    ];

    let now = Math.floor(Date.now() / 1000);

    async.waterfall(procedure, (err, records) => {
      if (err && err.message === 'No data to process') {
        console.log(`[HAT service] Nothing to do.`);
        return callback(null, now);
      } else if (err) {
        console.log(`[HAT service] There has been a problem updating ${dataSource.source} ${dataSource.name} for ${dataSource.hatHost} at ${new Date()}`);
        return callback(err);
      } else {
        console.log(`[HAT service] Successfully added ${records.length ? records.length : JSON.stringify(records)} records to HAT.`);
        return callback(null, now);
      }
    });
  });
};

exports.mapOrCreateModel = (dataSource, accessToken, callback) => {
  const client = new hat.Client(config.protocol + '://' + dataSource.hatHost, accessToken);

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
  var client = new hat.Client(config.protocol + '://' + hatHost, hatAccessToken);
  client.createMultipleRecords(records, callback);
};