const hat = require('hat-node-sdk');
const async = require('async');
const _ = require('lodash');

const db = require('../services/db.service');
const fb = require('../services/fb.service');

exports.updateDataSource = (dataSource, callback) => {
  if (!dataSource.hatIdMapping) {
    return callback(new Error('Updated cancelled. Inconsistent database record'));
  }

  const procedure = [
    async.apply(fb.getGraphNode,
                dataSource.name,
                dataSource.sourceAccessToken,
                dataSource.latestRecordDate),
    async.apply(internals.asyncTranformObjToHat,
                dataSource.hatIdMapping),
    async.apply(internals.createHatRecords,
                dataSource.hatHost,
                dataSource.hatAccessToken)
  ];

  async.waterfall(procedure, (err, records) => {
    if (err) {
      console.log('There has been a problem updating ' + dataSource.hatHost ' at ' + Date.now());
      return callback(err);
    } else {
      return callback(null);
    }
  });
};

exports.createDataSource = (dataSource, callback) => {
  var client = new hat.Client(dataSource.hatHost, dataSource.hatAccessToken);
  hat.createDataSourceModel(dataSource.dataSourceModel, (err, createdModel) => {
    db.updateDataSource({ dataSourceModelId: createdModel.id }, dataSource, callback);
  });
};

exports.retrieveHatIdMapping = (dataSource, callback) => {
  var client = new hat.Client(dataSource.hatHost, dataSource.hatAccessToken);
  hat.getDataSourceModel(dataSource.dataSourceModelId, (err, model) => {

    try {
      const hatIdMapping = hat.transform.mapDataSourceModelIds(model);
    } catch (e) {
      return callback(err);
    }

    db.updateDataSource({ hatIdMapping: hatIdMapping }, dataSource, callback);
  });
};

internals.asyncTranformObjToHat = (hatIdMapping, data, callback) => {
  try {
    const newHatRecords = hat.transform.transformObjToHat(data, hatIdMapping);
    return callback(null, newHatRecords);
  } catch (e) {
    return callback(e);
  }
};

internals.createHatRecords = (hatUrl, hatAccessToken, records, callback) => {
  var client = new hat.Client(hatUrl, hatAccessToken);
  client.createMultipleRecords(records, callback);
};