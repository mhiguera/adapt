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
      transformation.remove('prop1');
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
      transformation.remove('prop1');
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
      transformation.remove('prop1');
      transformation.remove('prop2');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.prop1);
      should.not.exist(transformed.prop2);
      should.exist(transformed.prop3);
    })

    it('should remove two properties when asked to (chain)', function() {
      var test = { prop1: '1', prop2: 'b', prop3: 'c' }
      var transformation = adapt.createTransformation();
      transformation.remove('prop1').remove('prop2');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.prop1);
      should.not.exist(transformed.prop2);
      should.exist(transformed.prop3);
    });

    it('should cast a property given a castType', function() {
      var test = { prop1: '1', prop2: 'b', prop3: 'c' }
      var transformation = adapt.createTransformation();
      transformation.cast('prop1', Number);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.prop1);
      transformed.prop1.should.be.a('number');
    });

    it('should rename a property once', function() {
      var test = { prop: 'a' }
      var transformation = adapt.createTransformation();
      transformation.rename('prop', 'property')
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.property)
    });

    it('should rename a property three times', function() {
      var test = { prop1: '1', prop2: 'b', prop3: 'c' }
      var transformation = adapt.createTransformation();
      transformation
        .rename('prop1', 'a')
        .rename('a', 'alpha')
        .rename('alpha', 'prop1');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      transformed.prop1.should.equal(test.prop1);
      transformed.prop2.should.equal(test.prop2);
      transformed.prop3.should.equal(test.prop3);
    });

    it('should assign a property', function() {
      var test = { prop1: 1, prop2: 2, prop3: 3 }
      var transformation = adapt.createTransformation();
      transformation.set('sum', 6);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.sum);
      transformed.sum.should.equal(6);
    });

    it('should assign some properties', function() {
      var test = { prop1: 1, prop2: 2, prop3: 3 }
      var transformation = adapt.createTransformation();
      transformation.setProperties({
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
      transformation.clone('prop1', 'prop2');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.prop2);
      transformed.prop2.should.equal(1);
    });

    it('should clone a property (non-primitive)', function() {
      var test = { prop1: [1,2,3] }
      var transformation = adapt.createTransformation();
      transformation.clone('prop1', 'prop2');
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
      transformation.set('sum', function() {
        var sum = 0;
        for (var prop in this) sum += this[prop];
        return sum;
      });
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.sum);
      transformed.sum.should.equal(6);
    });

    it('should compute a property with deferred and synchronous values in a chain', function() {
      var test = { prop1: 1, prop2: 2, prop3: 3 }
      var transformation = adapt.createTransformation();
      transformation
        .set('sum1', 2)
        .set('sum2', function(ctx) {
          var sum = 0;
          for (var prop in this) sum += this[prop];
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve(sum);
            }, 100)
          });
        })
        .set('sum3', function(ctx) {
          return 4;
        })
        .set('sum4', 5);
      var transformedDeferred = adapt.transformAsync(test, transformation);
      return transformedDeferred.then((transformed) => {
        should.exist(transformed);
        should.exist(transformed.sum1);
        should.exist(transformed.sum2);
        should.exist(transformed.sum3);
        should.exist(transformed.sum4);
        transformed.sum2.should.equal(8);
      });
    });

    it('should compute a property with synchronous values in a chain', function() {
      var test = { prop1: 1, prop2: 2, prop3: 3 }
      var transformation = adapt.createTransformation();
      transformation
        .set('sum1', 2)
        .set('sum2', function(ctx) {
          return 4;
        })
        .set('sum3', 5);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.sum1);
      should.exist(transformed.sum2);
      should.exist(transformed.sum3);
    });

    it('should not assign a computed property if no return is found and property existed before', function() {
      var test = { value: 1 }
      var fn = function() {
        if (this.value < 10) return this.value * 10;
      }
      var transformation = adapt.createTransformation();
      transformation.set('value', fn);
      transformation.set('value', fn);
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
        .set('sum', sum)

      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.sum);
      transformed.sum.should.equal(16);
    });

    it('should pass a context through adapt', function() {
      var test = { prop1: 'a', prop2: 'b' }
      var transformation = adapt.createTransformation()
        .set('concat', function(ctx) { return [this.prop1, this.prop2].join(ctx) })
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
        .set('sum', sum)

      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.sum);
      transformed.sum.should.equal(6);
    });

    it('should run a command', function() {
      var test = { list: [] };
      var command = function() { var i=32; while (i--) this.list[i] = Math.pow(2,i) }
      var transformation = adapt.createTransformation().run(command)
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.list);
      transformed.list[0].should.equal(1);
      transformed.list[16].should.equal(65536);
      transformed.list.should.have.length(32);
    });

    it('should apply an external function', function() {
      var test = [1,2,3,4,5,6,7,8];
      var fn = function(o) { return o.filter(function(e) { return !(e%2) })}
      var transformation = adapt.createTransformation().apply(fn);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      transformed[0].should.equal(2);
      transformed[1].should.equal(4);
      transformed.should.have.length(4);
    })

    it('should expand an object', function() {
      var test = 'test';
      var transformation = adapt.createTransformation().expand('test');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.test);
      transformed.test.should.equal('test');
    });

    it('should expand an object with exceptions', function() {
      var test = {};
      test.a = 1;
      test.b = 2;
      var transformation = adapt.createTransformation().expandExcept('test', ['b']);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed.b);
      should.exist(transformed.test);
      transformed.test.a.should.equal(1);
    });


    it('should extract an object from property', function() {
      var test = { 'text': 'test' }
      var transformation = adapt.createTransformation().extract('text')
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      transformed.should.equal('test');
    });

    it('should transform a property', function() {
      var test = { 'prop': 'value' }
      var sub = adapt.createTransformation().expand('inner');
      var transformation = adapt.createTransformation().transform('prop', sub);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.prop);
      should.exist(transformed.prop.inner);
    })

    it('should transform a property passing a context', function() {
      var test = { 'inner': { 'prop': 'value' } };
      var sub = adapt.createTransformation().set('context', function(ctx) { return ctx } );
      var transformation = adapt.createTransformation().transform('inner', sub);
      var transformed = adapt.transform(test, transformation, 'contextValue');
      should.exist(transformed);
      should.exist(transformed.inner);
      should.exist(transformed.inner.context);
      transformed.inner.context.should.equal('contextValue');
    })

    it('should transform a collection-property passing a context', function() {
      var test = { 'inner': [{ 'prop': 'value' }, { 'prop': 'value' }] };
      var sub = adapt.createTransformation().set('context', function(ctx) { return ctx } );
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
      var transformation = adapt.createTransformation().expand('expanded');
      var branch1 = transformation.branch().rename('expanded', 'someProperties');
      var branch2 = transformation.branch().rename('expanded', 'otherProperties');
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
        .set('test', 'test')
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
        .group(['prop1', 'prop2', 'prop3'], 'group');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.group);
      should.not.exist(transformed.prop1);
      should.exist(transformed.group.prop1);
    })

    it('should group property values as an array in another property', function() {
      var test = { prop1: 'a', prop2: 'b', prop3: 'c' }
      var transformation = adapt.createTransformation()
        .listValues(['prop1', 'prop2', 'prop3'], 'list');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.list);
      should.not.exist(transformed.prop1);
      transformed.list[0].should.equal('a');
    })

    it('should group properties as an array of objects in another property', function() {
      var test = { prop1: 'a', prop2: 'b', prop3: 'c' }
      var transformation = adapt.createTransformation()
        .listProperties(['prop1', 'prop2', 'prop3'], 'list');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.list);
      should.not.exist(transformed.prop1);
      transformed.list[0].should.deep.equal( { prop1: 'a' } );
    })

    it('should numberize a property when asked to', function() {
      var test = { p: '123' }
      var transformation = adapt.createTransformation()
        .set('pnum', adapt.tap.numberize('p'));
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.pnum);
      transformed.pnum.should.equal(123);
    })

    it('should assign a tapped variable', function() {
      var test = { depth1: [{ depth2: { depth3: [0,1,2,3,4] }}]};
      var transformation = adapt.createTransformation()
      transformation.set('value', adapt.tap.get('depth1[0].depth2.depth3[2]'));
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.value);
      transformed.value.should.be.equal(2);
    })

    it('should assign a tapped variable name', function() {
      var test = { depth1: [{ depth2: { depth3: [0,1,2,3,4] }}]};
      var transformation = adapt.createTransformation();
      transformation.run(adapt.tap.set('depth1[0].depth2.depth3[2]', 'test'));
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.depth1[0].depth2.depth3[2]);
      transformed.depth1[0].depth2.depth3[2].should.be.equal('test');
    })

    it('should transform independently', function() {
      var test1 = { propName: 'propValue' }
      var transformation = adapt.createTransformation();
      transformation.expand('expanded');
      var transformed1 = adapt.transform(test1, transformation);
      should.exist(transformed1);
      should.exist(transformed1.expanded);
      should.not.exist(transformed1.expanded.expanded);
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

    it('should group collections', function() {
      var test = {};
      test.sub1 = [1,2,3];
      test.sub2 = [4,5,6];
      var transformation = adapt.createTransformation();
      transformation.mergeCollections(['sub1', 'sub2'], 'coll');
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.coll);
      should.equal(transformed.coll.length, 6);
    })

    it('should remove properties given a condition', function() {
      var test = {};
      test.prop = 1;
      var transformation = adapt.createTransformation();
      transformation.removeIf('prop', 1)
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.prop);
    })

    it('should remove properties given a condition (as a function)', function() {
      var test = {};
      test.remove = true;
      test.prop = 1;
      var transformation = adapt.createTransformation();
      transformation.removeIf('prop', function() {
        return test.remove;
      })
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.prop);
    })

    it('should (not) remove properties given a condition (as a function)', function() {
      var test = {};
      test.remove = false;
      test.prop = 1;
      var transformation = adapt.createTransformation();
      transformation.removeIf('prop', function() {
        return test.remove;
      })
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.prop);
    })

    it('should transform dot-notation properties into object properties', function() {
      var test = {};
      test['a.b.c'] = 1;
      test['a.d.e'] = 1;
      var transformation = adapt.createTransformation().expandDots();
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.a);
      should.exist(transformed.a.b);
      should.exist(transformed.a.b.c);
      transformed.a.b.c.should.equal(1);
      transformed.a.d.e.should.equal(1);
    })

    it('should transform dot-notation properties (matching a regex) into object properties', function() {
      var test = {};
      test['a.b.c'] = 1;
      test['d.e.f'] = 1;
      var transformation = adapt.createTransformation().expandDots(/^a/);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.exist(transformed.a);
      should.exist(transformed.a.b);
      should.exist(transformed.a.b.c);
      transformed.a.b.c.should.equal(1);
      should.exist(transformed['d.e.f']);
    })

    it('should remove all properties passed as array', function() {
      var test = {};
      test.a = 1;
      test.b = 1;
      test.c = 1;
      var transformation = adapt.createTransformation().remove(['a','b']);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.a);
      should.not.exist(transformed.b);
      should.exist(transformed.c);
    })

    it('should remove all null properties', function() {
      var test = {};
      test.a = null;
      test.b = null;
      test.c = 1;
      var transformation = adapt.createTransformation().removeNils();
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.a);
      should.not.exist(transformed.b);
      should.exist(transformed.c);
    })

    it('should remove all null properties, even the nested ones', function() {
      var test = {};
      test.a = null;
      test.b = null;
      test.c = {};
      test.c.c1 = null;
      test.c.c2 = null;
      test.c.c3 = 1;
      var transformation = adapt.createTransformation().removeNils(true);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.a);
      should.not.exist(transformed.b);
      should.exist(transformed.c);
      should.not.equal(transformed.c.c1, null);
      should.not.equal(transformed.c.c2, null);
      should.exist(transformed.c.c3);
    })

    it('should remove all null properties, even the nested ones', function() {
      var test = {};
      test.a = null;
      test.b = null;
      test.c = {};
      test.c.c1 = null;
      test.c.c2 = null;
      test.c.c3 = 1;
      var transformation = adapt.createTransformation().removeNils(false);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.a);
      should.not.exist(transformed.b);
      should.exist(transformed.c);
      should.equal(transformed.c.c1, null);
      should.equal(transformed.c.c2, null);
      should.exist(transformed.c.c3);
    })

    it('should remove all empty arrays', function() {
      var test = {};
      test.a = [];
      test.b = [];
      test.c = 1;
      var transformation = adapt.createTransformation().removeEmptyArrays(false);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.a);
      should.not.exist(transformed.b);
      should.exist(transformed.c);
    })

    it('should remove all empty arrays, even the nested ones', function() {
      var test = {};
      test.a = [];
      test.b = [1];
      test.c = {};
      test.c.c1 = [];
      test.c.c2 = [1,2,3];
      test.c.c3 = 1;
      var transformation = adapt.createTransformation().removeEmptyArrays(true);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.a);
      should.exist(transformed.b);
      should.exist(transformed.c);
      should.not.exist(transformed.c.c1);
      should.exist(transformed.c.c2);
      should.exist(transformed.c.c3);
    })

    it('should remove all empty strings', function() {
      var test = {};
      test.a = '';
      test.b = '';
      test.c = 1;
      var transformation = adapt.createTransformation().removeEmptyStrings(false);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.a);
      should.not.exist(transformed.b);
      should.exist(transformed.c);
    })

    it('should remove all empty strings, even the nested ones', function() {
      var test = {};
      test.a = ''
      test.b = 1;
      test.c = {};
      test.c.c1 = '';
      test.c.c2 = [1,2,3];
      test.c.c3 = '1';
      var transformation = adapt.createTransformation().removeEmptyStrings(true);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed);
      should.not.exist(transformed.a);
      should.exist(transformed.b);
      should.exist(transformed.c);
      should.not.exist(transformed.c.c1);
      should.exist(transformed.c.c2);
      should.exist(transformed.c.c3);
    })

    it('should remove all properties matching a pattern', function() {
      var test = {};
      test.a = 1;
      test.b = 2;
      test.c = 1;
      var transformation = adapt.createTransformation().remove(/^[ab]$/);
      var transformed = adapt.transform(test, transformation);
      should.not.exist(transformed.a);
      should.not.exist(transformed.b);
      should.exist(transformed.c);
    })

    it('should remove all properties matching a pattern, even the nested ones', function() {
      var test = {};
      test.a = 1;
      test.b = 2;
      test.c = {};
      test.c.a = 1;
      test.c.b = 2;
      test.c.c = 3;
      var transformation = adapt.createTransformation().remove(/^[ab]$/, true);
      var transformed = adapt.transform(test, transformation);
      should.not.exist(transformed.a);
      should.not.exist(transformed.b);
      should.exist(transformed.c);
      should.not.exist(transformed.c.a);
      should.not.exist(transformed.c.b);
      should.exist(transformed.c.c);
    })

    it('should rename camel-cased properties to snake-cased', function() {
      var test = {};
      test.dummyProperty = 1;
      test.OtherDummyProperty = {};
      test.OtherDummyProperty.AnotherOneBitesTheDust = 2;
      var transformation = adapt.createTransformation().camelToSnake();
      var transformed = adapt.transform(test, transformation);
      should.not.exist(transformed.dummyProperty);
      should.not.exist(transformed.OtherDummyProperty);
      should.exist(transformed.dummy_property);
      should.exist(transformed.other_dummy_property);
      should.exist(transformed.other_dummy_property);
      should.exist(transformed.other_dummy_property.AnotherOneBitesTheDust);
    })

    it('should rename camel-cased properties to snake-cased, even the nested ones', function() {
      var test = {};
      test.dummyProperty = 1;
      test.OtherDummyProperty = {};
      test.OtherDummyProperty.AnotherOneBitesTheDust = 2;
      var transformation = adapt.createTransformation().camelToSnake(true);
      var transformed = adapt.transform(test, transformation);
      should.not.exist(transformed.dummyProperty);
      should.not.exist(transformed.OtherDummyProperty);
      should.exist(transformed.dummy_property);
      should.exist(transformed.other_dummy_property);
      should.exist(transformed.other_dummy_property.another_one_bites_the_dust);
    })

    it('should rename camel-cased properties of an array-nested object matching a pattern', function() {
      var test = [{ dummyProperty: 1, otherDummyProperty: [ { anotherOneBitesTheDust: 1 } ] }];
      var transformation = adapt.createTransformation().camelToSnake(true);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed[0].dummy_property);
      should.exist(transformed[0].other_dummy_property[0].another_one_bites_the_dust);
    })

    it('should rename snake-cased properties to snake-cased', function() {
      var test = {};
      test.dummy_property = 1;
      test.other_dummy_property = {};
      test.other_dummy_property.another_one_bites_the_dust = 2;
      var transformation = adapt.createTransformation().snakeToCamel();
      var transformed = adapt.transform(test, transformation);
      should.not.exist(transformed.dummy_property);
      should.not.exist(transformed.other_dummy_property);
      should.exist(transformed.dummyProperty);
      should.exist(transformed.otherDummyProperty);
      should.exist(transformed.otherDummyProperty.another_one_bites_the_dust);
    })

    it('should rename snake-cased properties to snake-cased, even the nested ones', function() {
      var test = {};
      test.gotcha = 1;
      test.dummy_property = 1;
      test.other_dummy_property = {};
      test.other_dummy_property.another_one_bites_the_dust = 2;
      var transformation = adapt.createTransformation().snakeToCamel(true);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed.gotcha);
      should.not.exist(transformed.dummy_property);
      should.not.exist(transformed.other_dummy_property);
      should.exist(transformed.dummyProperty);
      should.exist(transformed.otherDummyProperty);
      should.exist(transformed.otherDummyProperty.anotherOneBitesTheDust);
    })

    it('should rename and capitalize snake-cased properties to snake-cased, even the nested ones', function() {
      var test = {};
      test.dummy_property = 1;
      test.other_dummy_property = {};
      test.other_dummy_property.another_one_bites_the_dust = 2;
      var transformation = adapt.createTransformation().snakeToCamel(true, true);
      var transformed = adapt.transform(test, transformation);
      should.not.exist(transformed.dummy_property);
      should.not.exist(transformed.other_dummy_property);
      should.exist(transformed.DummyProperty);
      should.exist(transformed.OtherDummyProperty);
      should.exist(transformed.OtherDummyProperty.AnotherOneBitesTheDust);
    })


    it('should rename snake-cased properties of an array-nested object matching a pattern', function() {
      var test = [{ dummy_property: 1, other_dummy_property: [ { another_one_bites_the_dust: 1 } ] }];
      var transformation = adapt.createTransformation().snakeToCamel(true);
      var transformed = adapt.transform(test, transformation);
      should.exist(transformed[0].dummyProperty);
      should.exist(transformed[0].otherDummyProperty[0].anotherOneBitesTheDust);
    })

  });
});
