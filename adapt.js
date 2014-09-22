var Transformation = require('./transformation');
module.exports = {
  tap: {
    value: function(propName) {
      return function() {
        var evil = !propName.match(/(^[a-zA-Z\-\_\.\[\]\'\"\d]*$)/);
        return (evil)? undefined : eval('this.' + propName);
      }
    },

    equals: function(prop1, prop2) {
      return function () {
        return this[prop1] == this[prop2];
      }
    },

    notEquals: function(prop1, prop2) {
      return function () {
        return this[prop1] != this[prop2];
      }
    },

    existance: function(prop) {
      return function () {
        return 'undefined' !== this[prop];
      }
    },

    lengthOf: function(propName) {
      return function () {
        return this[propName].length;
      }
    },

    numberize: function(propName) {
      var regex = /([0-9.]*)/;
      return function () {
        var match = regex.exec(this[propName]);
        if (match) return Number(match[0]);
        else return null;
      }
    }
  },

  createTransformation: function() {
    return new Transformation();
  },

  transform: function(object, transformation, context) {
    return transformation.run(object, context);
  }
}
