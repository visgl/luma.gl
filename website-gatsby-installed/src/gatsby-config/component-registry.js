const assert = require('assert');

const registry = {};

module.exports.registerReactComponent = function registerReactComponent(name, component) {
  assert(component, name);
  registry[name] = component;
}

module.exports.getReactComponent = function getReactComponent(name) {
  const component = registry[name];
  assert(component, name);
  return component;
}
