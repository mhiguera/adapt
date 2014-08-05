Transformation = function() {
  this.stack = [];
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

Transformation.prototype.run = function(object, context) {
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

Transformation.addMethod('assignProperty', function(propName, value) {
  var self = this;
  return function(object) {
    var v = ('function' === typeof value)? value.call(object, self.getContext()) : value;
    object[propName] = ('undefined' !== typeof v)? v : object[propName];
    return object;
  }
})

Transformation.addMethod('assignProperties', function(properties) {
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
  return function(object) {
    command.call(object);
    return object;
  }
})

Transformation.addMethod('expandAsProperty', function(propName) {
  return function(object) {
    var o = {};
    o[propName] = object;
    return o;
  }
})

Transformation.addMethod('transformProperty', function(propName, transformation) {
  var self = this;
  var transformProperty = function(property) {
    return transformation.run(property, self.getContext());
  }
  return function(object) {
    if (!object[propName]) return object;
    else if (object[propName] instanceof Array) object[propName].map(transformProperty);
    else object[propName] = transformProperty(object[propName]);
    return object;
  }
});

module.exports = Transformation;
