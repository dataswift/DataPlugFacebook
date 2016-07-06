'use strict';

const async = require('async');
const db = require('../services/db.service');
const hat = require('../services/hat.service');
const config = require('../config');

let internals = {};

let queue = async.queue(work, 1);
let onQueueJobs = [];

setInterval(() => {
  console.log('Checking DB for tasks...');

  db.findDueJobs(onQueueJobs, (err, results) => {
    const updateTasks = results.reduce((memo, result) => {
      if (result.dataSource.dataSourceModelId && result.dataSource.hatIdMapping) {
        memo.push({
          task: 'UPDATE_RECORDS',
          info: result
        });
      }

      return memo;
    }, []);

    console.log(updateTasks);
    return internals.addNewJobs(updateTasks);
  });
}, config.updateService.dbCheckInterval);

exports.addInitJobs = (dataSources, hatAccessToken) => {
  for (let dataSource of dataSources) {
    queue.unshift({ task: 'CREATE_MODEL', info: dataSource, accessToken: hatAccessToken }, (err) => {
    if (err) {
        console.log('Error occured when creating model.');
      } else {
        console.log('Model has been successfully created.');
      }
    });

    onQueueJobs.unshift(dataSource._id);
  }
};

internals.addNewJobs = (jobs) => {
  async.eachSeries(jobs, (job, callback) => {
    queue.push(job, (err) => {
      if (err) {
        console.log('Error occured when processing job.');
      } else {
        console.log('ON QUEUE', queue.length());
        console.log('OnQueueArray', onQueueJobs.length);

        onQueueJobs.shift();
      }
    });

    onQueueJobs.push(job.info._id);

    return callback();
  }, () => {
    console.log('All tasks submitted to queue.');
  });
};

function work(item, cb)  {
  if (item.task === 'UPDATE_RECORDS') {
    db.lockJob(item.info._id, (err, savedJob) => {
      if (err) {
        console.log(err);
        onQueueJobs.shift();
        return cb();
      }

      hat.updateDataSource(item.info.dataSource, (err) => {
        const now = new Date();
        const isSuccess = !err;
        const nextRunAt = err ? new Date(now.getTime() + config.updateService.repeatInterval) : new Date(now.getTime() + item.info.repeatInterval);

        db.updateCompleteJob(item.info, isSuccess, nextRunAt, err => cb());
      });
    });
  } else if (item.task === 'CREATE_MODEL') {
    hat.mapOrCreateModel(item.info, item.accessToken, (err) => {
      onQueueJobs.shift();
      cb();
    });
  } else {
    console.log('Task description could not be parsed.');
    cb();
  }
};