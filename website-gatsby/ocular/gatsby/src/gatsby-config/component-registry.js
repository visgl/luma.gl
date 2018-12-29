import assert from 'assert';

const registry = {};

export function registerReactComponent(name, component) {
  assert(component, name);
  registry[name] = component;
}

export function getReactComponent(name) {
  const component = registry[name];
  assert(component, name);
  return component;
}
