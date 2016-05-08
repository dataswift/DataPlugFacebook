const hat = require('hat-node-sdk');
const async = require('async');
const _ = require('lodash');

const db = require('../services/db.service');
const fb = require('../services/fb.service');

exports.updateDataSource = (dataSource, callback) => {
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


if (_.isArray(fbRecords) && fbRecords.length === 0) return callback(null);
    if (err) return callback(err);