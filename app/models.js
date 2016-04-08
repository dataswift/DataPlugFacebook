var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AccountsSchema = new Schema({
  hatToken: String,
  hatBaseUrl: String,
  dataSources: [{ type: Schema.Types.ObjectId, ref: 'HatDataSource' }]
});

var HatDataSourceSchema = new Schema({
  name: { type: String, required: true },
  source: { type: String, required: true },
  sourceAccessToken: String,
  dataSourceModel: Schema.Types.Mixed,
  hatIdMapping: Schema.Types.Mixed,
  frequency: String,
  lastUpdated: { type: String }
});

exports.HatDataSource = mongoose.model('HatDataSource', HatDataSourceSchema);
exports.Accounts = mongoose.model('Accounts', AccountsSchema);