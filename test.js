var adapt = require('./adapt')
var should = require('chai').should();
describe('adapt', function() {
  it ('#transform should exist and have arity 2', function() {
    adapt.transform.should.exist;
    adapt.transform.should.have.length(2);
  });
});
