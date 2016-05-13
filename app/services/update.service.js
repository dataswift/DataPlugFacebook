const async = require('async');
const db = require('../services/db.service');
const hat = require('../services/hat.service');

var queue = async.queue(work, 1);
var onQueueJobs = [];

function work(item, cb)  {
  db.lockJob(item.info._id, (err, savedJob) => {
    if (err) {
      onQueueJobs.shift();
      cb();
    }

    if (item.task === 'UPDATE_RECORDS') {
      hat.updateDataSource(item.info.dataSource, (err) => {
        if (err) {
          return db.updateFailJob(item.info, (err) => {
            onQueueJobs.shift();
            cb();
          });
        } else {
          return db.updateSuccessJob(item.info, (err) => {
            onQueueJobs.shift();
            cb();
          });
        }
      });
    } else if (item.task === 'CREATE_MODEL') {
      hat.mapOrCreateModel(item.info.dataSource, (err) => {
        if (err) {
          return db.updateFailJob(item.info, (err) => {
            onQueueJobs.shift();
            cb();
          });
        } else {
          return db.updateSuccessJob(item.info, (err) => {
            onQueueJobs.shift();
            cb();
          });
        }
      });
    }
  });
};

setInterval(() => {
  console.log('Checking DB for tasks... ');

  db.findDueJobs(onQueueJobs, (err, results) => {
    console.log(results);
    const tasks = results.map((result) => {
      var taskName;
      if (!result.dataSource.hatIdMapping || !result.dataSoure.dataSourceModelId) {
        taskName = "CREATE_MODEL";
      } else {
        taskName = "UPDATE_RECORDS";
      }

      return {
        task: taskName,
        info: result
      };
    });

    async.eachSeries(tasks, (task, callback) => {
      console.log('Adding task to queue. Currently there are ' + queue.length() + ' tasks in the queue.');

      queue.push(task, () => {
        console.log('Task ' + task.task + ' has been completed.');
      });

      onQueueJobs.push(task.info._id);

      callback();
    }, () => {
      console.log('All tasks submitted to queue.');
    });
  });
}, 60 * 1000);
