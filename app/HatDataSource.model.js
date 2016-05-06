const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HatDataSourceSchema = new Schema({
  hatAccessToken:     { type: String, required: true },
  hatHost:            { type: String, required: true },
  name:               { type: String, required: true },
  source:             { type: String, required: true },
  sourceHatId:        Number,
  sourceAccessToken:  String,
  dataSourceModel:    Schema.Types.Mixed,
  hatIdMapping:       Schema.Types.Mixed,
  updateFrequency:    String,
  lastUpdated:        String
});

exports.HatDataSource = mongoose.model('HatDataSource', HatDataSourceSchema);