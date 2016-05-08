const HatDataSource = require('../HatDataSource.model');
const fbHatModels = require('../config/fbHatModels');

exports.countDataSources = (hatUrl, callback) => {
  HatDataSource.count({ hatHost: hatUrl }, (err, count) => {
    if (err) return callback(err);
    return callback(null, count);
  });
};

exports.createDataSources = (names, source, hatUrl, hatAT, sourceAT, callback) => {
  if (typeof names === 'string') names = [names];

  const newDbEntries = names.map((name) => {
    return {
      hatHost: hatUrl,
      hatAccessToken: hatAT,
      name: name,
      source: source,
      sourceHatId: 0,
      sourceAccessToken: sourceAT,
      dataSourceModel: fbHatModels[name],
      updateFrequency: '0',
      latestRecordDate: '1'
    };
  });

  HatDataSource.create(newDbEntries, callback);
};