const _ = require('lodash');

export const attachExtendMethod = obj => {
  /*
    Given an object, attaches an extend method to that object.

    Example usage:

    var baseClass = {
      someMethod: function() {
        ...
      }
    }

    attachExtendMethod(baseClass);

    var newClass = baseClass.extend({
      someMethod: function() {
        this.__super__.someMethod();
        ...
      }
    })

    TODO - Mutating the original prototype is not ideal.
  */
  const origProto = Object.getPrototypeOf
    ? Object.getPrototypeOf(obj)
    : obj.prototype || obj.__proto__;
  const origProtoCopy = _.extend({}, origProto);
  obj.extend = function (extra) {
    _.extend(origProto, extra);
    return obj;
  };
  obj.__super__ = origProtoCopy;
  return obj;
};

function getMethods(obj) {
  let methods = Object.getOwnPropertyNames(obj);
  if (obj.__proto__) methods = methods.concat(Object.getOwnPropertyNames(obj.__proto__));
  methods = methods.filter(k => obj[k] && Boolean(obj[k].bind));
  return methods;
}

export const autoBindMixin = {
  componentWillMount() {
    const methodNames = getMethods(this);
    methodNames.forEach(name => {
      this[name] = this[name].bind(this);
    });
  }
};
