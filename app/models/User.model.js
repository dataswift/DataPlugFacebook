/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  hatDomain:          { type: String, required: true },
  accessToken:        { type: String, required: true },
  validUntil:         { type: Date, require: true },
  permissions:        { type: Schema.Types.Mixed, required: true }
});

module.exports = mongoose.model('User', UserSchema);
