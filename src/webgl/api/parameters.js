// Metadata for WebGL API state (parameter) related functions and constants
import GL from './constants';

// WebGL specification 'types'
export const GLenum = 'GLenum';
export const GLfloat = 'GLfloat';
export const GLint = 'GLint';
export const GLuint = 'GLint';
export const GLboolean = 'GLboolean';

// map of parameter setter function names, parameter constants, default values and types
//
// - Uses gl function names, except when setter function exist that are named differently
//
// - When the WebGL api offers <setter> and <setter>Separate (e.g. blendEquation and
//   blendEquationSeparate, we use non-separate name, but accept both non-separate and
//   separate arguments. Thus, a `getParameter` call will always return all the separate values
//   in an array, in a form that can be accepted by the setter.

export default {
  blend: {
    type: GLboolean,
    value: false,
    params: GL.BLEND,
    setter: (gl, value) => value ? gl.enable(GL.BLEND) : gl.disable(GL.BLEND)
  },

  blendColor: {
    type: new Float32Array(4),
    value: new Float32Array([0, 0, 0, 0]),
    params: GL.BLEND_COLOR,
    setter: (gl, value) => gl.blendColor(...value)
  },

  blendEquation: {
    type: [GLenum, GLenum],
    value: [GL.FUNC_ADD, GL.FUNC_ADD],
    params: [GL.BLEND_EQUATION_RGB, GL.BLEND_EQUATION_ALPHA],
    object: ['rgb', 'alpha'],
    setter: (gl, value) => gl.blendEquationSeparate(...value),
    normalizeArgs: args => isArray(args) ? args : [args, args]
  },

  // blend func
  blendFunc: {
    type: [GLenum, GLenum, GLenum, GLenum],
    value: [GL.ONE, GL.ZERO, GL.ONE, GL.ZERO],
    params: [GL.BLEND_SRC_RGB, GL.BLEND_DST_RGB, GL.BLEND_SRC_ALPHA, GL.BLEND_DST_ALPHA],
    object: ['srcRgb', 'dstRgb', 'srcAlpha', 'dstAlpha'],
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

  // TODO - We have a name clash here
  cullFace: {
    type: GLboolean,
    value: false,
    params: GL.CULL_FACE,
    setter: (gl, value) => value ? gl.enable(GL.CULL_FACE) : gl.disable(GL.CULL_FACE)
  },

  cullFaceMode: {
    type: GLenum,
    value: GL.BACK,
    params: GL.CULL_FACE_MODE,
    setter: (gl, value) => gl.cullFace(value)
  },

  depthTest: {
    type: GLboolean,
    value: false,
    params: GL.DEPTH_TEST,
    setter: (gl, value) => value ? gl.enable(GL.DEPTH_TEST) : gl.disable(GL.DEPTH_TEST)
  },

  depthClearValue: {
    type: GLfloat,
    value: 1,
    params: GL.DEPTH_CLEAR_VALUE,
    setter: (gl, value) => gl.clearDepth(value)
  },

  depthFunc: {
    type: GLenum,
    value: GL.LESS,
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
    value: true,
    params: GL.DEPTH_WRITEMASK,
    setter: (gl, value) => gl.depthMask(value)
  },

  dither: {
    type: GLboolean,
    value: true,
    params: GL.DITHER,
    setter: (gl, value) => value ? gl.enable(GL.DITHER) : gl.disable(GL.DITHER)
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
    setter: (gl, value) =>
      value ? gl.enable(GL.POLYGON_OFFSET_FILL) : gl.disable(GL.POLYGON_OFFSET_FILL)
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
    setter: (gl, value) => value ? gl.enable(GL.SCISSOR_TEST) : gl.disable(GL.SCISSOR_TEST)
  },

  scissorBox: {
    type: new Int32Array(4),
    // When scissor test enabled we expect users to set correct scissor box,
    // otherwise we default to following value array.
    value: new Int32Array([0, 0, 1024, 1024]),
    object: ['x', 'y', 'width', 'height'],
    params: GL.SCISSOR_BOX,
    setter: (gl, value) => gl.scissor(...value)
  },

  stencilTest: {
    type: GLboolean,
    value: false,
    params: GL.STENCIL_TEST,
    setter: (gl, value) => value ? gl.enable(GL.STENCIL_TEST) : gl.disable(GL.STENCIL_TEST)
  },

  // Sets index used when stencil buffer is cleared.
  stencilClearValue: {
    type: GLint,
    value: 0,
    params: GL.STENCIL_CLEAR_VALUE,
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
    value: [GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP],
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
    // We use [0, 0, 1024, 1024] as default, but usually this is updated in each frame.
    value: new Int32Array([0, 0, 1024, 1024]),
    params: GL.VIEWPORT,
    object: ['x', 'y', 'width', 'height'],
    setter: (gl, value) => gl.viewport(...value)
  },

  // WEBGL1 PIXEL PACK/UNPACK MODES

  // Packing of pixel data in memory (1,2,4,8)
  [GL.PACK_ALIGNMENT]: {
    type: GLint,
    value: 4,
    params: GL.PACK_ALIGNMENT,
    setter: (gl, value) => gl.pixelStorei(GL.PACK_ALIGNMENT, value)
  },
  // Unpacking pixel data from memory(1,2,4,8)
  [GL.UNPACK_ALIGNMENT]: {
    type: GLint,
    value: 4,
    params: GL.UNPACK_ALIGNMENT,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_ALIGNMENT, value)
  },
  // Flip source data along its vertical axis
  [GL.UNPACK_FLIP_Y_WEBGL]: {
    type: GLboolean,
    value: false,
    params: GL.UNPACK_FLIP_Y_WEBGL,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, value)
  },
  // Multiplies the alpha channel into the other color channels
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]: {
    type: GLboolean,
    value: false,
    params: GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, value)
  },
  // Default color space conversion or no color space conversion.
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]: {
    type: GLenum,
    value: GL.BROWSER_DEFAULT_WEBGL,
    params: GL.UNPACK_COLORSPACE_CONVERSION_WEBGL,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_COLORSPACE_CONVERSION_WEBGL, value)
  },

  // WEBGL2 PIXEL PACK/UNPACK MODES

  // Number of pixels in a row.
  [GL.PACK_ROW_LENGTH]: {
    type: GLint,
    value: 0,
    params: GL.PACK_ROW_LENGTH,
    setter: (gl, value) => gl.pixelStorei(GL.PACK_ROW_LENGTH, value),
    webgl2: true
  },
  // Number of pixels skipped before the first pixel is written into memory.
  [GL.PACK_SKIP_PIXELS]: {
    type: GLint,
    value: 0,
    params: GL.PACK_SKIP_PIXELS,
    setter: (gl, value) => gl.pixelStorei(GL.PACK_SKIP_PIXELS, value),
    webgl2: true
  },
  // Number of rows of pixels skipped before first pixel is written to memory.
  [GL.PACK_SKIP_ROWS]: {
    type: GLint,
    value: 0,
    params: GL.PACK_SKIP_ROWS,
    setter: (gl, value) => gl.pixelStorei(GL.PACK_SKIP_ROWS, value),
    webgl2: true
  },
  // Number of pixels in a row.
  [GL.UNPACK_ROW_LENGTH]: {
    type: GLint,
    value: 0,
    params: GL.UNPACK_ROW_LENGTH,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_ROW_LENGTH, value),
    webgl2: true
  },
  // Image height used for reading pixel data from memory
  [GL.UNPACK_IMAGE_HEIGHT]: {
    type: GLint,
    value: 0,
    params: GL.UNPACK_IMAGE_HEIGHT,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_IMAGE_HEIGHT, value),
    webgl2: true
  },
  // Number of pixel images skipped before first pixel is read from memory
  [GL.UNPACK_SKIP_PIXELS]: {
    type: GLint,
    value: 0,
    params: GL.UNPACK_SKIP_PIXELS,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_SKIP_PIXELS, value),
    webgl2: true
  },
  // Number of rows of pixels skipped before first pixel is read from memory
  [GL.UNPACK_SKIP_ROWS]: {
    type: GLint,
    value: 0,
    params: GL.UNPACK_SKIP_ROWS,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_SKIP_ROWS, value),
    webgl2: true
  },
  // Number of pixel images skipped before first pixel is read from memory
  [GL.UNPACK_SKIP_IMAGES]: {
    type: GLint,
    value: 0,
    params: GL.UNPACK_SKIP_IMAGES,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_SKIP_IMAGES, value),
    webgl2: true
  }
};

// HELPERS

function isArray(array) {
  return Array.isArray(array) || ArrayBuffer.isView(array);
}
