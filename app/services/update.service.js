'use strict';

const async = require('async');
const db = require('../services/db.service');
const hat = require('../services/hat.service');
const config = require('../config');

let internals = {};

let queue = async.queue(work, 1);
let onQueueJobs = [];

setInterval(() => {
  console.log(`[Update module][${new Date()}] Checking database for tasks...`);

  db.findDueJobs(onQueueJobs, (err, results) => {
    if (err) {
      console.log(`[ERROR][Update module][${new Date()}] The has been an error when fetching tasks:`);
      console.log(err);
      return null;
    }

    const updateTasks = results.reduce((memo, result) => {
      if (result.dataSource.dataSourceModelId && result.dataSource.hatIdMapping) {
        memo.push({ task: 'UPDATE_RECORDS', updateInfo: result, dataSource: result.dataSource });
      } else {
        memo.push({ task: 'CREATE_MODEL', dataSource: result.dataSource });
      }

      return memo;
    }, []);

    console.log(`[Update module][${new Date()}] Successfully added ${updateTasks.length} update jobs to queue.`);
    return internals.addNewJobs(updateTasks);
  });
}, config.updateService.dbCheckInterval);

exports.addInitJobs = (dataSources) => {
  for (let dataSource of dataSources) {
    console.log(`[JOB][CREATE][${new Date()}] Adding ${dataSource.source} ${dataSource.name} model for ${dataSource.hatHost}.`);

    queue.unshift({ task: 'CREATE_MODEL', dataSource: dataSource }, (err) => {
    if (err) {
        console.log(`[JOB][CREATE - ERROR][${new Date()}] ${dataSource.source} ${dataSource.name} for ${dataSource.hatHost}`);
        console.log('Following error occured: ', err);
      } else {
        console.log(`[JOB][CREATE - DONE][${new Date()}] ${dataSource.source} ${dataSource.name} for ${dataSource.hatHost}`);
      }
    });

    onQueueJobs.unshift(dataSource._id);
  }

  console.log(`[Update module][${new Date()}] All tasks submitted to queue.`);
};

internals.addNewJobs = (jobs) => {
  async.eachSeries(jobs, (job, callback) => {
    queue.push(job, (err) => {
      if (err) {
        console.log(`[JOB][${job.task === 'UPDATE_RECORDS' ? 'UPDATE' : 'CREATE'} - ERROR][${new Date()}] ${job.dataSource.source} ${job.dataSource.name} update job for ${job.dataSource.hatHost}.`);
        console.log('Following error occured: ', err);
      } else {
        console.log(`[JOB][${job.task === 'UPDATE_RECORDS' ? 'UPDATE' : 'CREATE'} - DONE][${new Date()}] ${job.dataSource.source} ${job.dataSource.name} for ${job.dataSource.hatHost}.`);
      }

      onQueueJobs.shift();
    });

    if (job.updateInfo) {
      onQueueJobs.push(job.updateInfo._id);
    } else {
      onQueueJobs.push(job.dataSource._id);
    }

    return callback();
  }, () => {
    console.log(`[Update module][${new Date()}] All tasks submitted to queue.`);
  });
};

function work(item, cb)  {
  if (item.task === 'UPDATE_RECORDS') {
    db.lockJob(item.updateInfo._id, (err, savedJob) => {
      if (err) {
        console.log(err);
        onQueueJobs.shift();
        return cb(err);
      }

      hat.updateDataSource(item.dataSource, (err, lastUpdateTime) => {
        if (err) return cb(err);

        db.updateDataSource({ lastUpdateTime: lastUpdateTime } , item.dataSource, (er) => {

          const now = new Date();
          const isSuccess = !err && !er;
          const nextRunAt = err ? new Date(now.getTime() + config.updateService.repeatInterval) : new Date(now.getTime() + item.updateInfo.repeatInterval);

          db.updateCompleteJob(item.updateInfo, isSuccess, nextRunAt, err => cb(err));
        });
      });
    });
  } else if (item.task === 'CREATE_MODEL') {
    setTimeout(function() {
      hat.getAccessToken(item.dataSource.hatHost, (err, hatAccessToken) => {
        if (err) return cb(err);

        hat.mapOrCreateModel(item.dataSource, hatAccessToken, (err) => {
          onQueueJobs.shift();
          cb(err);
        });
      });
    }, 400);

  } else {
    console.log(`[ERROR][Update module][${new Date()}] Task description could not be parsed.`);
    cb();
  }
};