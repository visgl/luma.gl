/* eslint-disable no-inline-comments, max-len */
import GL from './gl-constants';
import assert from 'assert';

// WebGL specification 'types'
const GLenum = 'GLenum';
const GLfloat = 'GLfloat';
const GLint = 'GLint';
const GLuint = 'GLint';
const GLboolean = 'GLboolean';

/*
State management
- camelCased versions of the GL constants
- except when setter function exist that are named differently
- When gl api offers <setter> and <setter>Separate, the parameter is named
  after the setter but
*/

// Map of composite parameters
const GL_STATE = {
  blend: {
    type: GLboolean,
    value: false,
    params: GL.BLEND,
    setter: (gl, value) => gl.enable(GL.BLEND, value)
  },

  blendColor: {
    type: new Float32Array(4),
    value: new Float32Array([0, 0, 0, 0]),
    params: GL.BLEND_COLOR,
    setter: (gl, value) => gl.blendColor(value)
  },

  blendEquation: {
    type: [GLenum, GLenum],
    value: [GL.FUNC_ADD, GL.FUNC_ADD],
    params: [GL.BLEND_EQUATION_RGB, GL.BLEND_EQUATION_ALPHA],
    object: ['rgb', 'alpha'],
    setter: (gl, value) => gl.blendEquationSeparate(...value),
    normalizeArgs:
      args => isArray(args) ? args : [args, args]
  },

  // blend func
  blendFunc: {
    type: [GLenum, GLenum, GLenum, GLenum],
    value: [GL.ONE, GL.ZERO, GL.ONE, GL.ZERO],
    params: [
      GL.BLEND_SRC_RGB, GL.BLEND_SRC_ALPHA, GL.BLEND_DST_RGB, GL.BLEND_DST_ALPHA
    ],
    object: ['srcRgb', 'srcAlpha', 'dstRgb', 'dstAlpha'],
    setter: (gl, value) => gl.blendFuncSeparate(...value),
    normalizeArgs:
      args => isArray(args) && args.length === 3 ? [...args, ...args] : args
  },

  clearColor: {
    type: new Float32Array(4),
    value: new Float32Array([0, 0, 0, 0]), // TBD
    params: GL.COLOR_CLEAR_VALUE,
    setter: (gl, value) => gl.clearColor(...value)
  },

  colorMask: {
    type: [GLboolean, GLboolean, GLboolean, GLboolean],
    value: [true, true, true, true],
    params: GL.COLOR_WRITEMASK,
    setter: (gl, value) => gl.colorMask(...value)
  },

  cullFace: {
    type: GLboolean,
    value: false,
    params: GL.CULL_FACE,
    setter: (gl, value) => gl.enable(GL.CULL_FACE, value)
  },

  cullFaceMode: {
    type: GLenum,
    params: GL.CULL_FACE_MODE,
    setter: (gl, value) => gl.cullFace(value)
  },

  depthTest: {
    type: GLboolean,
    value: false,
    params: GL.DEPTH_TEST,
    setter: (gl, value) => gl.enable(GL.DEPTH_TEST, value)
  },

  depthClearValue: {
    type: GLfloat,
    value: true,
    params: GL.DEPTH_CLEAR_VALUE,
    setter: (gl, value) => gl.clearDepth(value)
  },

  depthFunc: {
    type: GLenum,
    value: null,
    params: GL.DEPTH_FUNC,
    setter: (gl, value) => gl.depthFunc(value)
  },

  depthRange: {
    type: new Float32Array(2),
    value: new Float32Array([0, 1]), // TBD
    object: ['min', 'max'],
    params: GL.DEPTH_RANGE,
    setter: (gl, value) => gl.depthRange(...value)
  },

  depthWritemask: {
    type: GLboolean,
    value: null,
    params: GL.DEPTH_WRITEMASK,
    setter: (gl, value) => gl.depthMask(value)
  },

  dither: {
    type: GLboolean,
    value: true,
    params: GL.DITHER,
    setter: (gl, value) => gl.enable(GL.DITHER, value)
  },

  fragmentShaderDerivativeHint: {
    type: GLenum,
    value: GL.DONT_CARE,
    params: GL.FRAGMENT_SHADER_DERIVATIVE_HINT,
    setter: (gl, value) => gl.hint(GL.FRAGMENT_SHADER_DERIVATIVE_HINT, value),
    gl1: 'OES_standard_derivatives'
  },

  frontFace: {
    type: GLenum,
    value: GL.CCW,
    params: GL.FRONT_FACE,
    setter: (gl, value) => gl.frontFace(value)
  },

  // Hint for quality of images generated with glGenerateMipmap
  generateMipmapHint: {
    type: GLenum,
    value: GL.DONT_CARE,
    params: GL.GENERATE_MIPMAP_HINT,
    setter: (gl, value) => gl.hint(GL.GENERATE_MIPMAP_HINT, value)
  },

  lineWidth: {
    type: GLfloat,
    value: 1,
    params: GL.LINE_WIDTH,
    setter: (gl, value) => gl.lineWidth(value)
  },

  polygonOffsetFill: {
    type: GLboolean,
    value: false,
    params: GL.POLYGON_OFFSET_FILL,
    setter: (gl, value) => gl.enable(GL.POLYGON_OFFSET_FILL, value)
  },

  // Add small offset to fragment depth values (by factor × DZ + r × units)
  // Useful for rendering hidden-line images, for applying decals to surfaces,
  // and for rendering solids with highlighted edges.
  // https://www.khronos.org/opengles/sdk/docs/man/xhtml/glPolygonOffset.xml
  polygonOffset: {
    type: [GLfloat, GLfloat],
    value: [0, 0],
    params: [GL.POLYGON_OFFSET_FACTOR, GL.POLYGON_OFFSET_UNITS],
    object: ['factor', 'units'],
    setter: (gl, value) => gl.polygonOffset(...value)
  },

  // TODO - enabling multisampling
  // glIsEnabled with argument GL_SAMPLE_ALPHA_TO_COVERAGE
  // glIsEnabled with argument GL_SAMPLE_COVERAGE

  // specify multisample coverage parameters
  // https://www.khronos.org/opengles/sdk/docs/man/xhtml/glSampleCoverage.xml
  sampleCoverage: {
    type: [GLfloat, GLboolean],
    value: [1.0, false],
    params: [GL.SAMPLE_COVERAGE_VALUE, GL.SAMPLE_COVERAGE_INVERT],
    object: ['value', 'invert'],
    setter: (gl, value) => gl.sampleCoverage(...value)
  },

  scissorTest: {
    type: GLboolean,
    value: false,
    params: GL.SCISSOR_TEST,
    setter: (gl, value) => gl.enable(GL.SCISSOR_TEST, value)
  },
  scissorBox: {
    type: new Int32Array(4),
    value: new Int32Array([null, null, null, null]), // TBD
    object: ['x', 'y', 'width', 'height'],
    params: GL.SCISSOR_BOX,
    setter: (gl, value) => gl.scissor(...value)
  },

  stencilTest: {
    type: GLboolean,
    value: false,
    params: GL.STENCIL_TEST,
    setter: (gl, value) => gl.enable(GL.STENCIL_TEST, value)
  },

  // Sets index used when stencil buffer is cleared.
  stencilClearValue: {
    type: GLint,
    value: 0,
    params: GL.STENCIL_CLEAR_VALUE, // GLint
    setter: (gl, value) => gl.clearStencil(value)
  },

  // Sets bit mask enabling writing of individual bits in the stencil planes
  // https://www.khronos.org/opengles/sdk/docs/man/xhtml/glStencilMaskSeparate.xml
  stencilMask: {
    type: [GLuint, GLuint],
    value: [0xFFFFFFFF, 0xFFFFFFFF],
    params: [GL.STENCIL_WRITEMASK, GL.STENCIL_BACK_WRITEMASK],
    object: ['mask', 'backMask'],
    setter: (gl, value) => {
      value = isArray(value) ? value : [value, value];
      const [mask, backMask] = value;
      gl.stencilMaskSeparate(GL.FRONT, mask);
      gl.stencilMaskSeparate(GL.BACK, backMask);
    }
  },

  // Set stencil testing function, reference value and mask for front and back
  // https://www.khronos.org/opengles/sdk/docs/man/xhtml/glStencilFuncSeparate.xml
  stencilFunc: {
    type: [GLenum, GLint, GLuint, GLenum, GLint, GLuint],
    value: [GL.ALWAYS, 0, 0xFFFFFFFF, GL.ALWAYS, 0, 0xFFFFFFFF],
    params: [
      // front
      GL.STENCIL_FUNC,
      GL.STENCIL_REF,
      GL.STENCIL_VALUE_MASK,
      // back
      GL.STENCIL_BACK_FUNC,
      GL.STENCIL_BACK_REF,
      GL.STENCIL_BACK_VALUE_MASK
    ],
    object: [
      'func', 'ref', 'valueMask', 'backFunc', 'backRef', 'backValueMask'
    ],
    setter: (gl, value) => {
      const [func, ref, mask, backFunc, backRef, backMask] = value;
      gl.stencilFuncSeparate(GL.FRONT, func, ref, mask);
      gl.stencilFuncSeparate(GL.BACK, backFunc, backRef, backMask);
    }
  },

  // Specifies the action to take when the stencil test fails, front and back.
  // Stencil test fail action, depth test fail action, pass action
  // GL.KEEP, GL.ZERO, GL.REPLACE, GL.INCR, GL.INCR_WRAP, GL.DECR, GL.DECR_WRAP,
  // and GL.INVERT
  // https://www.khronos.org/opengles/sdk/docs/man/xhtml/glStencilOpSeparate.xml
  stencilOp: {
    type: [GLenum, GLenum, GLenum, GLenum, GLenum, GLenum],
    values: [GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP],
    params: [
      // front
      GL.STENCIL_FAIL,
      GL.STENCIL_PASS_DEPTH_FAIL,
      GL.STENCIL_PASS_DEPTH_PASS,
      // back
      GL.STENCIL_BACK_FAIL,
      GL.STENCIL_BACK_PASS_DEPTH_FAIL,
      GL.STENCIL_BACK_PASS_DEPTH_PASS
    ],
    object: [
      'fail', 'passDepthFail', 'passDepthPass',
      'backFail', 'backPassDepthFail', 'backPassDepthPass'
    ],
    setter: (gl, value) => {
      const [sfail, dpfail, dppass, backSfail, backDpfail, backDppass] = value;
      gl.stencilOpSeparate(GL.FRONT, sfail, dpfail, dppass);
      gl.stencilOpSeparate(GL.BACK, backSfail, backDpfail, backDppass);
    }
  },

  viewport: {
    type: new Int32Array(4),
    value: new Int32Array([]),
    params: GL.VIEWPORT,
    object: ['x', 'y', 'width', 'height'],
    setter: (gl, value) => gl.viewport(...value)
  },

  // WEBGL1 PIXEL PACK/UNPACK MODES

  // Packing of pixel data in memory (1,2,4,8)
  packAlignment: {
    type: GLint,
    params: GL.PACK_ALIGNMENT,
    setter: (gl, value) => gl.pixelStorei(value)
  },
  // Unpacking pixel data from memory(1,2,4,8)
  unpackAlignment: {
    type: GLint,
    params: GL.UNPACK_ALIGNMENT,
    setter: (gl, value) => gl.pixelStorei(value)
  },
  // Flip source data along its vertical axis
  unpackFlipY: {
    type: GLboolean,
    params: GL.UNPACK_FLIP_Y_WEBGL,
    setter: (gl, value) => gl.pixelStorei(value)
  },
  // Multiplies the alpha channel into the other color channels
  unpackPremultiplyAlpha: {
    type: GLboolean,
    params: GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
    setter: (gl, value) => gl.pixelStorei(value)
  },
  // Default color space conversion or no color space conversion.
  unpackColorspaceConversion: {
    type: GLenum,
    params: GL.UNPACK_COLORSPACE_CONVERSION_WEBGL,
    setter: (gl, value) => gl.pixelStorei(value)
  },

  // WEBGL2 PIXEL PACK/UNPACK MODES

  // Number of pixels in a row.
  packRowLength: {
    type: GLint,
    params: GL.PACK_ROW_LENGTH,
    setter: (gl, value) => gl.pixelStorei(value),
    webgl2: true
  },
  //  Number of pixels skipped before the first pixel is written into memory.
  packSkipPixels: {
    params: GL.PACK_SKIP_PIXELS,
    setter: (gl, value) => gl.pixelStorei(value),
    webgl2: true
  },
  //  Number of rows of pixels skipped before first pixel is written to memory.
  packSkipRows: {
    params: GL.PACK_SKIP_ROWS,
    setter: (gl, value) => gl.pixelStorei(value),
    webgl2: true
  },
  //  Number of pixels in a row.
  unpackRowLength: {
    params: GL.UNPACK_ROW_LENGTH,
    setter: (gl, value) => gl.pixelStorei(value),
    webgl2: true
  },
  //  Image height used for reading pixel data from memory
  unpackImageHeight: {
    params: GL.UNPACK_IMAGE_HEIGHT,
    setter: (gl, value) => gl.pixelStorei(value),
    webgl2: true
  },
  //  Number of pixel images skipped before first pixel is read from memory
  unpackSkipPixels: {
    params: GL.UNPACK_SKIP_PIXELS,
    setter: (gl, value) => gl.pixelStorei(value),
    webgl2: true
  },
  //  Number of rows of pixels skipped before first pixel is read from memory
  unpackSkipRows: {
    params: GL.UNPACK_SKIP_ROWS,
    setter: (gl, value) => gl.pixelStorei(value),
    webgl2: true
  },
  //  Number of pixel images skipped before first pixel is read from memory
  unpackSkipImages: {
    params: GL.UNPACK_SKIP_IMAGES,
    setter: (gl, value) => gl.pixelStorei(value),
    webgl2: true
  }
};

