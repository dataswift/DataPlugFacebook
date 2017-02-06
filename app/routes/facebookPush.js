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
const toSource = require('tosource');

const helpers = require('../helpers');
const db = require('../services/db.service');
const fb = require('../services/fb.service');
const update = require('../services/update.service');
const mailSvc = require('../services/mail.service');

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

  db.getUser(req.post.hatDomain, (err, users) => {
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

const postToFb = (accessToken, message, failedAttempts, callback) => {
  fb.post(accessToken, message, (err, facebookId) => {
    if (err && failedAttempts < 4) {
      let backoff = 500 * Math.pow(10, failedAttempts);
      console.warn(`[WARN] Facebook post in the backoff mode. Attempt: ${failedAttempts + 1}`);
      setTimeout(() => postToFb(accessToken, message, ++failedAttempts, callback), backoff);
    } else if (err) {
      callback(err);
    } else {
      let dbUpdateContent = {
        facebookId: facebookId,
        posted: true,
        postedTime: moment()
      };

      callback(null, dbUpdateContent);
    }
  });
};

router.post('/post/create', canPostForUser, (req, res, next) => {
  db.getPost(req.post.notableId, (err, posts) => {
    if (err || posts.length > 0) {
      return res.status(400).json({ error: "Specified item already exists." });
    }

    db.createPost({ hatDomain: req.post.hatDomain, notableId: req.post.notableId, posted: false },
      (err, record) => {
      if (err) return res.status(500).json({ error: "Internal server error."});

      postToFb(req.user.accessToken, req.body.message, 0, (err, dbUpdateContent) => {
        if (err) {
          mailSvc.sendErrorNotification(`Dear sysadmin,
            Social Data Plug was unable to publish facebook post.
            
            Reason: ${toSource(err)}
            
            Record: ${record}`);
          return console.error("[ERROR] Unable to publish facebook post. Reason: ", err);
        }

        console.log(`[FACEBOOK] Successfully sent new post.`);

        db.updatePost(record._id, dbUpdateContent, (err, updatedRecord) => {
          if (err) {
            console.error(`[ERROR] Failed to update the database after successfully posting to facebook
              error: ${err}
              update content: ${dbUpdateContent}
              record: ${record._id}`)
          }
        });
      });

      return res.status(200).json({ message: "Post accepted for publishing." });
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
