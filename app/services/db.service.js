const HatDataSource = require('../HatDataSource.model');

exports.countDataSources = (hatUrl, callback) => {
  HatDataSource.count({ hatHost: hatUrl }, (err, count) => {
    if (err) return callback(err);
    return callback(null, count);
  });
};