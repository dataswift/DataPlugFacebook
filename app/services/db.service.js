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
      sourceAccessToken: sourceAT,
      dataSourceModel: fbHatModels[name],
      dataSourceModelId: 0,
      updateFrequency: '0',
      latestRecordDate: '1'
    };
  });

  HatDataSource.create(newDbEntries, callback);
};

exports.updateDataSource = (newValueObj, dataSource, callback) => {
  const dataSourceFindParams = {
    hatHost: dataSource.hatHost,
    name: dataSource.name,
    source: dataSource.source
  };

  HatDataSource.update(newValueObj, dataSourceFindParams, callback);
};