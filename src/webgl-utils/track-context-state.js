// Support for listening to context state changes and intercepting state queries
//
// NOTE: this system does not handle buffer bindings
import GL from './constants';
import {setParameters, getParameters, GL_PARAMETER_DEFAULTS} from './parameter-access';
import polyfillContext from './polyfill-context';
import assert from 'assert';

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
    setter({[GL.COLOR_WRITEMASK]: [r, g, b, a]});
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
  },

  viewport(setter, x, y, width, height) {
    setter({
      [GL.VIEWPORT]: new Int32Array([x, y, width, height])
    });
  }
};

// HELPER FUNCTIONS - INSTALL GET/SET INTERCEPTORS (SPYS) ON THE CONTEXT

// Overrides a WebGLRenderingContext state "getter" function
// to return values directly from cache
function installGetterOverride(gl, functionName) {
  // Get the original function from the WebGLRenderingContext
  const originalFunc = gl[functionName].bind(gl);

  // Wrap it with a spy so that we can update our state cache when it gets called
  gl[functionName] = function(...params) {
    const pname = params[0];

    // WebGL limits are not prepopulated in the cache, we must
    // query first time
    if (!(pname in gl.state.cache)) {
      gl.state.cache[pname] = originalFunc(...params);
    }

    // Optionally call the original function to do a "hard" query from the WebGLRenderingContext
    return gl.state.enable ?
      // Call the getter the params so that it can e.g. serve from a cache
      gl.state.cache[pname] :
      // Optionally call the original function to do a "hard" query from the WebGLRenderingContext
      originalFunc(...params);
  };

  // Set the name of this anonymous function to help in debugging and profiling
  Object.defineProperty(
    gl[functionName], 'name', {value: `${functionName}-from-cache`, configurable: false});
}

// Overrides a WebGLRenderingContext state "setter" function
// to call a setter spy before the actual setter. Allows us to keep a cache
// updated with a copy of the WebGL context state.
function installSetterSpy(gl, functionName, setter, updateCache) {
  // Get the original function from the WebGLRenderingContext
  const originalFunc = gl[functionName].bind(gl);

  // Wrap it with a spy so that we can update our state cache when it gets called
  gl[functionName] = function(...params) {
    // Update the value
    // Call the setter with the state cache and the params so that it can store the settings
    setter(updateCache, ...params);

    // Call the original WebGLRenderingContext func to make sure the context actually gets updated

    originalFunc(...params);
    // Note: if the original function fails to set the value, our state cache will be bad
    // No solution for this at the moment, but assuming that this is unlikely to be a real problem
    // We could call the setter after the originalFunc. Concern is that this would
    // cause different behavior in debug mode, where originalFunc can throw exceptions
  };

  // Set the name of this anonymous function to help in debugging and profiling
  Object.defineProperty(
    gl[functionName], 'name', {value: `${functionName}-to-cache`, configurable: false});
}

// HELPER CLASS - GLState

/* eslint-disable no-shadow */
class GLState {
  constructor(gl, {copyState = false} = {}) {
    this.gl = gl;
    this.cache = copyState ? getParameters(gl) : Object.assign({}, GL_PARAMETER_DEFAULTS);
    this.stateStack = [];
    this.enable = true;

    this._updateCache = this._updateCache.bind(this);
    Object.seal(this);
  }

  push(values = {}) {
    this.stateStack.push({});
  }

  pop() {
    assert(this.stateStack.length > 0);
    const oldValues = this.stateStack.pop();
    setParameters(this.gl, oldValues, this.cache);
  }

  // interceptor for context set functions - update our cache and our stack
  _updateCache(values) {
    // If a state stack frame is active, save the changed settings
    if (this.stateStack.length > 0) {
      const oldValues = this.stateStack[this.stateStack.length - 1];
      for (const key in values) {
        assert(key !== undefined);
        // Check that value hasn't already been shadowed
        if (!(key in oldValues)) {
          // Save current value being shadowed
          oldValues[key] = this.cache[key];
        }
      }
    }

    // Set the new values
    Object.assign(this.cache, values);
  }
}

// PUBLIC API

/**
 * Initialize WebGL state caching on a context
 * can be called multiple times to enable/disable
 * @param {WebGLRenderingContext} - context
 */
// After calling this function, context state will be cached
// gl.state.push() and gl.state.pop() will be available for saving,
// temporarily modifying, and then restoring state.
export default function trackContextState(gl, {enable = true, copyState} = {}) {
  assert(copyState !== undefined);
  if (!gl.state) {
    polyfillContext(gl);

    // Create a state cache
    gl.state = new GLState(gl, {copyState, enable});

    // intercept all setter functions in the table
    for (const key in GL_STATE_SETTERS) {
      const setter = GL_STATE_SETTERS[key];
      installSetterSpy(gl, key, setter, gl.state._updateCache);
    }

    // intercept all getter functions in the table
    installGetterOverride(gl, 'getParameter');
    installGetterOverride(gl, 'isEnabled');
  }

  gl.state.enable = enable;

  return gl;
}

export function pushContextState(gl) {
  assert(gl.state);
  gl.state.push();
}

export function popContextState(gl) {
  assert(gl.state);
  gl.state.pop();
}
