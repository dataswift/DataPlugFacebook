'use strict';

const HatDataSource = require('../models/HatDataSource.model');
const UpdateJob = require('../models/UpdateJob.model');
const fbHatModels = require('../config/fbHatModels');
const config = require('../config');

exports.countDataSources = (hatDomain, callback) => {
  return HatDataSource.count({ hatHost: hatDomain }, (err, count) => {
    if (err) return callback(err);
    return callback(null, count);
  });
};

exports.createDataSources = (names, source, hatDomain, sourceAT, callback) => {
  if (typeof names === 'string') names = [names];

  const newDbEntries = names.map((name) => {
    return {
      hatHost: hatDomain,
      name: name,
      source: source,
      sourceAccessToken: sourceAT,
      dataSourceModel: fbHatModels[name],
      dataSourceModelId: null,
      hatIdMapping: null,
      lastUpdateTime: '1'
    };
  });

  return HatDataSource.create(newDbEntries, callback);
};

exports.updateDataSource = (docUpdate, dataSource, callback) => {
  const dataSourceFindParams = {
    hatHost: dataSource.hatHost,
    name: dataSource.name,
    source: dataSource.source
  };

  return HatDataSource.findOneAndUpdate(dataSourceFindParams, docUpdate, { new: true }, callback);
};

exports.createUpdateJobs = (dataSources, callback) => {
  if (typeof dataSources === 'string') dataSources = [dataSources];

  const currentTime = new Date();

  const newDbEntries = dataSources.map((dataSource) => {
    return {
      dataSource: dataSource._id,
      priority: 0,
      repeatInterval: config.updateIntervals[dataSource.name],
      createdAt: currentTime,
      lastModifiedAt: currentTime,
      lastRunAt: null,
      nextRunAt: new Date(currentTime.getTime() + 60 * 1000),
      lastSuccessAt: null,
      lastFailureAt: null,
      lockedAt: null
    };
  });

  return UpdateJob.create(newDbEntries, callback);
};

exports.findDueJobs = (onQueueJobs, callback) => {

  return UpdateJob.find({ nextRunAt: { $lt: new Date() },
                          _id: { $nin: onQueueJobs } })
                  .populate('dataSource')
                  .exec(callback);
};

exports.lockJob = (jobId, callback) => {
  const docUpdate = {
    lastRunAt: new Date(),
    lockedAt: new Date()
  };

  return UpdateJob.findByIdAndUpdate(jobId, docUpdate, { new: true }, callback);
};

exports.updateCompleteJob = (job, isSuccess, nextRunAt, callback) => {
  let docUpdate = {
    nextRunAt: nextRunAt,
    lockedAt: null
  };

  if (isSuccess) {
    docUpdate.lastSuccessAt = new Date();
  } else {
    docUpdate.lastFailureAt = new Date();
  }

  return UpdateJob.findByIdAndUpdate(job._id, docUpdate, { new: true }, callback);
};