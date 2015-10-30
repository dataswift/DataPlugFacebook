var request = require('request');
var async = require('async');
var Accounts = require('../models/accounts');

module.exports.loadDBentry = function(req, res, next) {
  Accounts.findOne({ hat_token: req.query.hat_token }, function(err, account) {
    req.account = account;
    next();
  });
};

module.exports.updateProfile = function(req, res, next) {
  request.get('https://graph.facebook.com/me?fields=id,name&access_token=' + req.account.facebook.user_access_token, function(err, response, body) {
    console.log(body);
    next();
  });
};

module.exports.updateEvents = function(req, res, next) {

  async.waterfall([
    async.apply(getDataSourceModel, "1"),
    mapDataSourceModel,
    getFacebookData,
    parseFacebookData,
    postToHat
  ], function(callback) {
    next();
  });

  function getDataSourceModel(dataSourceId, callback) {
    request.get('http://localhost:8080/data/table/'+dataSourceId+'?access_token='+req.account.hat_token, function(err, response, body) {
      dataModel = JSON.parse(body);
      callback(null, dataModel, '', {});
    });
  }

  function mapDataSourceModel(tree, prefix, collected, callback) {
    tree.fields.forEach(function(node) {
      collected[prefix+'_'+node.name] = node.id;
    });

    if (tree.subTables.length > 0) {
      tree.subTables.forEach(function(tree) {
        mapDataSourceModel(tree, tree.name, collected, callback);
      });
    } else {
      callback(null, "events", collected);
    }
  }

  function getFacebookData(type, dataSourceMapping, callback) {
    request.get('https://graph.facebook.com/me/'+type+'?access_token='+req.account.facebook.user_access_token, function(err, response, body) {
      fbData = JSON.parse(body).data;
      callback(null, dataSourceMapping, fbData);
    });
  }

  function parseFacebookData(dataSourceMapping, fbData, callback) {
    var dataToSubmit = [];



    var parseAndSubmit = function(fbObject) {
      var hatRecord = [];

      var traverseObject = function(obj, prefix) {
        Object.keys(obj).forEach(function(key) {
          if (typeof(obj[key]) === 'object') {
            traverseObject(obj[key], key);
          } else {
            var hatValueObject = {
              value: obj[key],
              field: {
                id: dataSourceMapping[prefix+'_'+key],
                name: key
              }
            };
            hatRecord.push(hatValueObject);
          }
        });
      };

      traverseObject(fbObject, '');
      dataToSubmit.push(hatRecord);
    };

    fbData.forEach(function(fbEvent) {
      parseAndSubmit(fbEvent);
    });

    callback(null, dataToSubmit);

  }

  function postToHat(dataToSubmit, callback) {

    async.eachSeries(dataToSubmit, actualPost, function(err) {
      next();
    });

    function replacer(key, value) {
      if (typeof value === 'number' && key !== 'id') {
        return value.toString();
      }
      return value;
    }

    function actualPost(actualPost, innerCallback) {
      request(
      {
        url: 'http://localhost:8080/data/record?access_token=' + req.account.hat_token,
        headers: {
          "User-Agent": "MyClient/1.0.0",
          "Accept": "application/json",
          "Host": "example.hatdex.org",
          "Content-Type": "application/json"
        },
        method: 'post',
        json: true,
        body: { name: "event" }
      }, function(err, response, body) {
        var recordId = body.id;

        request(
        {
          url: 'http://localhost:8080/data/record/' + recordId + '/values?access_token=' + req.account.hat_token,
          headers: {
            "User-Agent": "MyClient/1.0.0",
            "Accept": "application/json",
            "Host": "example.hatdex.org",
            "Content-Type": "application/json"
          },
          method: 'post',
          body: JSON.stringify(actualPost, replacer)
        }, function(err, response, body) {
          innerCallback();
          console.log("Just posted to hat: " + body);
        });
      });
    }
  }
}

