// Provides a unified API for getting and setting any WebGL parameter
// Also knows default values of all parameters, enabling fast cache initialization
// Provides base functionality for the state caching.
import {
  GL_PARAMETER_DEFAULTS,
  GL_PARAMETER_SETTERS,
  GL_COMPOSITE_PARAMETER_SETTERS,
  GL_PARAMETER_GETTERS
} from './webgl-parameter-tables';

import {pushContextState, popContextState} from './track-context-state';
import {isObjectEmpty, isWebGL, assert} from '../utils';

// Sets any GL parameter regardless of function (gl.blendMode, ...)
// Note: requires a `cache` object to be set on the context (gl.state.cache)
// This object is used to fill in any missing values for composite setter functions
export function setParameters(gl, values) {
  assert(isWebGL(gl), 'setParameters requires a WebGL context');

  if (isObjectEmpty(values)) {
    return;
  }

  const compositeSetters = {};

  // HANDLE PRIMITIVE SETTERS (and make note of any composite setters)

  for (const key in values) {
    const glConstant = Number(key);
    const setter = GL_PARAMETER_SETTERS[key];
    if (setter) {
      // Composite setters should only be called once, so save them
      if (typeof setter === 'string') {
        compositeSetters[setter] = true;
      } else {
        // if (gl[glConstant] !== undefined) {
        // TODO - added above check since this is being called on WebGL2 values in WebGL1...
        // TODO - deep equal on values? only call setter if value has changed?
        // NOTE - the setter will automatically update this.state
        setter(gl, values[key], glConstant);
      }
    }
  }

  // HANDLE COMPOSITE SETTERS

  // NOTE: any non-provided values needed by composite setters are filled in from state cache
  // The cache parameter is automatically retrieved from the context
  // This depends on `trackContextState`, which is technically a "circular" dependency.
  // But it is too inconvenient to always require a cache parameter here.
  // This is the ONLY external dependency in this module/
  const cache = gl.state && gl.state.cache;
  if (cache) {
    for (const key in compositeSetters) {
      // TODO - avoid calling composite setters if values have not changed.
      const compositeSetter = GL_COMPOSITE_PARAMETER_SETTERS[key];
      // Note - if `trackContextState` has been called,
      // the setter will automatically update this.state.cache
      compositeSetter(gl, values, cache);
    }
  }

  // Add a log for the else case?
}

// Copies the state from a context (gl.getParameter should not be overriden)
// Reads the entire WebGL state from a context
// Caveat: This generates a huge amount of synchronous driver roundtrips and should be
// considered a very slow operation, to be used only if/when a context already manipulated
// by external code needs to be synchronized for the first time
// @return {Object} - a newly created map, with values keyed by GL parameters
export function getParameters(gl, parameters) {
  // default to querying all parameters
  parameters = parameters || GL_PARAMETER_DEFAULTS;
  // support both arrays of parameters and objects (keys represent parameters)

  if (typeof parameters === 'number') {
    // single GL enum
    const key = parameters;
    const getter = GL_PARAMETER_GETTERS[key];
    return getter ? getter(gl, key) : gl.getParameter(key);
  }

  const parameterKeys = Array.isArray(parameters) ? parameters : Object.keys(parameters);

  const state = {};
  for (const key of parameterKeys) {
    const getter = GL_PARAMETER_GETTERS[key];
    state[key] = getter ? getter(gl, Number(key)) : gl.getParameter(Number(key));
  }
  return state;
}

// Reset all parameters to a (almost) pure context state
// NOTE: viewport and scissor will be set to the values in GL_PARAMETER_DEFAULTS,
//   NOT the canvas size dimensions, so they will have to be properly set after
//   calling this function.
export function resetParameters(gl) {
  setParameters(gl, GL_PARAMETER_DEFAULTS);
}

// Stores current "global" WebGL context settings, changes selected parameters,
// executes function, restores parameters
export function withParameters(gl, parameters, func) {
  if (isObjectEmpty(parameters)) {
    // Avoid setting state if no parameters provided. Just call and return
    return func(gl);
  }

  const {nocatch = true} = parameters;

  pushContextState(gl);
  setParameters(gl, parameters);

  // Setup is done, call the function
  let value;

  if (nocatch) {
    // Avoid try catch to minimize stack size impact for safe execution paths
    value = func(gl);
    popContextState(gl);
  } else {
    // Wrap in a try-catch to ensure that parameters are restored on exceptions
    try {
      value = func(gl);
    } finally {
      popContextState(gl);
    }
  }

  return value;
}
