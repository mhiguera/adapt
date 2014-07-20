var Transformation = require('./transformation');
module.exports = {
  createTransformation: function() {
    return new Transformation();
  },

  transform: function(object, transformation) {
    return transformation.run(object);
  }
}
