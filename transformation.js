var inspect = require('util').inspect;
var format = require('util').format;
var utils = require('./utils');
var Transformation = function() {
  this.stack = [];
}

function getDeprecationLine() {
  var stack = new Error().stack;
  var line = stack.split('\n')[3];
  var regex = /(\(([\w.+\s_\-\/]+):(\d+):(\d+)\)$)/;
  var info = line.match(regex);
  var path = require('path').relative('.', info[2]);
  return format('Line #%d at %s', info[3], path);
}

Transformation.aliasMethod = function(methodName, aliasedMethod) {
  Transformation.prototype[methodName] = function() {
    var line = getDeprecationLine();
    console.warn('ADAPT DEPRECATION WARNING: %s has been renamed to %s (%s)', methodName, aliasedMethod, line);
    return Transformation.prototype[aliasedMethod].apply(this, arguments);
  }
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

Transformation.prototype.executeCollection  = function(object, context) {
  var self = this;
  return object.map(function(o) { return self.execute(o, context) });
}

Transformation.prototype.execute = function(source, context) {
  source = utils.shallowCopy(source);
  if (this.loopback) source = this.loopback.execute(source, context);
  if (context) this.context = context;
  this.stack.forEach(function(t) { source = t(source) });
  return source;
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

Transformation.addMethod('remove', function(propName, deep) {
  var removeByPattern = function(object) {
    for (var key in object) {
      if (key.match(propName)) {
        delete object[key];
        continue;
      } else if (!deep) continue;
      var type = typeof(object[key]);
      if (type == 'string' || type == 'number' || this[key] instanceof Array) continue;
      object[key] = removeByPattern.call(object[key], object[key], true);
    }
    return object;
  }
  
  return function(object) {
    if (propName instanceof Array) propName.forEach(function(p) { delete object[p] });
    else if (propName instanceof RegExp) removeByPattern(object);
    else delete object[propName];
    return object;
  }
})

Transformation.addMethod('filter', function(arr) {
  return function(object) {
    for (var prop in object) {
      if (!~arr.indexOf(prop)) delete object[prop];
    }
    return object;
  }
})

Transformation.addMethod('cast', function(propName, cast) {
  return function(object) {
    object[propName] = cast(object[propName]);
    return object;
  }
})

Transformation.addMethod('rename', function(oldPropName, newPropName) {
  return function(object) {
    object[newPropName] = object[oldPropName];
    delete object[oldPropName];
    return object;
  }
})

Transformation.addMethod('set', function(propName, value) {
  var self = this;
  return function(object) {
    var v = value;
    if (value instanceof Transformation)  v = value.execute(object, self.getContext());
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
      if (value instanceof Transformation)  v = value.execute(object, self.getContext());
      else if ('function' === typeof value) v = value.call(object, self.getContext());
      object[propName] = ('undefined' !== typeof v)? v : object[propName];
    }
    return object;
  }
})

Transformation.addMethod('clone', function(propName, targetName) {
  return function(object) {
    if (!object[propName]) return object;
    object[targetName] = utils.clone(object[propName]);
    return object;
  }
})

Transformation.addMethod('run', function(command) {
  var self = this;
  return function(object) {
    command.call(object, self.getContext());
    return object;
  }
})

Transformation.addMethod('extract', function(propName) {
  return function(object) {
    return object[propName];
  }
})

Transformation.addMethod('expand', function(propName) {
  return function(object) {
    var o = {};
    o[propName] = object;
    return o;
  }
})

Transformation.addMethod('transform', function(propName, transformation, newContext) {
  var self = this;
  var transformProperty = function(object, propName) {
    var context;
    var property = object[propName];
    if (newContext && newContext instanceof Function) context = newContext.call(object, self.getContext())
    else if (newContext) context = newContext;
    else context = self.getContext();
    return transformation.execute(property, context);
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
    return transformation.executeCollection(property, context);
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
    var transformed = self.execute(object[propName], self.getContext());
    object[propName] = transformed;
    return object;
  }
})

Transformation.addMethod('recursiveTransformCollection', function(propName) {
  var self = this;
  return function(object) {
    if (!object[propName]) return object;
    var transformed = self.executeCollection(object[propName], self.getContext());
    object[propName] = transformed;
    return object;
  }
})

Transformation.addMethod('group', function(properties, propName) {
  return function(object) {
    var found = false;
    var o = {};
    properties.forEach(function(fromName) {
      o[fromName] = object[fromName];
      delete object[fromName];
    })
    object[propName] = o;
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

Transformation.addMethod('removeIf', function(propName, value) {
  return function(object) {
    if (value instanceof Function && value.call(object)) delete object[propName];
    else if (object[propName] == value) delete object[propName];
    return object;
  }
})

Transformation.addMethod('concat', function(transformation, context) {
  var self = this;
  return function(object) {
    return transformation.execute(object, context || self.getContext());
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

Transformation.addMethod('expandDots', function(regex) {
  return function(object) {
    var pattern = regex || /(^[a-zA-Z\-\_\.\[\]\'\"\d]*$)/;
    var keys = Object.keys(object).filter(function(k) {
      if (!k.match(pattern)) return false;
      return !!~k.indexOf('.');
    });
    keys.forEach(function(k) {
      var value = object[k];
      var levels = k.split('.');
      var currLevel, scope = object;
      while (levels.length) {
        currLevel = levels.shift();
        var leaf = (levels.length == 0);
        if (!leaf) {
          scope[currLevel] = scope[currLevel] || {};
          scope = scope[currLevel];
        } else scope[currLevel] = scope[currLevel] || value;
      }
      delete object[k];
    })
    return object;
  }
});

Transformation.addMethod('removeNils', function(deep) {
  var fn = function(object) {
    for (var i in object) {
      if (object[i] === null) {
        delete object[i];
        continue;
      } else if (!deep) continue;
      var type = typeof(object[i]);
      if (type == 'string' || type == 'number' || this[i] instanceof Array) continue;
      object[i] = fn.call(object[i], object[i], true);
    }
    return object;
  }
  return fn;
})

Transformation.addMethod('removeEmptyStrings', function(deep) {
  var fn = function(object) {
    for (var i in object) {
      if ('string' === typeof(object[i]) && object[i] === '') {
        delete object[i];
        continue;
      } else if (!deep) continue;
      var type = typeof(object[i]);
      if (type == 'string' || type == 'number' || this[i] instanceof Array) continue;
      object[i] = fn.call(object[i], object[i], true);
    }
    return object;
  }
  return fn;
})

Transformation.addMethod('removeEmptyArrays', function(deep) {
  var fn = function(object) {
    for (var i in object) {
      if ('object' === typeof(object[i]) && 
          object[i] instanceof Array && 
          object[i].length === 0) {
        delete object[i];
        continue;
      } else if (!deep) continue;
      var type = typeof(object[i]);
      if (type == 'string' || type == 'number' || this[i] instanceof Array) continue;
      object[i] = fn.call(object[i], object[i], true);
    }
    return object;
  }
  return fn;
})

Transformation.addMethod('camelToSnake', function(deep) {
  var fn = function(object) {
    var toBeRemoved = [];
    for (var key in object) {
      if (key.match(/[A-Z]/)) {
        var firstLetter = key.charAt(0);
        var rest = key.substr(1, key.length);
        var toBe = firstLetter.toLowerCase() + rest.replace(/[A-Z]/g, function(match) { return '_' + match.toLowerCase() });
        object[toBe] = object[key];
        toBeRemoved.push(key);
      }
      if (!deep) continue;
      var type = typeof(object[key]);
      if (type == 'string' || type == 'number') continue;
      object[key] = fn.call(object[key], object[key], true);
    }
    toBeRemoved.forEach(function(key) { delete object[key] });
    return object;
  }
  return fn;
})

Transformation.addMethod('inspect', function(handler) {
  return function(object) {
    handler = handler || console.log;
    handler(inspect(object, { depth: null, colors: true }));
    return object;
  }
})

Transformation.aliasMethod('setProperty',         'set');
Transformation.aliasMethod('renameProperty',      'rename');
Transformation.aliasMethod('cloneProperty',       'clone');
Transformation.aliasMethod('expandAsProperty',    'expand');
Transformation.aliasMethod('extractFromProperty', 'extract');
Transformation.aliasMethod('castProperty',        'cast');
Transformation.aliasMethod('transformProperty',   'transform');
Transformation.aliasMethod('filterProperties',    'filter');
Transformation.aliasMethod('groupProperties',     'group');
Transformation.aliasMethod('runCommand',          'run');
Transformation.aliasMethod('removeProperty',      'remove');
Transformation.aliasMethod('removePropertyIf',    'removeIf');
Transformation.aliasMethod('removeByPattern',     'remove');


Transformation.aliasMethod('assignProperty',      'set');
Transformation.aliasMethod('assignProperties',    'setProperties');



module.exports = Transformation;
