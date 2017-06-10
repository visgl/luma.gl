/* eslint-disable no-inline-comments, max-len */
import assert from 'assert';
import {log} from '../utils';

// WebGL specification 'types'
import GL_PARAMETERS from './api/parameters';

// HELPERS

// Helper to get shared context data
function getContextData(gl) {
  gl.luma = gl.luma || {};
  return gl.luma;
}

// Helper to get the real webgl context (from a debug context)
// function getRealContext(gl) {
//   return gl.realContext ? gl.realContext : null;
// }

function isArray(array) {
  return Array.isArray(array) || ArrayBuffer.isView(array);
}

// GLState

class GLState {
  // Note: does not maintain a gl reference
  constructor(gl, {copyState = false} = {}) {
    this.state = copyState ? this._copyWebGLState(gl) : this._initializeState();
    this.stateStack = [];
  }

  pushValues(gl, values) {
    const oldValues = {};
    for (const key in values) {
      // Get current value being shadowed
      oldValues[key] = this.state[key];
      // Set the new value
      this.setValue(gl, key, values[key]);
    }
    this.stateStack.push({oldValues});
  }

  popValues(gl) {
    assert(this.stateStack.length > 0);
    const {oldValues} = this.stateStack.pop();
    for (const key in oldValues) {
      // Set the old value
      this.setValue(gl, key, oldValues[key]);
    }
  }

  getValue(gl, key) {
    return this.state[key];
  }

  setValue(gl, key, value) {
    const actualValue = setParameter(gl, key, value);
    this.state[key] = actualValue;
  }

  // Reads the entire WebGL state from a context.
  // Caveat: This generates a huge amount of driver roundtrips and should be
  // considered a very slow operation, to be done only if/when a context created
  // by an external library is being passed to luma.gl for the first time
  _copyWebGLState(gl) {
    const state = {};
    for (const parameterKey in GL_PARAMETERS) {
      state[parameterKey] = getParameter(gl, parameterKey);
    }
    return state;
  }

  // Copies  WebGL state to an object.
  // This generates a huge amount of asynchronous requests and should be
  // considered a very slow operation, to be done once at program startup.
  _initializeState() {
    const state = {};
    for (const parameterKey in GL_PARAMETERS) {
      state[parameterKey] = GL_PARAMETERS[parameterKey].value;
    }
    return state;
  }
}

function getState(gl, {copyState = false} = {}) {
  const data = getContextData(gl);
  data.state = data.state || new GLState(gl, {copyState});
  return data.state;
}

// GETTERS AND SETTERS

export function getParameterDefaultValue(gl, key) {
  // Get the parameter definition for the key
  const parameterDefinition = GL_PARAMETERS[key];
  assert(parameterDefinition, key);

  // Return the default value
  return parameterDefinition.value;
}

// Get the parameter value(s) from the context
// Might return an array of multiple values.
// The return value will be acceptable input to setParameter
export function getParameter(gl, key) {
  // Get the parameter definition for the key
  const parameterDefinition = GL_PARAMETERS[key];
  assert(parameterDefinition, key);

  // Get the parameters represented by the key
  const {params} = parameterDefinition;
  return isArray(params) ?
    params.map(param => gl.getParameter(param)) :
    gl.getParameter(params);
}

// Set the parameter value(s) by key to the context
// Sets value with key to context.
// Value may be "normalized" (in case a short form is supported). In that case
// the normalized value is retured.
export function setParameter(gl, key, valueOrValues) {
  // Get the parameter definition for the key
  const parameterDefinition = GL_PARAMETERS[key];
  assert(parameterDefinition, key);

  // Call the normalization function (in case the parameter accepts short forms)
  const {normalizeValue = x => x} = parameterDefinition;
  const adjustedValue = normalizeValue(valueOrValues);

  // Call the setter
  parameterDefinition.setter(gl, adjustedValue);
  return adjustedValue;
}

export function getParameters(gl, parameters, {keys} = {}) {
  const values = {};

  // Query all parameters if no list provided
  const parameterKeys = parameters || Object.keys(GL_PARAMETERS);

  for (const pname of parameterKeys) {
    const key = pname;
    // const key = keys ? glKey(pname) : pname;
    const isEnum = false; // parameter.type === 'GLenum'
    values[key] = getParameter(gl, pname);
    if (keys && isEnum) {
      // values[key] = glKey(values[key]);
    }
  }

  return values;
}

// Resets gl state to default values.
export function resetParameters(gl) {
  for (const parameterKey in GL_PARAMETERS) {
    setParameter(gl, parameterKey, GL_PARAMETERS[parameterKey].value);
  }
}

// VERY LIMITED / BASIC GL STATE MANAGEMENT
// Executes a function with gl states temporarily set, exception safe
// Currently support pixelStorage, scissor test and framebuffer binding
export function withParameters(gl, params, func) {
  // assertWebGLContext(gl);

  const {scissorTest, framebuffer, nocatch = true} = params;

  let scissorTestWasEnabled;
  if (scissorTest) {
    scissorTestWasEnabled = gl.isEnabled(gl.SCISSOR_TEST);
    const {x, y, w, h} = scissorTest;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, w, h);
  }

  if (framebuffer) {
    // TODO - was there any previously set frame buffer we need to remember?
    framebuffer.bind();
  }

  const state = getState(gl);

  // Define a helper function that will reset state after the function call
  function resetStateAfterCall() {
    state.popValues(gl);
    if (!scissorTestWasEnabled) {
      gl.disable(gl.SCISSOR_TEST);
    }
    if (framebuffer) {
      // TODO - was there any previously set frame buffer?
      // TODO - delegate "unbind" to Framebuffer object?
      framebuffer.unbind();
    }
  }

  state.pushValues(gl, params);

  // Setup is done, call the function
  let value;

  if (nocatch) {
    // Avoid try catch to minimize debugging impact for safe execution paths
    value = func(gl);
    resetStateAfterCall();
  } else {
    // Wrap in a try-catch to ensure that parameters are restored on exceptions
    try {
      value = func(gl);
    } finally {
      resetStateAfterCall();
    }
  }
  return value;
}

// DEPRECATED

export function withState(...args) {
  log.once(0, '"withState" deprecated in luma.gl v4, please use "withParameters" instead');
  return withParameters(...args);
}

export function glContextWithState(...args) {
  log.once(0, '"glContextWithState" deprecated in luma.gl v4, please use "withParameters" instead');
  return withParameters(...args);
}
