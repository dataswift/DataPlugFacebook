/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

const express = require('express');
const router = express.Router();

const indexPage = require('../views/index.marko');

router.get('/', (req, res, next) => {
  if (req.session.hat.authenticated === true) {
    return res.redirect('/dataplug/main');
  }
  return res.marko(indexPage, { hat: req.session.hat });
});

module.exports = router;