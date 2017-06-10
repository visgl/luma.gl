// Support for tracking context state
//
// If the setter fails, our state cache will be bad
// NOTE: this system does not handle buffer bindings

import GL from './constants';
import assert from 'assert';

// interceptors for WEBGL FUNCTIONS that query WebGLRenderingContext state
// return cached state, avoiding expensive queries

export const GL_STATE_GETTERS = {
  getParameter(glState, pname) {
    return glState.get(pname);
  },
  isEnabled(glState, pname) {
    return glState.get(pname);
  }
};

// interceptors for WEBGL FUNCTIONS that set WebGLRenderingContext state
// updates cached state, later avoiding expensive queries

export const GL_STATE_SETTERS = {

  // GENERIC SETTERS

  enable(glState, cap) {
    glState.set(cap, true);
  },
  disable(glState, cap) {
    glState.set(cap, false);
  },
  pixelStorei(glState, pname, param) {
    glState.set(pname, param);
  },

  // SPECIFIC SETTERS

  //
  // Sets index used when stencil buffer is cleared.
  clearStencil: GL.STENCIL_CLEAR_VALUE,

  blendColor(glState, r, g, b, a) {
    glState.set({[GL.BLEND_COLOR]: new Float32Array([r, g, b, a])});
  },

  blendEquation(glState, mode) {
    glState.set({
      [GL.BLEND_EQUATION_RGB]: mode,
      [GL.BLEND_EQUATION_ALPHA]: mode
    });
  },

  blendEquationSeparate(glState, modeRGB, modeAlpha) {
    glState.set({
      [GL.BLEND_EQUATION_RGB]: modeRGB,
      [GL.BLEND_EQUATION_ALPHA]: modeAlpha
    });
  },

  blendFunc(glState, src, dst) {
    glState.set({
      [GL.BLEND_SRC_RGB]: src,
      [GL.BLEND_DST_RGB]: dst,
      [GL.BLEND_SRC_ALPHA]: src,
      [GL.BLEND_DST_ALPHA]: dst
    });
  },

  blendFuncSeparate(glState, srcRGB, dstRGB, srcAlpha, dstAlpha) {
    glState.set({
      [GL.BLEND_SRC_RGB]: srcRGB,
      [GL.BLEND_DST_RGB]: dstRGB,
      [GL.BLEND_SRC_ALPHA]: srcAlpha,
      [GL.BLEND_DST_ALPHA]: dstAlpha
    });
  },

  clearColor(glState, r, g, b, a) {
    glState.set({[GL.CLEAR_COLOR]: new Float32Array([r, g, b, a])});
  },

  colorMask(glState, r, g, b, a) {
    glState.set({[GL.COLOR_MASK]: [r, g, b, a]});
  },

  cullFace: GL.CULL_FACE_MODE,

  clearDepth: {
    params: GL.DEPTH_CLEAR_VALUE,
    value: 1
  },

  depthFunc: {
    params: GL.DEPTH_FUNC,
    value: GL.LESS
  },

  depthRange: {
    params: GL.DEPTH_RANGE,
    value: new Float32Array([0, 1]), // TBD
    setter: (gl, value) => gl.depthRange(...value),
    intercept(glState, zNear, zFar) {
      glState.set([GL.DEPTH_RANGE], new Float32Array([zNear, zFar]));
    }
  },

  depthMask: {
    params: GL.DEPTH_WRITEMASK,
    value: true
  },

  fragmentShaderDerivativeHint: {
    params: GL.FRAGMENT_SHADER_DERIVATIVE_HINT,
    value: GL.DONT_CARE,
    setter: (gl, value) => gl.hint(GL.FRAGMENT_SHADER_DERIVATIVE_HINT, value),
    gl1: 'OES_standard_derivatives'
  },

  frontFace: {
    params: GL.FRONT_FACE,
    value: GL.CCW
  },

  // Hint for quality of images generated with glGenerateMipmap
  hint: {
    params: GL.GENERATE_MIPMAP_HINT,
    value: GL.DONT_CARE,
    setter: (gl, value) => gl.hint(GL.GENERATE_MIPMAP_HINT, value),
    intercept(glState, parameter, value) {
      glState.set(parameter, value);
    }
  },

  lineWidth: {
    params: GL.LINE_WIDTH,
    value: 1
  },

  // Add small offset to fragment depth values (by factor × DZ + r × units)
  // Useful for rendering hidden-line images, for applying decals to surfaces,
  // and for rendering solids with highlighted edges.
  // https://www.khronos.org/opengles/sdk/docs/man/xhtml/glPolygonOffset.xml
  polygonOffset: {
    params: [GL.POLYGON_OFFSET_FACTOR, GL.POLYGON_OFFSET_UNITS],
    value: [0, 0],
    setter: (gl, value) => gl.polygonOffset(...value)
  },

  // TODO - enabling multisampling
  // glIsEnabled with argument GL_SAMPLE_ALPHA_TO_COVERAGE
  // glIsEnabled with argument GL_SAMPLE_COVERAGE

  // specify multisample coverage parameters
  // https://www.khronos.org/opengles/sdk/docs/man/xhtml/glSampleCoverage.xml
  sampleCoverage: {
    params: [GL.SAMPLE_COVERAGE_VALUE, GL.SAMPLE_COVERAGE_INVERT],
    value: [1.0, false],
    setter: (gl, value) => gl.sampleCoverage(...value)
  },

  scissor: {
    params: GL.SCISSOR_BOX,
    // When scissor test enabled we expect users to set correct scissor box,
    // otherwise we default to following value array.
    value: new Int32Array([0, 0, 1024, 1024]),
    intercept(glState, x, y, width, height) {
      glState.set(GL.SCISSOR_BOX, new Int32Array([x, y, width, height]));
    }
  },

  stencilMask(glState, mask) {
    glState.set({
      [GL.STENCIL_WRITEMASK]: mask,
      [GL.STENCIL_BACK_WRITEMASK]: mask
    });
  },

  stencilMaskSeparate(glState, face, mask) {
    glState.set({
      [face === GL.FRONT ? GL.STENCIL_WRITEMASK : GL.STENCIL_BACK_WRITEMASK]: mask
    });
  },

  stencilFunc(glState, func, ref, mask) {
    glState.set({
      [GL.STENCIL_FUNC]: func,
      [GL.STENCIL_REF]: ref,
      [GL.STENCIL_VALUE_MASK]: mask,
      [GL.STENCIL_BACK_FUNC]: func,
      [GL.STENCIL_BACK_REF]: ref,
      [GL.STENCIL_BACK_VALUE_MASK]: mask
    });
  },

  stencilFuncSeparate(glState, face, func, ref, mask) {
    glState.set({
      [face === GL.FRONT ? GL.STENCIL_FUNC : GL.STENCIL_BACK_FUNC]: func,
      [face === GL.FRONT ? GL.STENCIL_REF : GL.STENCIL_BACK_REF]: ref,
      [face === GL.FRONT ? GL.STENCIL_VALUE_MASK : GL.STENCIL_BACK_VALUE_MASK]: mask
    });
  },

  stencilOp(glState, fail, zfail, zpass) {
    glState.set({
      [GL.STENCIL_FAIL]: fail,
      [GL.STENCIL_PASS_DEPTH_FAIL]: zfail,
      [GL.STENCIL_PASS_DEPTH_PASS]: zpass,
      [GL.STENCIL_BACK_FAIL]: fail,
      [GL.STENCIL_BACK_PASS_DEPTH_FAIL]: zfail,
      [GL.STENCIL_BACK_PASS_DEPTH_PASS]: zpass
    });
  },

  stencilOpSeparate(glState, face, fail, zfail, zpass) {
    glState.set({
      [face === GL.FRONT ? GL.STENCIL_FAIL : GL.STENCIL_BACK_FAIL]: fail,
      [face === GL.FRONT ? GL.STENCIL_PASS_DEPTH_FAIL : GL.STENCIL_BACK_PASS_DEPTH_FAIL]: zfail,
      [face === GL.FRONT ? GL.STENCIL_PASS_DEPTH_PASS : GL.STENCIL_BACK_PASS_DEPTH_PASS]: zpass
    });
  }
};

