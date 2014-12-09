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


    it('should remove a property (from a collection)', function() {
      var t = { prop1: '1', prop2: 'b', prop3: 'c' }
      var test = [t,t,t];
      var transformation = adapt.createTransformation();
      transformation.removeProperty('prop1');
      var transformed = adapt.transformCollection(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed[0].prop1);
      should.exist(transformed[0].prop2);
      should.exist(transformed[0].prop3);
      should.not.exist(transformed[1].prop1);
      should.exist(transformed[1].prop2);
      should.exist(transformed[1].prop3);
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

    it('should rename a property once', function() {
      var test = { prop: 'a' }
      var transformation = adapt.createTransformation();
      transformation.renameProperty('prop', 'property')
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.property)
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
      transformed.prop1.should.equal(test.prop1);
      transformed.prop2.should.equal(test.prop2);
      transformed.prop3.should.equal(test.prop3);
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

    it('should assign some properties', function() {
      var test = { prop1: 1, prop2: 2, prop3: 3 }
      var transformation = adapt.createTransformation();
      transformation.assignProperties({
        sum: 6,
        count: 3
      });
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.sum);
      should.exist(transformed.count);
      transformed.sum.should.equal(6);
    });

    it('should clone a property (primitive)', function() {
      var test = { prop1: 1 }
      var transformation = adapt.createTransformation();
      transformation.cloneProperty('prop1', 'prop2');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.prop2);
      transformed.prop2.should.equal(1);
    });
    
    it('should clone a property (non-primitive)', function() {
      var test = { prop1: [1,2,3] }
      var transformation = adapt.createTransformation();
      transformation.cloneProperty('prop1', 'prop2');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.prop2);
      transformed.prop2[0].should.equal(1);
      transformed.prop2[1].should.equal(2);
      transformed.prop2[2].should.equal(3);
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

    it('should extract an object from property', function() {
      var test = { 'text': 'test' }
      var transformation = adapt.createTransformation().extractFromProperty('text')
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      transformed.should.equal('test');
    });

    it('should transform a property', function() {
      var test = { 'prop': 'value' }
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
      var transformation = adapt.createTransformation().transformCollection('inner', sub);
      var transformed = adapt.transform(test, transformation, 'contextValue');
      should.exist(transformed);
      should.exist(transformed.inner);
      should.exist(transformed.inner[0].context);
      should.exist(transformed.inner[1].context);
      transformed.inner[0].context.should.equal('contextValue');
      transformed.inner[1].context.should.equal('contextValue');
    })

    it('should branch a transformation', function() {
      var test1 = { prop: 1 };
      var test2 = { prop: 2 };
      var transformation = adapt.createTransformation().expandAsProperty('expanded');
      var branch1 = transformation.branch().renameProperty('expanded', 'someProperties');
      var branch2 = transformation.branch().renameProperty('expanded', 'otherProperties');
      var transformed1 = adapt.transform(test1, branch1);
      var transformed2 = adapt.transform(test2, branch2);
      should.exist(transformed1);
      should.exist(transformed2);
      should.exist(transformed1.someProperties);
      should.exist(transformed2.otherProperties);
      transformed1.someProperties.prop.should.equal(1);
      transformed2.otherProperties.prop.should.equal(2);
    })

    it('should recursively run a transformation', function() {
      var test = { prop: 1, child: { prop: 2, child: { prop: 3 }}}
      var transformation = adapt.createTransformation()
        .assignProperty('test', 'test')
        .recursiveTransform('child')
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.test);
      should.exist(transformed.child.test);
      should.exist(transformed.child.child.test);
    })

    it('should group properties in another property', function() {
      var test = { prop1: 'a', prop2: 'b', prop3: 'c' }
      var transformation = adapt.createTransformation()
        .groupProperties(['prop1', 'prop2', 'prop3'], 'group');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.group);
      should.not.exist(transformed.prop1);
      should.exist(transformed.group.prop1);
    })

    it('should numberize a property when asked to', function() {
      var test = { p: '123' }
      var transformation = adapt.createTransformation()
        .setProperty('pnum', adapt.tap.numberize('p'));
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.pnum);
      transformed.pnum.should.equal(123);
    })

    it('should assign a tapped variable', function() {
      var test = { depth1: [{ depth2: { depth3: [0,1,2,3,4] }}]};
      var transformation = adapt.createTransformation()
      transformation.setProperty('value', adapt.tap.get('depth1[0].depth2.depth3[2]'));
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.value);
      transformed.value.should.be.equal(2);
    })

    it('should assign a tapped variable name', function() {
      var test = { depth1: [{ depth2: { depth3: [0,1,2,3,4] }}]};
      var transformation = adapt.createTransformation();
      transformation.runCommand(adapt.tap.set('depth1[0].depth2.depth3[2]', 'test'));
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.depth1[0].depth2.depth3[2]);
      transformed.depth1[0].depth2.depth3[2].should.be.equal('test');
    })

    it('should transform independently', function() {
      var test1 = { propName: 'propValue' }
      var test2 = test1;
      var transformation = adapt.createTransformation();
      transformation.expandAsProperty('expanded');
      var transformed1 = adapt.transform(test1, transformation);
      should.exist(transformed1);
      should.exist(transformed1.expanded);
      should.not.exist(transformed1.expanded.expanded);
      var transformed2 = adapt.transform(test2, transformation);
      should.exist(transformed1);
      should.exist(transformed1.expanded);
      should.not.exist(transformed1.expanded.expanded);
    })

    it('should throw an exception if properties does not exist', function() {
      var test1 = { prop1: 'a' }
      var transformation = adapt.createTransformation().checkDependencies(['prop1', 'prop2']);
      var fn = adapt.transform.bind(adapt, test1, transformation);
      fn.should.Throw(Error);
      fn.should.Throw('Precondition failed: prop2 should exist');
    })

    it('should throw an exception (custom message) if properties does not exist', function() {
      var test1 = { prop1: 'a' }
      var transformation = adapt.createTransformation().checkDependencies(['prop1', 'prop2'], 'ouch!');
      var fn = adapt.transform.bind(adapt, test1, transformation);
      fn.should.Throw(Error);
      fn.should.Throw('ouch!');
    })
  });
});
