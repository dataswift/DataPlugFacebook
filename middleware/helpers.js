var helpers = {
  hatFormat: function (key, value) {
    if (typeof value === 'number' && key !== 'id') {
      return value.toString();
    }
    return value;
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