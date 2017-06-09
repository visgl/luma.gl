/* eslint-disable no-inline-comments, max-len */
import assert from 'assert';

// WebGL specification 'types'
import GL_PARAMETERS from './api/parameters';

// HELPERS

// Helper to get shared context data
function getContextData(gl) {
  gl.luma = gl.luma || {};
  return gl.luma;
}

// Helper to get the real webgl context (from a debug context)
function getRealContext(gl) {
  return gl.realContext ? gl.realContext : null;
}

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
  const adjustedValue = normalizeValue;

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

/*
 * Executes a function with gl states temporarily set
 * Exception safe
 */
export function withState(gl, params, func) {
  // assertWebGLContext(gl);
  const state = getState(gl);

  // TODO (@ibgreen): Make GL state manager tracking framebuffer state and
  // Combine withParameters and withState functions

  // const {frameBuffer} = params;
  // if (frameBuffer) {
  //   frameBuffer.bind();
  // }

  state.pushValues(gl, params);
  let value;
  try {
    value = func(gl);
  } finally {
    state.popValues(gl);
  // if (params.frameBuffer) {
  //   // TODO - was there any previously set frame buffer?
  //   // TODO - delegate "unbind" to Framebuffer object?
  //   gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // }
  }

  return value;
}

// Resets gl state to default values.
export function resetParameters(gl) {
  for (const parameterKey in GL_PARAMETERS) {
    setParameter(gl, parameterKey, GL_PARAMETERS[parameterKey].value);
  }
}

function getFuncFromWebGLParameter(glParameter) {
  return glParameter;
}

export function trackState(gl) {
  gl = getRealContext(gl);

  // Intercept any setters and getters not in the table
  const enable = gl.prototype.enable.bind(gl);
  gl.prototype.enable = function enable_(glParameter) {
    const state = getState(this);
    const func = getFuncFromWebGLParameter(glParameter);
    if (state.setValue(func)) {
      enable(glParameter);
    }
  };

  const disable = gl.prototype.disable.bind(gl);
  gl.prototype.disable = function disable_(glParameter) {
    const state = getState(this);
    const func = getFuncFromWebGLParameter(glParameter);
    if (state.setValue(func, false)) {
      disable(glParameter);
    }
  };

  const pixelStorei = gl.prototype.pixelStorei.bind(gl);
  gl.prototype.pixelStorei = function pixelStorei_(glParameter, value) {
    const state = getState(this);
    if (state.setValue(glParameter, value)) {
      pixelStorei(glParameter, value);
    }
  };

  // const getParameter_ = gl.prototype.getParameter.bind(gl);
  gl.prototype.getParameter = function getParameter_(glParameter) {
    const state = getState(this);
    return state.getParameter(glParameter);
  };

  gl.prototype.isEnabled = function isEnabled(glParameter) {
    const state = getState(this);
    const func = getFuncFromWebGLParameter(glParameter);
    return state.getValue(func);
  };

  // intercept all setter functions in the table
  // for (const key in GL_PARAMETERS) {
  //   const parameterDef = GL_PARAMETERS[key];
  //   const originalFunc = gl.prototype[key].bind(gl);
  //   gl.prototype[key] = function() {
  //   };
  // }
}

// VERY LIMITED / BASIC GL STATE MANAGEMENT

// Executes a function with gl states temporarily set, exception safe
// Currently support pixelStorage, scissor test and framebuffer binding
export function withParameters(gl, {pixelStore, scissorTest, framebuffer, nocatch = true}, func) {
  // assertWebGLContext(gl);

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

  function finalize() {
    if (!scissorTestWasEnabled) {
      gl.disable(gl.SCISSOR_TEST);
    }
    if (framebuffer) {
      // TODO - was there any previously set frame buffer?
      // TODO - delegate "unbind" to Framebuffer object?
      framebuffer.unbind();
    }
  }

  let value;

// Comment out the nocatch path as withState does not support
// nocatch
// if (nocatch) {
//   value = func(gl);
// } else {

  try {
    value = withState(gl, pixelStore, func);
  } finally {
    finalize();
  }
// }

  return value;
}

// DEPRECATED

export function glContextWithState(...args) {
  return withParameters(...args);
}

