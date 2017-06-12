// Support for listening to context state changes and intercepting state queries
//
// NOTE: this system does not handle buffer bindings
import GL from './constants';
import {glSetParameters, glCopyParameters, GL_PARAMETER_DEFAULTS} from './parameters';
import assert from 'assert';

// interceptors for WEBGL FUNCTIONS that query WebGLRenderingContext state

export const GL_STATE_GETTERS = {
  getParameter(get, pname) {
    // TODO - value should be cloned
    return get(pname);
  },
  isEnabled(get, pname) {
    // TODO - value should be cloned
    return get(pname);
  }
};

// interceptors for WEBGL FUNCTIONS that set WebGLRenderingContext state

export const GL_STATE_SETTERS = {

  // GENERIC SETTERS

  enable(setter, cap) {
    setter({[cap]: true});
  },
  disable(setter, cap) {
    setter({[cap]: false});
  },
  pixelStorei(setter, pname, param) {
    setter({[pname]: param});
  },
  hint(setter, pname, hint) {
    setter({[pname]: hint});
  },

  // SPECIFIC SETTERS

  clearStencil(setter, s) {
    setter({[GL.STENCIL_CLEAR_VALUE]: s});
  },

  blendColor(setter, r, g, b, a) {
    setter({[GL.BLEND_COLOR]: new Float32Array([r, g, b, a])});
  },

  blendEquation(setter, mode) {
    setter({
      [GL.BLEND_EQUATION_RGB]: mode,
      [GL.BLEND_EQUATION_ALPHA]: mode
    });
  },

  blendEquationSeparate(setter, modeRGB, modeAlpha) {
    setter({
      [GL.BLEND_EQUATION_RGB]: modeRGB,
      [GL.BLEND_EQUATION_ALPHA]: modeAlpha
    });
  },

  blendFunc(setter, src, dst) {
    setter({
      [GL.BLEND_SRC_RGB]: src,
      [GL.BLEND_DST_RGB]: dst,
      [GL.BLEND_SRC_ALPHA]: src,
      [GL.BLEND_DST_ALPHA]: dst
    });
  },

  blendFuncSeparate(setter, srcRGB, dstRGB, srcAlpha, dstAlpha) {
    setter({
      [GL.BLEND_SRC_RGB]: srcRGB,
      [GL.BLEND_DST_RGB]: dstRGB,
      [GL.BLEND_SRC_ALPHA]: srcAlpha,
      [GL.BLEND_DST_ALPHA]: dstAlpha
    });
  },

  clearColor(setter, r, g, b, a) {
    setter({[GL.COLOR_CLEAR_VALUE]: new Float32Array([r, g, b, a])});
  },

  colorMask(setter, r, g, b, a) {
    setter({[GL.COLOR_MASK]: [r, g, b, a]});
  },

  cullFace(setter, mode) {
    setter({[GL.CULL_FACE_MODE]: mode});
  },

  clearDepth(setter, depth) {
    setter({[GL.DEPTH_CLEAR_VALUE]: depth});
  },

  depthFunc(setter, func) {
    setter({[GL.DEPTH_FUNC]: func});
  },

  depthRange(setter, zNear, zFar) {
    setter({
      [GL.DEPTH_RANGE]: new Float32Array([zNear, zFar])
    });
  },

  depthMask(setter, mask) {
    setter({[GL.DEPTH_WRITEMASK]: mask});
  },

  frontFace(setter, face) {
    setter({[GL.FRONT_FACE]: face});
  },

  lineWidth(setter, width) {
    setter({[GL.LINE_WIDTH]: width});
  },

  polygonOffset(setter, factor, units) {
    setter({
      [GL.POLYGON_OFFSET_FACTOR]: factor,
      [GL.POLYGON_OFFSET_UNITS]: units
    });
  },

  sampleCoverage(setter, value, invert) {
    setter({
      [GL.SAMPLE_COVERAGE_VALUE]: value,
      [GL.SAMPLE_COVERAGE_INVERT]: invert
    });
  },

  scissor(setter, x, y, width, height) {
    setter({
      [GL.SCISSOR_BOX]: new Int32Array([x, y, width, height])
    });
  },

  stencilMask(setter, mask) {
    setter({
      [GL.STENCIL_WRITEMASK]: mask,
      [GL.STENCIL_BACK_WRITEMASK]: mask
    });
  },

  stencilMaskSeparate(setter, face, mask) {
    setter({
      [face === GL.FRONT ? GL.STENCIL_WRITEMASK : GL.STENCIL_BACK_WRITEMASK]: mask
    });
  },

  stencilFunc(setter, func, ref, mask) {
    setter({
      [GL.STENCIL_FUNC]: func,
      [GL.STENCIL_REF]: ref,
      [GL.STENCIL_VALUE_MASK]: mask,
      [GL.STENCIL_BACK_FUNC]: func,
      [GL.STENCIL_BACK_REF]: ref,
      [GL.STENCIL_BACK_VALUE_MASK]: mask
    });
  },

  stencilFuncSeparate(setter, face, func, ref, mask) {
    setter({
      [face === GL.FRONT ? GL.STENCIL_FUNC : GL.STENCIL_BACK_FUNC]: func,
      [face === GL.FRONT ? GL.STENCIL_REF : GL.STENCIL_BACK_REF]: ref,
      [face === GL.FRONT ? GL.STENCIL_VALUE_MASK : GL.STENCIL_BACK_VALUE_MASK]: mask
    });
  },

  stencilOp(setter, fail, zfail, zpass) {
    setter({
      [GL.STENCIL_FAIL]: fail,
      [GL.STENCIL_PASS_DEPTH_FAIL]: zfail,
      [GL.STENCIL_PASS_DEPTH_PASS]: zpass,
      [GL.STENCIL_BACK_FAIL]: fail,
      [GL.STENCIL_BACK_PASS_DEPTH_FAIL]: zfail,
      [GL.STENCIL_BACK_PASS_DEPTH_PASS]: zpass
    });
  },

  stencilOpSeparate(setter, face, fail, zfail, zpass) {
    setter({
      [face === GL.FRONT ? GL.STENCIL_FAIL : GL.STENCIL_BACK_FAIL]: fail,
      [face === GL.FRONT ? GL.STENCIL_PASS_DEPTH_FAIL : GL.STENCIL_BACK_PASS_DEPTH_FAIL]: zfail,
      [face === GL.FRONT ? GL.STENCIL_PASS_DEPTH_PASS : GL.STENCIL_BACK_PASS_DEPTH_PASS]: zpass
    });
  }
};

