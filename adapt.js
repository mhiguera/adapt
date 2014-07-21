var Transformation = require('./transformation');
module.exports = {
  createTransformation: function() {
    return new Transformation();
  },

  transform: function(object, transformation, context) {
    return transformation.run(object, context);
  }
}
