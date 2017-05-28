// WebGL1/WebGL2 extension polyfill support
//
// Provides a function that creates polyfills for WebGL2 functions based
// on available extensions and installs them on a supplied target (could be
// the WebGLContext or its prototype, or a separate object).
//
// This is intended to be a stand-alone file with minimal dependencies,
// easy to reuse or repurpose in other projects.

/* eslint-disable camelcase, brace-style */
import assert from 'assert';

const OES_vertex_array_object = 'OES_vertex_array_object';
const ANGLE_instanced_arrays = 'ANGLE_instanced_arrays';
const WEBGL_draw_buffers = 'WEBGL_draw_buffers';
const EXT_disjoint_timer_query = 'EXT_disjoint_timer_query';
const EXT_disjoint_timer_query_webgl2 = 'EXT_disjoint_timer_query_webgl2';
const EXT_texture_filter_anisotropic = 'EXT_texture_filter_anisotropic';

const ERR_VAO_NOT_SUPPORTED =
  'VertexArray requires WebGL2 or OES_vertex_array_object extension';

// Return true if WebGL2 context
function isWebGL2(gl) {
  const GL_TEXTURE_BINDING_3D = 0x806A;
  return gl && gl.TEXTURE_BINDING_3D === GL_TEXTURE_BINDING_3D;
}

// Return object with webgl2 flag and an extension
function getExtensionData(gl, extension) {
  return {
    webgl2: isWebGL2(gl),
    ext: gl.getExtension(extension)
  };
}

const WEBGL_CONTEXT_POLYFILLS = {
  // POLYFILL TABLE
  [OES_vertex_array_object]: {
    meta: {suffix: 'OES'},
    // NEW METHODS
    createVertexArray: () => { assert(false, ERR_VAO_NOT_SUPPORTED); },
    deleteVertexArray: () => {},
    bindVertexArray: () => {},
    isVertexArray: () => false
  },
  [ANGLE_instanced_arrays]: {
    meta: {
      suffix: 'ANGLE'
      // constants: {
      //   VERTEX_ATTRIB_ARRAY_DIVISOR: 'VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE'
      // }
    },
    vertexAttribDivisor(location, divisor) {
      // Accept divisor 0 even if instancing is not supported (0 = no instancing)
      assert(divisor === 0, 'WebGL instanced rendering not supported');
    },
    drawElementsInstanced: () => {},
    drawArraysInstanced: () => {}
  },
  [WEBGL_draw_buffers]: {
    meta: {
      suffix: 'WEBGL'
      // constants: [
      //   // The fragment shader is not written to any color buffer.
      //   'NONE',
      //   // Fragment shader is written to the back color buffer.
      //   'BACK',
      //   // Fragment shader is written to the nth color attachment of the framebuffer.
      //   'COLOR_ATTACHMENT0',
      //   'COLOR_ATTACHMENT1',
      //   'COLOR_ATTACHMENT2',
      //   'COLOR_ATTACHMENT3',
      //   'COLOR_ATTACHMENT4',
      //   'COLOR_ATTACHMENT5',
      //   'COLOR_ATTACHMENT6',
      //   'COLOR_ATTACHMENT7',
      //   'COLOR_ATTACHMENT8',
      //   'COLOR_ATTACHMENT9',
      //   'COLOR_ATTACHMENT10',
      //   'COLOR_ATTACHMENT11',
      //   'COLOR_ATTACHMENT12',
      //   'COLOR_ATTACHMENT13',
      //   'COLOR_ATTACHMENT14',
      //   'COLOR_ATTACHMENT15'
      // ]
    },
    drawBuffers: () => { assert(false); }
  },
  [EXT_disjoint_timer_query]: {
    meta: {suffix: 'EXT'},
    // WebGL1: Polyfills the WebGL2 Query API
    createQuery: () => { assert(false); },
    deleteQuery: () => { assert(false); },
    beginQuery: () => { assert(false); },
    endQuery: () => {},
    getQuery(handle, pname) { return this.getQueryObject(handle, pname); },
    // The WebGL1 extension uses getQueryObject rather then getQueryParameter
    getQueryParameter(handle, pname) { return this.getQueryObject(handle, pname); },
    // plus the additional `queryCounter` method
    queryCounter: () => {},
    getQueryObject: () => {}
  },
  // WebGL2: Adds `queryCounter` to the query API
  [EXT_disjoint_timer_query_webgl2]: {
    meta: {suffix: 'EXT'},
    // install `queryCounter`
    // `null` avoids overwriting WebGL1 `queryCounter` if the WebGL2 extension is not available
    queryCounter: null
  },
  OVERRIDES: {
    // Override for getVertexAttrib that returns sane values for non-WebGL1 constants
    getVertexAttrib: (gl, originalFunc, location, pname) => {
      // const gl = this; // eslint-disable-line
      const {webgl2, ext} = getExtensionData(gl, ANGLE_instanced_arrays);

      const GL_VERTEX_ATTRIB_ARRAY_INTEGER = 0x88FD;
      const GL_VERTEX_ATTRIB_ARRAY_DIVISOR = 0x88FE;

      let result;
      switch (pname) {
      // WebGL1 attributes will never be integer
      case GL_VERTEX_ATTRIB_ARRAY_INTEGER: result = !webgl2 ? false : undefined; break;
        // if instancing is not available, return 0 meaning divisor has not been set
      case GL_VERTEX_ATTRIB_ARRAY_DIVISOR: result = !webgl2 && !ext ? 0 : undefined; break;
      default:
      }

      return result !== undefined ? result : originalFunc(location, pname);
    },
    // Handle transform feedback and uniform block queries in WebGL1
    getProgramParameter: (gl, originalFunc, program, pname) => {
      const GL_TRANSFORM_FEEDBACK_BUFFER_MODE = 0x8C7F;
      const GL_TRANSFORM_FEEDBACK_VARYINGS = 0x8C83;
      const GL_ACTIVE_UNIFORM_BLOCKS = 0x8A36;
      const GL_SEPARATE_ATTRIBS = 0x8C8D;

      if (!isWebGL2(gl)) {
        switch (pname) {
        case GL_TRANSFORM_FEEDBACK_BUFFER_MODE: return GL_SEPARATE_ATTRIBS;
        case GL_TRANSFORM_FEEDBACK_VARYINGS: return 0;
        case GL_ACTIVE_UNIFORM_BLOCKS: return 0;
        default:
        }
      }
      return originalFunc(program, pname);
    },
    getInternalformatParameter: (gl, originalFunc, target, format, pname) => {
      const GL_SAMPLES = 0x80A9;
      if (!isWebGL2(gl)) {
        switch (pname) {
        case GL_SAMPLES:
          return new Int32Array([0]);
        default:
        }
      }
      return gl.getInternalformatParameter(target, format, pname);
    },
    getTexParameter(gl, originalFunc, target, pname) {
      const GL_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FE;
      switch (pname) {
      case GL_TEXTURE_MAX_ANISOTROPY_EXT:
        const {extensions} = gl.luma;
        const ext = extensions[EXT_texture_filter_anisotropic];
        pname = (ext && ext.TEXTURE_MAX_ANISOTROPY_EXT) || GL_TEXTURE_MAX_ANISOTROPY_EXT;
        break;
      default:
      }
      return originalFunc(target, pname);
    },
    getParameter(gl, originalFunc, pname) {
      const GL_FRAGMENT_SHADER_DERIVATIVE_HINT = 0x8B8B;
      const GL_DONT_CARE = 0x1100;
      const GL_GPU_DISJOINT_EXT = 0x8FBB;
      const GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FF;

      const {extensions} = gl.luma;

      function override() {
        switch (pname) {
        case GL_FRAGMENT_SHADER_DERIVATIVE_HINT:
          return !isWebGL2(gl) ? GL_DONT_CARE : undefined;

        case GL_GPU_DISJOINT_EXT:
          const hasTimerQueries =
            !extensions[EXT_disjoint_timer_query] && !extensions[EXT_disjoint_timer_query_webgl2];
          return hasTimerQueries ? 0 : undefined;

        case GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT:
          const ext = gl.luma.extensions[EXT_texture_filter_anisotropic];
          pname = ext && ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT;
          return !pname ? 1.0 : undefined;

        default:
          return undefined;
        }
      }

      const result = override(pname);
      return result !== undefined ? result : originalFunc(pname);
    }
  }
};

