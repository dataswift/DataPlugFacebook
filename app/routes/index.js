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