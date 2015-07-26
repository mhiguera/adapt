module.exports = {
  extendCircular: function(target, source, visited, data) {
    visited = visited || [];
    data    = data || [];
    var self = this;
    if (!source || 'object' !== typeof source) return source;
    if (source instanceof Date) return new Date(source.getTime());
    if (source instanceof RegExp) return new RegExp(source);
    if (source instanceof Array) {
      return source.map(function(element) {
        return self.extendCircular({}, element, visited, data);
      })
    }

    var index = visited.indexOf(source);
    if (!!~index) return data[index].$ref;
   
    var target = source.constructor? new source.constructor() : {};
    var idx = visited.push(source);
    data[idx] = { $ref: target };
    for (key in source) {
      var value = source[key];
      target[key] = self.extendCircular({}, value, visited, data);
    }
    return target;
  },

  extend: function(target, source) {
    var self = this;
    if (!source || 'object' !== typeof source) return source;
    if (source instanceof Date) return new Date(source.getTime());
    if (source instanceof RegExp) return new RegExp(source);
    if (source instanceof Array) {
      return source.map(function(element) {
        return self.extend({}, element);
      })
    }
    var target = source.constructor? new source.constructor() : {};
    for (key in source) {
      var value = source[key];
      target[key] = self.extend({}, value);
    }
    return target;
  },
  
  shallowCopy: function(source, deep) {
    if (source instanceof Array) {
      var copy = [];
      for (var i=0; i < source.length; i++) {
        copy[i] = (deep)? this.shallowCopy(source[i], deep) : source[i];
      }
      return copy;
    }else if (source instanceof Object) {
      var copy = {};
      for (var key in source) {
        copy[key] = (deep)? this.shallowCopy(source[key], deep) : source[key];
      }
      return copy;
    }else return source;
  },

  cloneCircular: function(source) {
    return this.extendCircular({}, source);
  },

  clone: function(source) {
    return this.extend({}, source);
  },

  cloneJSON: function(json) {
    return JSON.parse(JSON.stringify(json));
  }
}
