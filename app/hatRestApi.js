'use strict';

/**
 * Load modules
 */

var qs = require('qs');
var request = require('request');
var _ = require('lodash');
var async = require('async');

/**
 * Define request configuration
 */

var internals = {};

internals.requestOptions = {
  mainUrl: null,
  url: null,
  qs: { access_token: null },
  method: 'GET',
  headers: {
    "User-Agent": "MyClient/1.0.0",
    "Accept": "application/json",
    "Host": "example.hatdex.org",
    "Content-Type": "application/json"
  },
  json: true
};

// Network methods
/****************/

exports.getDataSourceId = function (name, source, callback) {

  internals.requestOptions.url = internals.requestOptions.mainUrl + '/table';
  internals.requestOptions.qs.name = name;
  internals.requestOptions.qs.source = source;

  request(internals.requestOptions, function (err, response, body) {

    internals.requestOptions.qs.name = null;
    internals.requestOptions.qs.source = null;
    var foundError = internals.handleErrors(err, response);
    var dataSourceId;
    if (body.id) {
      dataSourceId = body.id;
    }

    return callback(foundError, dataSourceId);

  });

};

exports.getDataSourceModel = function (dataSourceId, callback) {

  internals.requestOptions.url = internals.requestOptions.mainUrl + '/table/' + dataSourceId;

  request(internals.requestOptions, function (err, response, body) {

    var foundError = internals.handleErrors(err, response)

    return callback(foundError, body);

  });

};

exports.createDataSourceModel = function (dataSourceModelConfig, callback) {

  internals.requestOptions.url = internals.requestOptions.mainUrl + '/table';
  internals.requestOptions.method = 'POST';
  internals.requestOptions.body = dataSourceModelConfig;

  request(internals.requestOptions, function (err, response, body) {

    internals.requestOptions.method = 'GET';
    internals.requestOptions.body = null;
    var foundError = internals.handleErrors(err, response);

    return callback(foundError, body);

  });
};

exports.createRecords = function (record, callback) {

  internals.requestOptions.url = internals.requestOptions.mainUrl + '/record/values';
  internals.requestOptions.method = 'POST';
  internals.requestOptions.json = false;
  internals.requestOptions.body = internals.normalizeJsonValueTypes(record);

  console.log(internals.requestOptions);

  request(internals.requestOptions, function (err, response, body) {

    internals.requestOptions.method = 'GET';
    internals.requestOptions.json = true;
    internals.requestOptions.body = null;
    var foundError = internals.handleErrors(err, response);

    console.log('#' * 100);
    console.log('Posted to HAT: ', JSON.parse(body));

    return callback(foundError);

  });

};

// Data transformation methods
/****************************/

exports.mapDataSourceModelIds = function (table) {

  var hatIdMappingArray = internals.mapDataSourceModelIds(table, '');
  var hatIdMappingObject = _.zipObject(hatIdMappingArray);

  return hatIdMappingObject;
};

internals.mapDataSourceModelIds = function (table, prefix) {
  if (prefix !== '')
    prefix = prefix + '_';

  var tableMapping = _.map(table.fields, function(field) {
    return [prefix + field.name, field.id];
  });

  if (table.subTables && table.subTables.length > 0) {

    var subTableMapping = _.map(table.subTables, function(subTable) {
      return internals.mapDataSourceModelIds(subTable, prefix+subTable.name);
    });

    var flattenedSubTableMapping = _.flatten(subTableMapping);
  }

  return tableMapping.concat(flattenedSubTableMapping);
};

exports.transformObjectToHat = function (name, inputObj, hatIdMapping) {

  if (typeof inputObj === 'array') {

    return _.map(inputObj, function (node) {

      var values = hat.generateHatValues(node, hatIdMapping, '');

      return {
        record: { name: name },
        values: values
      };

    });

  } else if (typeof inputObj === 'object') {

    var values = internals.generateHatValues(inputObj, hatIdMapping, '');

    return [{
      record: { name: name },
      values: values
    }];

  }

  return null;

};

internals.generateHatValues = function (node, hatIdMapping, prefix) {

  if (prefix !== '')
    prefix = prefix + '_'

  var convertedData = _.map(node, function (value, key) {

    if (typeof value === 'object') {
      if (typeof value === 'array') {
        return _.map(value, function(valueItem) {
          internals.generateHatValues(valueItem, hatIdMapping, prefix+key)
        })
      }
      // FIXME: next prefix should be prefix_key
      return internals.generateHatValues(value, hatIdMapping, prefix+key);

    } else {

      var newHatValue = {
        value: value,
        field: {
          id: hatIdMapping[prefix+key],
          name: key
        }
      };

      return newHatValue;
    }

  });

  var flattenedValues = _.flattenDeep(convertedData);

  return flattenedValues;

};

// Helper methods
/***************/

internals.handleErrors = function (err, response) {
  console.log("handle errors");
  console.log(err);
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

// Accessor methods
/*****************/

/**
 * Sets all request options
 * Maps directly to 'request' module configuration object
 * @param {Object} options
 */

exports.setOptions = function (options) {
  if (typeof options === 'object') internals.requestOptions = options;

  return this;
};

/**
 * Gets all request options
 * @returns the request options object
 */

exports.getOptions = function () {
  return internals.requestOptions;
};

/**
 * Sets the access token
 * @param {string} token
 */

exports.setAccessToken = function (token) {
  internals.requestOptions.qs.access_token = token;

  return this;
};

/**
 * Gets the access token
 * @returns the access token
 */

exports.getAccessToken = function () {
  return internals.requestOptions.qs.access_token;
};

/**
 * Sets HAT base URL
 * @param {string} url
 */

exports.setUrl = function (url) {
  // TODO: validate url format
  internals.requestOptions.mainUrl = url + '/data';

  return this;
};

/**
 * Gets HAT base URL
 * @returns the HAT base URL
 */

exports.getUrl = function() {
  return internals.requestOptions.url;
};



