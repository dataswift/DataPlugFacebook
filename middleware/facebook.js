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

  var idMapping = {};

  var mapDataSource = function(tree, prefix) {
    tree.fields.forEach(function(node) {
      idMapping[prefix+'_'+node.name] = node.id;
    });

    if (tree.subTables.length > 0) {
      tree.subTables.forEach(function(tree) {
        mapDataSource(tree, tree.name);
      });
    }
  };

  request.get('http://localhost:8080/data/table/1?access_token=' + req.account.hat_token, function(err, response, body) {
    dataModel = JSON.parse(body);
    mapDataSource(dataModel, '');
  });

  function replacer(key, value) {
    if (typeof value === 'number' && key !== 'id') {
      return value.toString();
    }
    return value;
  }

  request.get('https://graph.facebook.com/me/events?access_token=' + req.account.facebook.user_access_token, function(err, response, body) {
    fbData = JSON.parse(body).data;

    var parseAndSubmit = function(fbObject, callback) {
      var hatRecord = [];

      var traverseObject = function(obj, prefix) {
        Object.keys(obj).forEach(function(key) {
          if (typeof(obj[key]) === 'object') {
            traverseObject(obj[key], key);
          } else {
            var hatValueObject = {
              value: obj[key],
              field: {
                id: idMapping[prefix+'_'+key],
                name: key
              }
            };
            hatRecord.push(hatValueObject);
          }
        });
      };

      traverseObject(fbObject, '');

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
        body: { name: fbObject.name }
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
          body: JSON.stringify(hatRecord, replacer)
        }, function(err, response, body) {
          callback();
        });
      });
    };
    async.eachSeries(fbData, parseAndSubmit, next);
  });
};

