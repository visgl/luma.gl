// From https://github.com/jayphelps/core-decorators.js, MIT license
function isDescriptor(descriptor) {
  if (!descriptor || !descriptor.hasOwnProperty) {
    return false;
  }

  const keys = ['value', 'initializer', 'get', 'set'];

  for (let i = 0, l = keys.length; i < l; i++) {
    if (descriptor.hasOwnProperty(keys[i])) {
      return true;
    }
  }

  return false;
}

// From https://github.com/jayphelps/core-decorators.js, MIT license
function decorate(entryArgs, handleDescriptor) {
  if (isDescriptor(entryArgs[entryArgs.length - 1])) {
    return handleDescriptor(...entryArgs, []);
  }
  return function _decorate() {
    return handleDescriptor(...arguments, entryArgs);
  };
}

export function unary(...args) {
  return decorate(args,
    (target, methodKey, descriptor, []) => {
      const Class = target.constructor;
      Class[methodKey] = (a) => new Class().set(a)[methodKey]();

      return {
        ...descriptor,
        value: function unaryWrapper() {
          return descriptor.value.apply(this, arguments);
        }
      };
    });
}

export function binary(...args) {
  return decorate(args,
    (target, methodKey, descriptor, []) => {
      const Class = target.constructor;
      Class[methodKey] = (a, b) => new Class().set(a)[methodKey](b);

      return {
        ...descriptor,
        value: function binaryWrapper() {
          return descriptor.value.apply(this, arguments);
        }
      };
    });
}

export function spread(...args) {
  return decorate(args,
    (target, methodKey, descriptor, []) => {
      const Class = target.constructor;
      Class[methodKey] = (a, ...rest) => rest.reduce(
        (acc, elt) => acc[methodKey](elt),
        new Class().set(a)
      );

      return {
        ...descriptor,
        value: function spreadWrapper() {
          return descriptor.value.apply(this, arguments);
        }
      };
    });
}
