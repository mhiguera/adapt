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
  .expandAsProperty('full_name')
  .runCommand(function() {
    var split = this.full_name.split(' ');
    this.name = split[0];
    this.surname = split[1];
    if (split[2]) this.suffix = split[2];
  });

var family = adapt.createTransformation()
  .transformCollection('children', fullName)
  .transformProperty('father', fullName)
  .transformProperty('mother', fullName)
  .assignProperty('children_count', function() {
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