// Map from GL parameter constants to composite paramters
const GL_PARAMS = {};

function unpackStateParams() {
  for (const key in GL_STATE) {
    const parameterDef = GL_STATE[key];
    const {params} = parameterDef;
    const paramsArray = isArray(params) ? params : [params];
    for (const param of paramsArray) {
      GL_PARAMS[param] = key;
    }
  }
}

unpackStateParams();

// GETTERS AND SETTERS

/**
 * Sets value with key to context.
 * Value may be "normalized" (in case a short form is supported). In that case
 * the normalized value is retured.
 *
 * @param {WebGLRenderingContext} gl - context
 * @param {String} key - parameter name
 * @param {*} value - parameter value
 * @return {*} - "normalized" parameter value after assignment
 */
export function getGLParameter(gl, key) {
  const parameterDefinition = GL_STATE[key];
  if (!parameterDefinition) {
    throw new Error(`Unknown GL state parameter ${key}`);
  }
  // Get the parameter value(s) from the context
  const {params} = parameterDefinition;
  const value = isArray(params) ?
    params.map(param => gl.getParameter(param)) :
    gl.getParameter(params);
  return value;
}

/**
 * Sets value with key to context.
 * Value may be "normalized" (in case a short form is supported). In that case
 * the normalized value is retured.
 *
 * @param {WebGLRenderingContext} gl - context
 * @param {String} key - parameter name
 * @param {*} value - parameter value
 * @return {*} - "normalized" parameter value after assignment
 */
