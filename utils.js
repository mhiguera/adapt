module.exports = {
  clone: function(object) {
    return JSON.parse(JSON.stringify(object));
  }
}
