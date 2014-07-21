Transformation = function(loopback) {
  this.nextLink = null;
  this.context = null;
}

Transformation.extend = function(methodName, fn) {
  Transformation.prototype[methodName] = function() {
    var args = [].slice.call(arguments);
    var extension = function() { return fn.apply(this, args) }
    extension.prototype = fn.prototype;
    var chained = this.chain(new extension);
    chained.loopback = this;
    return chained;
  }
  fn.prototype = new Transformation();
  fn.prototype.__super = Transformation.prototype;
}

Transformation.prototype.transform = function(object) {
  return object;
}

Transformation.prototype.run = function(object, context) {
  var head = this.getStart();
  if (object instanceof Array) return object.map(this.run.bind(this));
  if (context) { head.setContext(context) }
  do {
    object = head.transform(object);
    head = head.nextLink;
  } while (head);
  return object;
}

Transformation.prototype.getStart = function() {
  var start = this;
  while (start.loopback) { start = start.loopback }
  return start;
}

Transformation.prototype.runLoopback = function(object) {
  if (this.loopback) return this.loopback.run(object);
  else return object;
}

Transformation.prototype.runNext = function(object) {
  if (this.nextLink) return this.nextLink.run(object);
  else return object;
}

Transformation.prototype.setContext = function(context) {
  this.context = context;
  return this;
}

Transformation.prototype.unsetContext = function() {
  this.ommitContext = true;
  return this;
}

Transformation.prototype.getContext = function() {
  if (this.ommitContext)  return null;
  else if (this.context)  return this.context;
  else if (this.loopback) return this.loopback.getContext();
  else return null;
}

Transformation.prototype.chain = function(transformation) {
  if (this.nextLink) this.nextLink.chain(transformation);
  else this.nextLink = transformation;
  return this.nextLink;
}

RemovePropertyTransformation = function(propertyName) {
  this.property = propertyName;
}

Transformation.extend('removeProperty', RemovePropertyTransformation);
RemovePropertyTransformation.prototype.transform = function(object) {
  delete object[this.property];
  return object;
}

CastPropertyTransformation = function(propertyName, castType) {
  this.property = propertyName;
  this.castType = castType;
}

Transformation.extend('castProperty', CastPropertyTransformation);
CastPropertyTransformation.prototype.transform = function(object) {
  object[this.property] = this.castType(object[this.property]);
  return object;
}

RenamePropertyTransformation = function(propertyName, newPropertyName) {
  this.property = propertyName;
  this.newProperty = newPropertyName;
}

Transformation.extend('renameProperty', RenamePropertyTransformation);
RenamePropertyTransformation.prototype.transform = function(object) {
  object[this.newPropertyName] = object[this.property];
  delete object[this.property];
  return object;
}

AssignPropertyTransformation = function(propertyName, value) {
  this.property = propertyName;
  this.value    = value;
}

Transformation.extend('assignProperty', AssignPropertyTransformation);
AssignPropertyTransformation.prototype.transform = function(object) {
  var v = ('function' === typeof this.value)? this.value.call(object, this.getContext()) : this.value;
  object[this.property] = v;
  return object;
}

CommandTransformation = function(command) {
  this.command  = command;
}

Transformation.extend('runCommand', CommandTransformation);
CommandTransformation.prototype.transform = function(object) {
  this.command.call(object);
  return object;
}

ExpandAsPropertyTransformation = function(property) {
  this.property  = property;
}

Transformation.extend('expandAsProperty', ExpandAsPropertyTransformation);
ExpandAsPropertyTransformation.prototype.transform = function(object) {
  var o = {};
  o[this.property] = object;
  return o;
}

NestedTransformation = function(propertyName, transformation) {
  this.property = propertyName;
  this.transformation = transformation;
}

Transformation.extend('transformProperty', NestedTransformation);
NestedTransformation.prototype.transform = function(object) {
  var self = this;
  var property = object[this.property];
  if (property) object[this.property] = this.transformation.run(property);
  return object;
}

module.exports = Transformation;
