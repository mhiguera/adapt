var Transformation = function() {
  this.stack = [];
}

Transformation.aliasMethod = function(methodName, aliasedMethod) {
  Transformation.prototype[methodName] = Transformation.prototype[aliasedMethod];
}

Transformation.addMethod = function(methodName, fn) {
  Transformation.prototype[methodName] = function() {
    this.stack.push(fn.apply(this, [].slice.call(arguments)));
    return this;
  }
}

Transformation.prototype.branch = function() {
  var branch = new Transformation();
  branch.setLoopback(this);
  return branch;
}

Transformation.prototype.setLoopback = function(loopback) {
  this.loopback = loopback;
}

Transformation.prototype.getContext = function() {
  return this.context;
}

Transformation.prototype.runCollection  = function(object, context) {
  var self = this;
  return object.map(function(o) { return self.run(o, context) });
}

Transformation.prototype.run = function(source, context) {
  var object = {};

  if ('object' === typeof source) for (var i in source) object[i] = source[i];
  else object = source;

  if (this.loopback) object = this.loopback.run(object, context);
  if (context) this.context = context;
  this.stack.forEach(function(transform) {
    object = transform(object);
  });
  return object;
}

Transformation.addMethod('setContext', function(context) {
  var self = this;
  return function(object) {
    self.context = context;
    return object;
  }
})

Transformation.addMethod('unsetContext', function(context) {
  var self = this;
  return function(object) {
    self.context = null;
    return object;
  }
})

Transformation.addMethod('removeProperty', function(propName) {
  return function(object) {
    delete object[propName];
    return object;
  }
})

Transformation.addMethod('filterProperties', function(arr) {
  return function(object) {
    for (var prop in object) {
      if (!~arr.indexOf(prop)) delete object[prop];
    }
    return object;
  }
})

Transformation.addMethod('castProperty', function(propName, cast) {
  return function(object) {
    object[propName] = cast(object[propName]);
    return object;
  }
})

Transformation.addMethod('renameProperty', function(oldPropName, newPropName) {
  return function(object) {
    object[newPropName] = object[oldPropName];
    delete object[oldPropName];
    return object;
  }
})

Transformation.addMethod('setProperty', function(propName, value) {
  var self = this;
  return function(object) {
    var v = ('function' === typeof value)? value.call(object, self.getContext()) : value;
    object[propName] = ('undefined' !== typeof v)? v : object[propName];
    return object;
  }
})

Transformation.addMethod('setProperties', function(properties) {
  var self = this;
  return function(object) {
    for (var propName in properties) {
      var value = properties[propName];
      var v = ('function' === typeof value)? value.call(object, self.getContext()) : value;
      object[propName] = ('undefined' !== typeof v)? v : object[propName];
    }
    return object;
  }
})

Transformation.addMethod('cloneProperty', function(propName, targetName) {
  return function(object) {
    if (!object[propName]) return object;
    object[targetName] = JSON.parse(JSON.stringify(object[propName]));
    return object;
  }
})

Transformation.addMethod('runCommand', function(command) {
  var self = this;
  return function(object) {
    command.call(object, self.getContext());
    return object;
  }
})

Transformation.addMethod('extractFromProperty', function(propName) {
  return function(object) {
    return object[propName];
  }
})

Transformation.addMethod('expandAsProperty', function(propName) {
  return function(object) {
    var o = {};
    o[propName] = object;
    return o;
  }
})

Transformation.addMethod('transformProperty', function(propName, transformation, newContext) {
  var self = this;
  var transformProperty = function(property) {
    context = (newContext)? newContext : self.getContext();
    return transformation.run(property, context);
  }
  return function(object) {
    if (!object[propName]) return object;
    else object[propName] = transformProperty(object[propName]);
    return object;
  }
});

Transformation.addMethod('transformCollection', function(propName, transformation, newContext) {
  var self = this;
  var transformProperty = function(property) {
    context = (newContext)? newContext : self.getContext();
    return transformation.runCollection(property, context);
  }
  return function(object) {
    if (!object[propName]) return object;
    else object[propName] = transformProperty(object[propName]);
    return object;
  }
});

Transformation.addMethod('recursiveTransform', function(propName) {
  var self = this;
  return function(object) {
    if (!object[propName]) return object;
    else object[propName] = self.run(object[propName], self.getContext());
    return object;
  }
})

Transformation.addMethod('recursiveTransformCollection', function(propName) {
  var self = this;
  return function(object) {
    if (!object[propName]) return object;
    else object[propName] = self.runCollection(object[propName], self.getContext());
    return object;
  }
})

Transformation.addMethod('groupProperties', function(properties, propName) {
  return function(object) {
    object[propName] = {};
    properties.forEach(function(fromName) {
      object[propName][fromName] = object[fromName];
      delete object[fromName];
    })
    return object;
  }
})

Transformation.addMethod('concat', function(transformation) {
  return function(object) {
    return transformation.run(object);
  }
})

Transformation.aliasMethod('assignProperty',   'setProperty');
Transformation.aliasMethod('assignProperties', 'setProperties');
module.exports = Transformation;