// HELPER FUNCTIONS - INSTALL GET/SET INTERCEPTORS (SPYS) ON THE CONTEXT

// Overrides a WebGLRenderingContext state "getter" function
//
function interceptGetter(gl, key, getter, readFromCache) {
  // Get the original function from the WebGLRenderingContext
  const originalFunc = gl[key].bind(gl);

  // Wrap it with a spy so that we can update our state cache when it gets called
  gl[key] = function(...params) {
    return gl.state.enable ?
      // Call the getter the params so that it can e.g. serve from a cache
      readFromCache(...params) :
      // Optionally call the original function to do a "hard" query from the WebGLRenderingContext
      originalFunc(...params);
  };

  // Set the name of this anonymous function to help in debugging and profiling
  Object.defineProperty(gl[key], 'name', {value: `${key}-spy`, configurable: true});
}

function interceptSetter(gl, key, setter, updateCache) {
  // Get the original function from the WebGLRenderingContext
  const originalFunc = gl[key].bind(gl);

  // Wrap it with a spy so that we can update our state cache when it gets called
  gl[key] = function(...params) {
    // Update the value
    // Call the setter with the state cache and the params so that it can store the settings
    setter(updateCache, ...params);

    // Call the original WebGLRenderingContext func to make sure the context actually gets updated
    originalFunc(...params);
  };

  // Set the name of this anonymous function to help in debugging and profiling
  Object.defineProperty(gl[key], 'name', {value: `${key}-spy`, configurable: true});
}

// HELPER CLASS - GLState

/* eslint-disable no-shadow */
class GLState {
  constructor(gl, {copyState = false, enable} = {}) {
    // Note: does not maintain a gl reference
    this.state = copyState ? glCopyParameters(gl) : Object.assign({}, GL_PARAMETER_DEFAULTS);
    this.stateStack = [];
    this.enable = enable !== undefined ? enable : true;

    this._interceptSetValues = this._interceptSetValues.bind(this);
    this._interceptGetValue = this._interceptGetValue.bind(this);
    Object.seal(this);
  }

  push(gl, values = {}) {
    this.stateStack.push({});
    this.setValues(values);
  }

  pop(gl) {
    assert(this.stateStack.length > 0);
    const oldValues = this.stateStack.pop();
    glSetParameters(gl, oldValues, this.state);
  }

  getParameter(gl, key) {
    // TODO - value should be cloned
    return this.state[key];
  }

  setParameters(gl, values) {
    glSetParameters(gl, values, this.state);
  }

  // interceptor for context get functions - just read value from our cache
  _interceptGetValue(key) {
    assert(key !== undefined);
    // TODO - value should be cloned
    return this.state[key];
  }

  // interceptor for context set functions - update our cache and our stack
  _interceptSetValues(values) {
    // If a state stack frame is active, save the changed settings
    if (this.stateStack.length > 0) {
      const oldValues = this.stateStack[this.stateStack.length - 1];
      for (const key in values) {
        assert(key !== undefined);
        // Check that value hasn't already been shadowed
        if (!(key in oldValues)) {
          // Save current value being shadowed
          oldValues[key] = this.state[key];
        }
      }
    }

    // Set the new values
    Object.assign(this.state, values);
  }
}

// PUBLIC API

/**
 * Initialize parameter caching on a context
 * can be called multiple times to update setters or enable/disable
 * @param {WebGLRenderingContext} - context
 */
// After calling this function, context state will be cached
// gl.state.push() and gl.state.pop() will be available for saving,
// temporarily modifying, and then restoring state.
export default function trackContextState(gl, {enable, copyState = true} = {}) {
  if (!gl.state) {
    // Create a state cache
    gl.state = new GLState(gl, {copyState, enable});

    // Note: if the original function fails to set the value, our state cache will be bad
    // No solution for this at the moment, but assuming that this is unlikely to be a real problem
    // We could call the setter after the originalFunc. Concern is that this would
    // cause different behavior in debug mode, where originalFunc can throw exceptions

    // intercept all setter functions in the table
    for (const key in GL_STATE_SETTERS) {
      const parameterDef = GL_STATE_SETTERS[key];
      interceptSetter(gl, key, parameterDef, gl.state._interceptSetValues);
    }

    // intercept all getter functions in the table
    for (const key in GL_STATE_GETTERS) {
      const parameterDef = GL_STATE_GETTERS[key];
      interceptGetter(gl, key, parameterDef, gl.state._interceptGetValue);
    }
  }

  return gl;
}
