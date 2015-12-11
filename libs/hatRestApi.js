'use strict';

// Load modules

var qs = require('qs');
var request = require('request');
var _ = require('lodash');

// Object to hold private variables and functions

var internals = {};

// Define configuration variables

var requestDefaults = {
  url: 'http://localhost:8080/data',
  qs: { access_token: 'df4545665drgdfg' },
  method: 'GET',
  headers: {
    "User-Agent": "MyClient/1.0.0",
    "Accept": "application/json",
    "Host": "example.hatdex.org",
    "Content-Type": "application/json"
  },
  json: true
};

exports.getDataSourceId = function (name, source, callback) {

  var requestConfig = requestDefaults;

  requestConfig.url += '/table/search';
  requestConfig.qs.name = name;
  requestConfig.qs.source = source;

  request(requestConfig, function (err, response, body) {

    var foundError = internals.handleErrors(err, response)
    var dataSourceId = body.id;

    return callback(foundError, dataSourceId);

  });

};

exports.getDataSourceModel = function (dataSourceId, callback) {

  var requestConfig = requestDefaults;

  requestConfig.url += '/table/' + dataSourceId;

  request(requestConfig, function (err, response, body) {

    var foundError = internals.handleErrors(err, response)

    return callback(foundError, body);

  });

};

exports.createDataSourceModel = function (dataSourceModelConfig, callback) {

  var requestConfig = requestDefaults;

  requestConfig.url += '/table';
  requestConfig.method = 'POST';
  requestConfig.body = dataSourceModelConfig;

  request(requestConfig, function (err, response, body) {

    var foundError = internals.handleErrors(err, response);

    return callback(foundError);

  });
};

exports.createRecord = function (record, callback) {

  var requestConfig = requestDefaults;

  requestConfig.url += '/record/values';
  requestConfig.method = 'POST';
  requestConfig.json = false;
  requestConfig.body = internals.normalizeJsonValueTypes(record);

  request(requestConfig, function (err, response, body) {

    var foundError = internals.handleErrors(err, response);

    return callback(foundError);

  });

};

exports.mapDataSourceModelIds = function (table) {

  var hatIdMappingArray = internals.mapDataSourceModelIds(table, '');

  var hatIdMappingObject = _.zipObject(hatIdMappingArray);

  return hatIdMappingObject;
};

internals.mapDataSourceModelIds = function (table, prefix) {

  var tableMapping = _.map(table.fields, function(field) {
    return [prefix + '_' + field.name, field.id];
  });

  if (table.subTables.length > 0) {

    var subTableMapping = _.map(table.subTables, function(subTable) {
      return internals.mapDataSourceModelIds(subTable, subTable.name);
    });

    var flattenedSubTableMapping = _.flatten(subTableMapping);
  }

  return tableMapping.concat(flattenedSubTableMapping);
};

exports.transformObjectToHat = function (node, hatIdMapping, prefix) {

  var convertedData = _.map(node, function (value, key) {

    if (typeof value === 'object') {

      return exports.transformObjectToHat(value, hatIdMapping, key);

    } else {

      var newHatValue = {
        value: value,
        field: {
          id: hatIdMapping[prefix+'_'+key],
          name: key
        }
      };

      return newHatValue;
    }

  });

  var flattenedValues = _.flattenDeep(convertedData);

  return flattenedValues;

};

internals.handleErrors = function (err, response) {

  if (err) return err;

  switch (response.statusCode) {
    case 404:
      var newError = new Error('[HAT Response] Requested data source model not found');
      newError.status = response.statusCode;
      return newError;

    default:
      return null;
  }
};

internals.jsonTypeRules = function (key, value) {

  if ((typeof value === 'number' && key !== 'id') || typeof value === 'boolean') {
    return value.toString();
  } else {
    return value;
  }

};

internals.normalizeJsonValueTypes = function (obj) {
  return JSON.stringify(obj, internals.jsonTypeRules);
};
