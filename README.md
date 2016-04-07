Learning by example
===================

```
var adapt = require('adapt');
var data = {
  father:   'John Doe',
  mother:   'Jane Doe',
  children: ['John Doe Jr.', 'Jane Doe Jr.']
}

var fullName = adapt.createTransformation()
  .expand('full_name')
  .run(function() {
    var split = this.full_name.split(' ');
    this.name = split[0];
    this.surname = split[1];
    if (split[2]) this.suffix = split[2];
  });

var family = adapt.createTransformation()
  .transformCollection('children', fullName)
  .transform('father', fullName)
  .transform('mother', fullName)
  .set('children_count', function() {
    return this.children.length;
  });

console.log(adapt.transform(data, family));
```

Output:

```
{ father: { full_name: 'John Doe', name: 'John', surname: 'Doe' },
  mother: { full_name: 'Jane Doe', name: 'Jane', surname: 'Doe' },
  children: 
   [ { full_name: 'John Doe Jr.',
       name: 'John',
       surname: 'Doe',
       suffix: 'Jr.' },
     { full_name: 'Jane Doe Jr.',
       name: 'Jane',
       surname: 'Doe',
       suffix: 'Jr.' } ],
  children_count: 2 }

```

Changelog
=========
* 0.2.18
  * `removeByPattern` transformation deprecated in favour of `remove`
  
* 0.2.17
  * New transformations:
    * `removeNils` removes empty objects
    * `removeEmptyStrings` removes empty strings
    * `removeEmptyArrays` removes empty arrays
    * `removeByPattern` removes objects matching a RegExp
    * `camelToSnake` renames camel-cased keys to snake-cased
  * Remove transformation now accepts an array as argument

* 0.2.16
  * New "inspect" transformation

* 0.2.15
  * Group transformation now groups null properties as well.

* 0.2.14
  * New utils (extend, extendCircular, shallowCopy, cloneCircular, cloneJSON)
  * Older methods show a deprecation warning
  * Minor bugfixes and improvements
  * Tests were updated

* 0.2.13
  * Bugfixes

* 0.2.10
  * New method names (the old ones were aliased)
  * Dot-notation transformation (expandDots(regex) method)

* 0.2.9
  * Added removePropertyIf transformation method
  * Added mergeCollections transformation method
  * Minor bugfixes

* 0.2.8
  * Removed injectParent
  * Added function type as context

* 0.2.7
  * Bugfixes

* 0.2.6
  * Added __parent (read-only, not enumerable) property for nested transformations

* 0.2.5
  * checkDependencies now accepts a custom message

* 0.2.4
  * Added checkDependencies to adapt transformations

* 0.2.3
  * setProperty now accepts a transformation to be passed as value

* 0.2.2
  * Transformation method "concat" now accepts (or passes) a context

* 0.2.1
  * Added extractFromProperty

* 0.2.0 
  *	Transformations no longer destructive
  * Added new tests
  * Added concat

* 0.1.7 
  *	Added transformCollection (removed Array transformation "magic")
  * Minor bugfixes

* 0.1.5 - 0.1.6
  * Bugfixes

* 0.1.4
  * Added clone method

* 0.1.3
  * Removed adapt.tap.value in favour of adapt.tap.get and adapt.tap.set

* 0.1.2
  * New tap utils: value, equals, notEquals, existance, lengthOf and numberize
  * assignProperty and assignProperties deprecated in favour of setProperty and setProperties

* 0.1.1
  * New groupProperties functionality for transformations

* 0.1.0
  * Bugfixes
