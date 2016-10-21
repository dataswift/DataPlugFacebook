const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  hatDomain:          { type: String, required: true },
  notableId:          { type: String, required: true },
  facebookId:         { type: String },
  posted:             { type: Boolean },
  postedTime:         { type: Date }
});

module.exports = mongoose.model('Post', PostSchema);