export function setGLParameter(gl, key, value) {
  const parameterDefinition = GL_STATE[key];
  if (!parameterDefinition) {
    throw new Error(`Unknown GL state parameter ${key}`);
  }
  const {setter, normalizeValue} = parameterDefinition;
  const adjustedValue = normalizeValue ? normalizeValue(value) : value;
  setter(gl, adjustedValue);
  return adjustedValue;
}

// HELPERS

function isArray(array) {
  return Array.isArray(array) || ArrayBuffer.isView(array);
}

// GLState

class GLState {
  // Note: does not maintain a gl reference
  constructor(gl, {copyState = false} = {}) {
    this.state = {};
    if (copyState) {
      this._copyWebGLState(gl);
    } else {
      this._getInitialState();
    }
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
    const actualValue = setGLParameter(gl, key, value);
    this.state[key] = actualValue;
  }

  // Copies entire WebGL state to an object.
  // This generates a huge amount of asynchronous requests and should be
  // considered a very slow operation, to be done once at program startup.
  _copyWebGLState(gl) {
    for (const parameterKey in GL_STATE) {
      this.state[parameterKey] = getGLParameter(gl, parameterKey);
    }
  }

  _getInitialState() {
    for (const parameterKey in GL_STATE) {
      this.state[parameterKey] = GL_STATE[parameterKey].value;
    }
  }
}

function getGLState(gl, {copyState = false} = {}) {
  gl.luma = gl.luma || {};
  gl.luma.state = gl.luma.state || new GLState(gl, {copyState});
  return gl.luma.state;
}

/*
 * Executes a function with gl states temporarily set
 * Exception safe
 */
export function withGLState(gl, params, func) {
  // assertWebGLContext(gl);
  const state = getGLState(gl);

  const {frameBuffer} = params;
  // TODO - was there any previously set frame buffer we need to remember?
  if (frameBuffer) {
    frameBuffer.bind();
  }

  state.pushValues(gl, params);

  try {
    func(gl);
  } finally {
    state.popValues(gl);

    if (params.frameBuffer) {
      // TODO - was there any previously set frame buffer?
      // TODO - delegate "unbind" to Framebuffer object?
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }
}

export const TEST_EXPORTS = {
  GL_STATE
};
