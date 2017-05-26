/* eslint-disable camelcase, brace-style */
import assert from 'assert';

const OES_vertex_array_object = 'OES_vertex_array_object';
const ANGLE_instanced_arrays = 'ANGLE_instanced_arrays';
const WEBGL_draw_buffers = 'WEBGL_draw_buffers';
const EXT_disjoint_timer_query = 'EXT_disjoint_timer_query';
const EXT_disjoint_timer_query_webgl2 = 'EXT_disjoint_timer_query_webgl2';

const ERR_NOT_SUPPORTED = 'VertexArrayObject requires WebGL2 or OES_vertex_array_object extension';

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

const getVertexAttrib = (location, pname) => {
  const gl = this; // eslint-disable-line
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
  return result;
};

const EXTENSION_DEFAULTS = {
  [OES_vertex_array_object]: {
    meta: {suffix: 'OES'},
    // NEW METHODS
    createVertexArray: () => { assert(false, ERR_NOT_SUPPORTED); },
    deleteVertexArray: () => {},
    bindVertexArray: () => {},
    isVertexArray: () => false,
    // REDEFINED METHODS
    getVertexAttrib
  },
  [ANGLE_instanced_arrays]: {
    meta: {
      suffix: 'ANGLE',
      constants: {
        VERTEX_ATTRIB_ARRAY_DIVISOR: 'VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE'
      }
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
      suffix: 'WEBGL',
      constants: [
        // The fragment shader is not written to any color buffer.
        'NONE',
        // Fragment shader is written to the back color buffer.
        'BACK',
        // Fragment shader is written to the nth color attachment of the framebuffer.
        'COLOR_ATTACHMENT0',
        'COLOR_ATTACHMENT1',
        'COLOR_ATTACHMENT2',
        'COLOR_ATTACHMENT3',
        'COLOR_ATTACHMENT4',
        'COLOR_ATTACHMENT5',
        'COLOR_ATTACHMENT6',
        'COLOR_ATTACHMENT7',
        'COLOR_ATTACHMENT8',
        'COLOR_ATTACHMENT9',
        'COLOR_ATTACHMENT10',
        'COLOR_ATTACHMENT11',
        'COLOR_ATTACHMENT12',
        'COLOR_ATTACHMENT13',
        'COLOR_ATTACHMENT14',
        'COLOR_ATTACHMENT15'
      ]
    },
    drawBuffers: () => { assert(false); }
  },
  [EXT_disjoint_timer_query]: {
    meta: {suffix: 'EXT'},
    createQuery: () => { assert(false); },
    beginQuery: () => {},
    endQuery: () => {},
    getQuery: (a, b) => { return 0; }
    // queryCounter(this.handle, GL.TIMESTAMP_EXT);
    // getQueryParameter:
  },
  [EXT_disjoint_timer_query_webgl2]: {
    meta: {suffix: 'EXT'}
  }
};

// Polyfills a single extension into the `target` object
function polyfillExtension(gl, {extension, target}) {
  const defaults = EXTENSION_DEFAULTS[extension];
  assert(defaults);

  const {meta = {}} = defaults;
  const {suffix = ''} = meta;

  const ext = gl.getExtension(extension);

  Object.keys(defaults).forEach(key => {
    const extKey = `${key}${suffix}`;

    if (key === 'meta') {
      // ignore
    } else if (typeof gl[key] === 'function') {
      // pick WebGL2 implementation, if available
      target[key] = gl[key].bind(gl);
    } else if (ext && typeof ext[extKey] === 'function') {
      // pick extension implemenentation,if available
      target[key] = ext[extKey].bind(ext);
    } else {
      // pick the mock implementation, if no implementation was detected
      target[key] = defaults[key].bind(gl);
    }
  });
}

// Registers polyfill or mock functions for all known extensions
export function polyfillExtensions(gl) {
  gl.luma = gl.luma || {};
  if (!gl.luma.polyfilled) {
    for (const extension in EXTENSION_DEFAULTS) {
      polyfillExtension(gl, {extension, target: gl.luma});
    }
    gl.luma.polyfilled = true;
  }
  return gl.luma;
}
