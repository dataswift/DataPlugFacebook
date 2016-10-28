const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UpdateJobSchema = new Schema({
  dataSource:       { type: Schema.Types.ObjectId, ref: 'HatDataSource' },
  priority:         Number,
  repeatInterval:   Number,
  createdAt:        Date,
  lastModifiedAt:   Date,
  lastRunAt:        Date,
  nextRunAt:        Date,
  lastSuccessAt:    Date,
  lastFailureAt:    Date,
  lockedAt:         Date,
  dataSourceFlawed: Boolean
});

module.exports = mongoose.model('UpdateJob', UpdateJobSchema);
