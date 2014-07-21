var adapt = require('./adapt');
var should = require('chai').should();
describe('adapt', function() {
  describe('transformations', function() {
    it('#transform should exist and have an arity of 3', function() {
      should.exist(adapt.transform);
      adapt.transform.should.have.length(3);
    });

    it('#createTransformation should exist and have an arity of 0', function() {
      should.exist(adapt.createTransformation);
      adapt.createTransformation.should.have.length(0);
    });

    it('should return a transformation when created', function() {
      var test = { prop1: '1', prop2: 'b', prop3: 'c' }
      var transformation = adapt.createTransformation();
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
    });

    it('should return the original object if no transformation is done', function() {
      var test = { prop1: '1', prop2: 'b', prop3: 'c' }
      var transformation = adapt.createTransformation();
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      transformed.should.equal(test);
    });

    it('should remove a property when asked to', function() {
      var test = { prop1: '1', prop2: 'b', prop3: 'c' }
      var transformation = adapt.createTransformation();
      transformation.removeProperty('prop1');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.prop1);
      should.exist(transformed.prop2);
      should.exist(transformed.prop3);
    });

    it('should remove two properties when asked to', function() {
      var test = { prop1: '1', prop2: 'b', prop3: 'c' }
      var transformation = adapt.createTransformation();
      transformation.removeProperty('prop1');
      transformation.removeProperty('prop2');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.prop1);
      should.not.exist(transformed.prop2);
      should.exist(transformed.prop3);
    })

    it('should remove two properties when asked to (chain)', function() {
      var test = { prop1: '1', prop2: 'b', prop3: 'c' }
      var transformation = adapt.createTransformation();
      transformation.removeProperty('prop1').removeProperty('prop2');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.prop1);
      should.not.exist(transformed.prop2);
      should.exist(transformed.prop3);
    });

    it('should cast a property given a castType', function() {
      var test = { prop1: '1', prop2: 'b', prop3: 'c' }
      var transformation = adapt.createTransformation();
      transformation.castProperty('prop1', Number);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.prop1);
      transformed.prop1.should.be.a('number');
    });

    it('should rename a property three times', function() {
      var test = { prop1: '1', prop2: 'b', prop3: 'c' }
      var transformation = adapt.createTransformation();
      transformation
        .renameProperty('prop1', 'a')
        .renameProperty('a', 'alpha')
        .renameProperty('alpha', 'prop1');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      transformed.should.equal(test);
    });

    it('should assign a property', function() {
      var test = { prop1: 1, prop2: 2, prop3: 3 }
      var transformation = adapt.createTransformation();
      transformation.assignProperty('sum', 6);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.sum);
      transformed.sum.should.equal(6);
    });

    it('should compute a property', function() {
      var test = { prop1: 1, prop2: 2, prop3: 3 }
      var transformation = adapt.createTransformation();
      transformation.assignProperty('sum', function() {
        var sum = 0;
        for (var prop in this) sum += this[prop];
        return sum;
      });
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.sum);
      transformed.sum.should.equal(6);
    });

    it('should not assign a computed property if no return is found and property existed before', function() {
      var test = { value: 1 }
      var fn = function() {
        if (this.value < 10) return this.value * 10;
      }
      var transformation = adapt.createTransformation();
      transformation.assignProperty('value', fn);
      transformation.assignProperty('value', fn);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.value);
      transformed.value.should.equal(10);
    });

    it('should compute a property within a context', function() {
      var test = { values: [1,2,3] }
      var sum = function(ctx) {
        var reduceFn = function(a, b) { return a + b }
        return this.values.reduce(reduceFn) + ctx;
      }
      var transformation = adapt.createTransformation()
        .setContext(10)
        .assignProperty('sum', sum)

      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.sum);
      transformed.sum.should.equal(16);
    });

    it('should pass a context through adapt', function() {
      var test = { prop1: 'a', prop2: 'b' }
      var transformation = adapt.createTransformation()
        .assignProperty('concat', function(ctx) { return [this.prop1, this.prop2].join(ctx) })
      var transformed = adapt.transform(test, transformation, '+');
      should.exist(transformed);
      should.exist(transformed.concat);
      transformed.concat.should.be.equal('a+b');
    })

    it('should compute a property unsetting a context', function() {
      var test = { values: [1,2,3] }
      var sum = function(ctx) {
        var reduceFn = function(a, b) { return a + b }
        return this.values.reduce(reduceFn) + ctx;
      }
      var transformation = adapt.createTransformation()
        .setContext(10)
        .unsetContext()
        .assignProperty('sum', sum)

      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.sum);
      transformed.sum.should.equal(6);
    });

    it('should run a command', function() {
      var test = { list: [] };
      var command = function() { var i=32; while (i--) this.list[i] = Math.pow(2,i) }
      var transformation = adapt.createTransformation().runCommand(command)
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.list);
      transformed.list[0].should.equal(1);
      transformed.list[16].should.equal(65536);
      transformed.list.should.have.length(32);
    });

    it('should expand an object', function() {
      var test = 'test';
      var transformation = adapt.createTransformation().expandAsProperty('text')
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.text);
      transformed.text.should.equal('test');
    });

    it('should transform a property', function() {
      var test = { 'prop': 'value'}
      var sub = adapt.createTransformation().expandAsProperty('inner');
      var transformation = adapt.createTransformation().transformProperty('prop', sub);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.prop);
      should.exist(transformed.prop.inner);
    })

    it('should transform a property passing a context', function() {
      var test = { 'inner': { 'prop': 'value' } };
      var sub = adapt.createTransformation().assignProperty('context', function(ctx) { return ctx } );
      var transformation = adapt.createTransformation().transformProperty('inner', sub);
      var transformed = adapt.transform(test, transformation, 'contextValue');
      should.exist(transformed);
      should.exist(transformed.inner);
      should.exist(transformed.inner.context);
      transformed.inner.context.should.equal('contextValue');
    })

    it('should transform a collection-property passing a context', function() {
      var test = { 'inner': [{ 'prop': 'value' }, { 'prop': 'value' }] };
      var sub = adapt.createTransformation().assignProperty('context', function(ctx) { return ctx } );
      var transformation = adapt.createTransformation().transformProperty('inner', sub);
      var transformed = adapt.transform(test, transformation, 'contextValue');
      should.exist(transformed);
      should.exist(transformed.inner);
      should.exist(transformed.inner[0].context);
      should.exist(transformed.inner[1].context);
      transformed.inner[0].context.should.equal('contextValue');
      transformed.inner[1].context.should.equal('contextValue');
    })
  });
});
