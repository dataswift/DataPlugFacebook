var expect = require('chai').expect;
var sinon = require('sinon');
var mockery = require('mockery');

describe('HAT API library', function() {

  var hatRequestStub;
  var hat;

  before(function() {

    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    hatRequestStub = sinon.stub();

    // replace the 'request' module with stub object
    mockery.registerMock('request', hatRequestStub);

    hat = require('../app/hatRestApi');

  });

  after(function() {
    mockery.disable();
  });

  it('gets ID of data source model for given unique name/source pair', function (done) {

    hatRequestStub.yields(null, {statusCode: 200}, {id: 15});

    hat.getDataSourceId('posts', 'facebook', function (error, dataSourceId) {
      expect(dataSourceId).to.equal(15);
      done();
    });
  });

});

