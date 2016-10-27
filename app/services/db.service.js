'use strict';

const mongoose = require('mongoose');
const HatDataSource = require('../models/HatDataSource.model');
const UpdateJob = require('../models/UpdateJob.model');
const Post = require('../models/Post.model');
const User = require('../models/User.model.js');
const fbHatModels = require('../config/fbHatModels');
const config = require('../config');

let internals = {};

exports.countDataSources = (hatDomain, callback) => {
  return HatDataSource.count({ hatHost: hatDomain }, (err, count) => {
    if (err) return callback(err);
    return callback(null, count);
  });
};

exports.getDataSourcesByDomain = (domain, callback) => {
  return HatDataSource.find({ hatHost: domain }, callback);
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

exports.updateAccessToken = (hatDomain, accessToken, callback) => {
  return HatDataSource.update({ hatHost: hatDomain }, { sourceAccessToken: accessToken }, { multi: true }, callback);
};

exports.getUser = (hatDomain, callback) => {
  return User.find({ hatDomain: hatDomain }, callback);
};

exports.upsertUser = (user, callback) => {
  return User.findOneAndUpdate(user.hatDomain, user,
                              { upsert: true, new: true, passRawResult: true }, callback);
};

exports.deleteUser = (hatDomain, callback) => {
  return User.remove({ "hatDomain": hatDomain }, callback);
};

exports.getPost = (notableId, callback) => {
  return Post.find({ notableId: notableId }, callback);
};

exports.createPost = (post, callback) => {
  return Post.create(post, callback);
};

exports.updatePost = (id, update, callback) => {
  return Post.findByIdAndUpdate(id, update, { new: true }, callback);
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

exports.findUpdateJobsByIdList = (idList, callback) => {
  let mongoosedIds = idList.map(id => mongoose.Types.ObjectId(id));

  return UpdateJob.find({ 'dataSource': { $in: mongoosedIds } })
    .populate('dataSource')
    .exec(callback);
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

exports.deleteJobsAndDataSourcesByDomain = (domain, callback) => {
  exports.getDataSourcesByDomain(domain, (err, dataSources) => {
    if (err) return callback(err);

    internals.deleteUpdateJobsByIdList(dataSources, (err) => {
      if (err) return callback(err);

      internals.deleteDataSourcesByDomain(domain, (err) => {
        if (err) return callback(err);

        return callback(null);
      });
    });
  });
};

internals.deleteUpdateJobsByIdList = (dataSources, callback) => {
  let mongoosedIds = dataSources.map(source => mongoose.Types.ObjectId(source._id));

  return UpdateJob.remove({ 'dataSource': { $in: mongoosedIds } }, callback);
};

internals.deleteDataSourcesByDomain = (domain, callback) => {
  return HatDataSource.remove({ hatHost: domain }, callback);
};
