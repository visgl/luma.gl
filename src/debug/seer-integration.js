import seer from 'seer';

const models = {};

/**
 * Add a model to our cache indexed by id
 */
export const addModel = model => {
  if (models[model.id]) {
    return;
  }
  models[model.id] = model;
};

/**
 * Remove a previously set model from the cache
 */
export const removeModel = id => {
  delete models[id];
};

/**
 * Recursively traverse an object given a path of properties and set the given value
 */
const recursiveSet = (obj, path, value) => {
  if (path.length > 1) {
    recursiveSet(obj[path[0]], path.slice(1), value);
  } else {
    obj[path[0]] = value;
  }
};

/**
 * Listen for luma.gl edit events
 */
seer.listenFor('luma.gl', payload => {
  const model = models[payload.itemKey];
  if (!model || payload.type !== 'edit') {
    return;
  }

  const uniforms = model.getUniforms();
  recursiveSet(uniforms, payload.valuePath, payload.value);
  model.setUniforms(uniforms);
});