function getExtensions(gl) {
  gl.luma.extensions = {};
  const EXTENSIONS = [EXT_texture_filter_anisotropic];
  for (const extension of EXTENSIONS) {
    gl.luma[extension] = gl.getExtension(extension);
  }
}

// Polyfills a single WebGL extension into the `target` object
function polyfillExtension(gl, {extension, target, target2}) {
  const defaults = WEBGL_CONTEXT_POLYFILLS[extension];
  assert(defaults);

  const {meta = {}} = defaults;
  const {suffix = ''} = meta;

  const ext = gl.getExtension(extension);

  Object.keys(defaults).forEach(key => {
    const extKey = `${key}${suffix}`;

    let polyfill = null;
    if (key === 'meta') {
      // ignore
    } else if (typeof gl[key] === 'function') {
      // WebGL2 implementation is already
    } else if (ext && typeof ext[extKey] === 'function') {
      // pick extension implemenentation,if available
      polyfill = (...args) => ext[extKey](...args);
    } else if (typeof defaults[key] === 'function') {
      // pick the mock implementation, if no implementation was detected
      polyfill = defaults[key].bind(target);
    }

    if (polyfill) {
      target[key] = polyfill;
      target2[key] = polyfill;
    }
  });
}

// Install simple overrides (mostly get* functions)
function installOverrides(gl, {target, target2}) {
  const {OVERRIDES} = WEBGL_CONTEXT_POLYFILLS;
  Object.keys(OVERRIDES).forEach(key => {
    if (typeof OVERRIDES[key] === 'function') {
      // install an override, if no implementation was detected
      const originalFunc = gl[key] ? gl[key].bind(gl) : () => {};
      const polyfill = OVERRIDES[key].bind(null, gl, originalFunc);
      target[key] = polyfill;
      target2[key] = polyfill;
    }
  });
}

// Registers polyfill or mock functions for all known extensions
export function polyfillWebGLContext(gl) {
  gl.luma = gl.luma || {};
  getExtensions(gl);
  if (!gl.luma.polyfilled) {
    for (const extension in WEBGL_CONTEXT_POLYFILLS) {
      if (extension !== 'overrides') {
        polyfillExtension(gl, {extension, target: gl.luma, target2: gl});
      }
    }
    installOverrides(gl, {target: gl.luma, target2: gl});
    gl.luma.polyfilled = true;
  }
  return gl;
}
