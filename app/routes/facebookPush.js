"use strict";

const express = require('express');
const router = express.Router();

const moment = require('moment');

const helpers = require('../helpers');
const db = require('../services/db.service');
const fb = require('../services/fb.service');
const update = require('../services/update.service');

router.use(helpers.authServices);

const findHatDomain = (req, res, next) => {
  if (req.params && req.params.notableId) {
    return db.getPost(req.params.notableId, (err, posts) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error."});
      }
      if (posts.length === 0) {
        return res.status(404).json({ error: "Requested post does not exist." });
      }
      req.post = posts[0];
      return next();
    });
  } else {
    return res.status(400).json({ error: "The request was malformed." });
  }
};

const canPostForUser = (req, res, next) => {
  if (req.body.hatDomain && req.body.notableId) {
    req.post = { hatDomain: req.body.hatDomain, notableId: req.body.notableId };
  }

  db.getUserPermissions(req.post.hatDomain, (err, users) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error."});
    }
    if (users.length === 0) {
      return res.status(404).json({ error: "Required permissions not found." });
    }

    req.user = users[0];

    let permissionFound = req.user.permissions.find(permission => {
      return permission.permission === 'publish_actions' && permission.status === 'granted';
    });

    if (permissionFound) {
      return next();
    } else {
      return res.status(404).json({ error: "Required permissions not found." });
    }
  });
};

router.post('/post/create', canPostForUser, (req, res, next) => {
  db.createPost({
    hatDomain: req.post.hatDomain,
    notableId: req.post.notableId,
    posted: false
  }, (err, record) => {
    if (err) return res.status(500).json({ error: "Internal server error."});

    fb.post(req.user.accessToken, req.body.message, (err, facebookId) => {
      let updateContent = {
        facebookId: facebookId,
        posted: true,
        postedTime: moment()
      };

      db.updatePost(record._id, updateContent, (err, updatedRecord) => {
        if (err) {
          return res.status(500).json({ error: "Internal server error."});
        }
        return res.status(200).json({ message: "Post accepted for publishing." });
      });
    });
  });
});

router.put('/post/:notableId/update', findHatDomain, canPostForUser, (req, res, next) => {
  fb.update(req.user.accessToken, req.body.message, req.post.facebookId, (err, updateRes) => {
    let updateContent = {
      postedTime: moment()
    };

    db.updatePost(req.post._id, updateContent, (err, updatedRecord) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error."});
      }

      return res.status(200).json({ message: "Post accepted for updating." });
    });
  });
});

router.delete('/post/:notableId/delete', findHatDomain, canPostForUser, (req, res, next) => {
  fb.delete(req.user.accessToken, req.post.facebookId, (err, updateRes) => {
    if (err) {
      return res.status(502).json({ error: "Specified resource could not be reached." })
    }
    return res.status(200).json({ message: "Post accepted for deletion." });
  });
});

module.exports = router;
