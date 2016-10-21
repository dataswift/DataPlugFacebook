const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserPermissionsSchema = new Schema({
  hatDomain:          { type: String, required: true },
  accessToken:        { type: String, required: true },
  validUntil:         { type: Date, require: true },
  permissions:        { type: Schema.Types.Mixed, required: true }
});

module.exports = mongoose.model('UserPermissions', UserPermissionsSchema);
