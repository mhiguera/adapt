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
  var object;
  if (source instanceof Array) {
    object = [];
    for (var i=0; i < source.length; i++) object[i] = source[i];
  }else if ('object' === typeof source) {
    object = {};
    for (var i in source) object[i] = source[i];
  }
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
    var v = value;
    if (value instanceof Transformation)  v = value.run(object, self.getContext());
    else if ('function' === typeof value) v = value.call(object, self.getContext());
    object[propName] = ('undefined' !== typeof v)? v : object[propName];
    return object;
  }
})

Transformation.addMethod('setProperties', function(properties) {
  var self = this;
  return function(object) {
    for (var propName in properties) {
      var value = properties[propName];
      var v = value;
      if (value instanceof Transformation)  v = value.run(object, self.getContext());
      else if ('function' === typeof value) v = value.call(object, self.getContext());
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
  var transformProperty = function(object, propName) {
    var context;
    var property = object[propName];
    if (newContext && newContext instanceof Function) context = newContext.call(object, self.getContext())
    else if (newContext) context = newContext;
    else context = self.getContext();
    return transformation.run(property, context);
  }
  return function(object) {
    if (!object[propName]) return object;
    var transformed = transformProperty(object, propName);
    object[propName] = transformed;
    return object;
  }
});

Transformation.addMethod('transformCollection', function(propName, transformation, newContext) {
  var self = this;
  var transformProperty = function(object, propName) {
    var context;
    var property = object[propName];
    if (newContext && newContext instanceof Function) context = newContext.call(object, self.getContext())
    else if (newContext) context = newContext;
    else context = self.getContext();
    return transformation.runCollection(property, context);
  }
  return function(object) {
    if (!object[propName]) return object;
    var transformed = transformProperty(object, propName);
    object[propName] = transformed;
    return object;
  }
});

Transformation.addMethod('recursiveTransform', function(propName) {
  var self = this;
  return function(object) {
    if (!object[propName]) return object;
    var transformed = self.run(object[propName], self.getContext());
    object[propName] = transformed;
    return object;
  }
})

Transformation.addMethod('recursiveTransformCollection', function(propName) {
  var self = this;
  return function(object) {
    if (!object[propName]) return object;
    var transformed = self.runCollection(object[propName], self.getContext());
    object[propName] = transformed;
    return object;
  }
})

Transformation.addMethod('groupProperties', function(properties, propName) {
  return function(object) {
    var found = false;
    var o = {};
    properties.forEach(function(fromName) {
      if (!object[fromName]) return;
      found = true;
      o[fromName] = object[fromName];
      delete object[fromName];
    })
    if (found) object[propName] = o;
    return object;
  }
})

Transformation.addMethod('mergeCollections', function(properties, propName) {
  return function(object) {
    var arr = [];
    properties.forEach(function(fromName) {
      if (!object[fromName]) return;
      if (object[fromName] instanceof Array) {
        arr = arr.concat(object[fromName]);
        delete object[fromName];
      }
    })
    if (arr.length) object[propName] = arr;
    return object;
  }
})

Transformation.addMethod('removePropertyIf', function(propName, value) {
  return function(object) {
    if (value instanceof Function && value.call(object)) delete object[propName];
    else if (object[propName] == value) delete object[propName];
    return object;
  }
})

Transformation.addMethod('concat', function(transformation, context) {
  var self = this;
  return function(object) {
    return transformation.run(object, context || self.getContext());
  }
})

Transformation.addMethod('checkDependencies', function(properties, message) {
  return function(object) {
    for (var i=0; i < properties.length; i++) {
      var propName = properties[i];
      if ('undefined' === typeof object[propName]) {
        message = message || require('util').format('Precondition failed: %s should exist', propName);
        throw new Error(message);
      }
    }
    return object;
  }
})
Transformation.aliasMethod('assignProperty',   'setProperty');
Transformation.aliasMethod('assignProperties', 'setProperties');
module.exports = Transformation;
