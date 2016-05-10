const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UpdateJobSchema = new Schema({
  dataSource:       Schema.Types.ObjectId,
  priority:         Number,
  repeatInterval:  Number,
  createdAt:        Date,
  lastModifiedAt:   Date,
  lastRunAt:        Date,
  nextRunAt:        Date,
  lastSuccessAt:    Date,
  lastFailureAt:    Date,
  lockedAt:         Date
});

module.exports = mongoose.model('UpdateJob', UpdateJobSchema);