/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

"use strict";

const express = require('express');
const router = express.Router();
const moment = require('moment');

const db = require('../services/db.service');
const helpers = require('../helpers');

router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, X-Auth-Token, Content-Type, Accept");
  next();
});

router.get('/token/status', helpers.authApplication, (req, res, next) => {
  db.getUser(req.hat.domain, (err, users) => {
    if (users.length === 0) {
      return res.status(404).json({ phata: req.hat.domain, error: "Token not found." });
    }

    let user = users[0];

    let response = {
      phata: req.hat.domain,
      expires: user.validUntil,
      canPost: moment(user.validUntil).isAfter()
    };

    return res.status(200).json(response);
  });
});

module.exports = router;
