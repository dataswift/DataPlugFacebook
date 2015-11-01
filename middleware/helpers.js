var _ = require('lodash');

var helpers = {
  hatFormat: function (key, value) {
    if (typeof value === 'number' && key !== 'id') {
      return value.toString();
    }
    return value;
  },

  mapDataSourceModel: function(tree, prefix) {
    var idMapping = {};
    tree.fields.forEach(function(node) {
      idMapping[prefix+'_'+node.name] = node.id;
    });

    if (tree.subTables.length > 0){
      tree.subTables.map(function(subTree) {
        var mappedSubTree = this.mapDataSourceModel(subTree, subTree.name);
        idMapping = _.defaults(idMapping, mappedSubTree);
      }, this);
    }
    return idMapping;
  },

  convertDataToHat: function(idMapping, data) {
    var convertedData = data.map(function(record) {
      var convertedRecord = [];
      this.convertNode(record, '', idMapping, convertedRecord);
      return convertedRecord;
    }, this);

    return convertedData;
  },

  convertNode: function(node, prefix, idMapping, hatRecord) {
    Object.keys(node).forEach(function(key) {
      if (typeof(node[key]) === 'object') {
        this.convertNode(node[key], key, idMapping, hatRecord);
      } else {
        var hatEntry = {
          value: node[key],
          field: {
            id: idMapping[prefix+'_'+key],
            name: key
          }
        };
        hatRecord.push(hatEntry);
      }
    }, this);
  }
};

module.exports = helpers;