// HELPER CLASS - GLState

class GLState {
  // Note: does not maintain a gl reference
  constructor(gl, {copyState = false} = {}) {
    this.state = copyState ? getWebGLState(gl) : getInitialWebGLState();
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

  // setValue(gl, key, value) {
  //   const actualValue = setParameter(gl, key, value);
  //   this.state[key] = actualValue;
  // }
}

// HELPER FUNCTIONS - GENERAL

// Helper to get shared context data
function getState(gl, {copyState = false} = {}) {
  // Add this under luma object
  gl.luma = gl.luma || {};
  gl.luma.spy = gl.luma.spy || {};
  const data = gl.luma.spy;
  data.state = data.state || new GLState(gl, {copyState});
  return data.state;
}

// HELPER FUNCTIONS - GETT A COMPLETE "SNAPSHOT" OF CONTEXT STATE

// Reads the entire WebGL state from a context
// Caveat: This generates a huge amount of synchronous driver roundtrips and should be
// considered a very slow operation, to be used only if/when a context already manipulated
// by external code needs to be synchronized for the first time
// @return {Object} - a newly created map, with values keyed by GL parameters
function getWebGLState(gl) {
  const state = {};
  for (const setterKey in GL_STATE_SETTERS) {
    const {params} = GL_STATE_SETTERS[setterKey];
    for (let i = 0; i < params.length; i++) {
      // call the unmodified get parameter
      // const param = params[i];
      // state[param] = this.originalGetParameter(param);
    }
  }
  return state;
}

// Gets the initial state of a WebGL context (as defined by the WebGL/OpenGL standards)
// For a fresh context this is much faster than querying all values.
// @return {Object} - a newly created map, with values keyed by GL parameters
function getInitialWebGLState() {
  const state = {};
  for (const setterKey in GL_STATE_SETTERS) {
    const {params, values} = GL_STATE_SETTERS[setterKey];
    for (let i = 0; i < params.length; i++) {
      // look up the default value in our metadata table
      const param = params[i];
      const value = values[i];
      state[param] = value;
    }
  }
  return state;
}

// HELPER FUNCTIONS - INSTALL GET/SET INTERCEPTORS (SPYS) ON THE CONTEXT

// Overrides a WebGLRenderingContext state "getter" function
//
function interceptGetter(gl, key, getter) {
  // Get the original function from the WebGLRenderingContext
  const originalFunc = gl.prototype[key].bind(gl);

  // Wrap it with a spy so that we can update our state cache when it gets called
  gl.prototype[key] = function(...params) {
    // Set the name of this anonymous function to help in debugging and profiling
    Object.defineProperty(this, 'name', {value: `${key}-spy`, configurable: true});

    // Find the state cache for this WebGL context
    const glState = getState(gl);

    return glState.disableCache ?
      // Optionally call the original function to do a "hard" query from the WebGLRenderingContext
      originalFunc(...params) :
      // Call the getter with the state cache and the params so that it can serve from the cache
      getter(glState, ...params);
  };
}

function interceptSetter(gl, key, setter) {
  // Get the original function from the WebGLRenderingContext
  const originalFunc = gl.prototype[key].bind(gl);

  // Wrap it with a spy so that we can update our state cache when it gets called
  gl.prototype[key] = function(...params) {
    // Set the name of this anonymous function to help in debugging and profiling
    Object.defineProperty(this, 'name', {value: `${key}-spy`, configurable: true});

    // Find the state cache for this WebGL context
    const glState = getState(gl);

    // First check if the value has actually changed
    const valueChanged = true;
    if (!glState.disableCache) {
      // TODO - not yet implemented
      // Make an empty state
      // Call the state updater on it
      // Iterate over generated settings and deep equal them with our state
    }

    // Update the value
    if (valueChanged) {
      // First call the setter with the state cache and the params so that it can store the settings
      setter(glState, ...params);

      // Now call the original WebGLRenderingContext func (which will actually )
      // Note: if the original function fails to set the value, our state cache will be bad
      // No solution for this at the moment, but assuming that this is unlikely to be a real problem
      originalFunc(...params);

      // We could call the setter after the originalFunc. Concern is that this would
      // cause different behavior in debug mode, where originalFunc can throw exceptions
    }
  };
}

// PUBLIC API

/**
 * Initialize parameter caching on a context
 * can be called multiple times
 * @param {WebGLRenderingContext} - context
 */
export default function trackContext(gl) {
  // Create a state cache
  // TODO

  // intercept all setter functions in the table
  for (const key in GL_STATE_SETTERS) {
    const parameterDef = GL_STATE_SETTERS[key];
    interceptSetter(gl, key, parameterDef);
  }

  // intercept all getter functions in the table
  for (const key in GL_STATE_GETTERS) {
    const parameterDef = GL_STATE_GETTERS[key];
    interceptGetter(gl, key, parameterDef);
  }
}
