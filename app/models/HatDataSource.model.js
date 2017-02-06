/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HatDataSourceSchema = new Schema({
  hatHost:            { type: String, required: true },
  name:               { type: String, required: true },
  source:             { type: String, required: true },
  sourceAccessToken:  String,
  dataSourceModel:    Schema.Types.Mixed,
  dataSourceModelId:  Number,
  hatIdMapping:       Schema.Types.Mixed,
  lastUpdateTime:     String
});

HatDataSourceSchema.index({ hatHost: 1, name: 1, source: 1 }, { unique: true });

module.exports = mongoose.model('HatDataSource', HatDataSourceSchema);
