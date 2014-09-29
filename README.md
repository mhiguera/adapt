Example
=======

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
