// Metadata for WebGL API state (parameter) related functions and constants
import GL from '../../webgl-utils/constants';

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
    params: GL.BLEND,
    value: false,
    setter: (gl, value) => value ? gl.enable(GL.BLEND) : gl.disable(GL.BLEND)
  },

  blendColor: {
    value: new Float32Array([0, 0, 0, 0]),
    params: GL.BLEND_COLOR,
    setter: (gl, value) => gl.blendColor(...value)
  },

  blendEquation: {
    value: [GL.FUNC_ADD, GL.FUNC_ADD],
    params: [GL.BLEND_EQUATION_RGB, GL.BLEND_EQUATION_ALPHA],
    setter: (gl, value) => gl.blendEquationSeparate(...value),
    normalizeArgs: args => isArray(args) ? args : [args, args]
  },

  // blend func
  blendFunc: {
    params: [GL.BLEND_SRC_RGB, GL.BLEND_DST_RGB, GL.BLEND_SRC_ALPHA, GL.BLEND_DST_ALPHA],
    value: [GL.ONE, GL.ZERO, GL.ONE, GL.ZERO],
    setter: (gl, value) => gl.blendFuncSeparate(...value),
    normalizeArgs: args => isArray(args) && args.length === 3 ? [...args, ...args] : args
  },

  clearColor: {
    params: GL.COLOR_CLEAR_VALUE,
    value: new Float32Array([0, 0, 0, 0]), // TBD
    setter: (gl, value) => gl.clearColor(...value)
  },

  colorMask: {
    params: GL.COLOR_WRITEMASK,
    value: [true, true, true, true],
    setter: (gl, value) => gl.colorMask(...value)
  },

  // TODO - We have a name clash here
  cullFace: {
    params: GL.CULL_FACE,
    value: false,
    setter: (gl, value) => value ? gl.enable(GL.CULL_FACE) : gl.disable(GL.CULL_FACE)
  },

  cullFaceMode: {
    params: GL.CULL_FACE_MODE,
    value: GL.BACK,
    setter: (gl, value) => gl.cullFace(value)
  },

  depthTest: {
    params: GL.DEPTH_TEST,
    value: false,
    setter: (gl, value) => value ? gl.enable(GL.DEPTH_TEST) : gl.disable(GL.DEPTH_TEST)
  },

  depthClearValue: {
    params: GL.DEPTH_CLEAR_VALUE,
    value: 1,
    setter: (gl, value) => gl.clearDepth(value)
  },

  depthFunc: {
    params: GL.DEPTH_FUNC,
    value: GL.LESS,
    setter: (gl, value) => gl.depthFunc(value)
  },

  depthRange: {
    params: GL.DEPTH_RANGE,
    value: new Float32Array([0, 1]), // TBD
    setter: (gl, value) => gl.depthRange(...value)
  },

  depthWritemask: {
    params: GL.DEPTH_WRITEMASK,
    value: true,
    setter: (gl, value) => gl.depthMask(value)
  },

  dither: {
    params: GL.DITHER,
    value: true,
    setter: (gl, value) => value ? gl.enable(GL.DITHER) : gl.disable(GL.DITHER)
  },

  fragmentShaderDerivativeHint: {
    params: GL.FRAGMENT_SHADER_DERIVATIVE_HINT,
    value: GL.DONT_CARE,
    setter: (gl, value) => gl.hint(GL.FRAGMENT_SHADER_DERIVATIVE_HINT, value),
    gl1: 'OES_standard_derivatives'
  },

  frontFace: {
    params: GL.FRONT_FACE,
    value: GL.CCW,
    setter: (gl, value) => gl.frontFace(value)
  },

  // Hint for quality of images generated with glGenerateMipmap
  generateMipmapHint: {
    params: GL.GENERATE_MIPMAP_HINT,
    value: GL.DONT_CARE,
    setter: (gl, value) => gl.hint(GL.GENERATE_MIPMAP_HINT, value)
  },

  lineWidth: {
    params: GL.LINE_WIDTH,
    value: 1,
    setter: (gl, value) => gl.lineWidth(value)
  },

  polygonOffsetFill: {
    params: GL.POLYGON_OFFSET_FILL,
    value: false,
    setter: (gl, value) =>
      value ? gl.enable(GL.POLYGON_OFFSET_FILL) : gl.disable(GL.POLYGON_OFFSET_FILL)
  },

  // Add small offset to fragment depth values (by factor × DZ + r × units)
  // Useful for rendering hidden-line images, for applying decals to surfaces,
  // and for rendering solids with highlighted edges.
  // https://www.khronos.org/opengles/sdk/docs/man/xhtml/glPolygonOffset.xml
  polygonOffset: {
    object: ['factor', 'units'],
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

  scissorTest: {
    params: GL.SCISSOR_TEST,
    value: false,
    setter: (gl, value) => value ? gl.enable(GL.SCISSOR_TEST) : gl.disable(GL.SCISSOR_TEST)
  },

  scissorBox: {
    // When scissor test enabled we expect users to set correct scissor box,
    // otherwise we default to following value array.
    params: GL.SCISSOR_BOX,
    value: new Int32Array([0, 0, 1024, 1024]),
    setter: (gl, value) => gl.scissor(...value)
  },

  stencilTest: {
    params: GL.STENCIL_TEST,
    value: false,
    setter: (gl, value) => value ? gl.enable(GL.STENCIL_TEST) : gl.disable(GL.STENCIL_TEST)
  },

  // Sets index used when stencil buffer is cleared.
  stencilClearValue: {
    params: GL.STENCIL_CLEAR_VALUE,
    value: 0,
    setter: (gl, value) => gl.clearStencil(value)
  },

  // Sets bit mask enabling writing of individual bits in the stencil planes
  // https://www.khronos.org/opengles/sdk/docs/man/xhtml/glStencilMaskSeparate.xml
  stencilMask: {
    value: [0xFFFFFFFF, 0xFFFFFFFF],
    params: [GL.STENCIL_WRITEMASK, GL.STENCIL_BACK_WRITEMASK],
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
    params: [
      GL.STENCIL_FUNC, GL.STENCIL_REF, GL.STENCIL_VALUE_MASK,
      GL.STENCIL_BACK_FUNC, GL.STENCIL_BACK_REF, GL.STENCIL_BACK_VALUE_MASK
    ],
    value: [GL.ALWAYS, 0, 0xFFFFFFFF, GL.ALWAYS, 0, 0xFFFFFFFF],
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
    params: [
      GL.STENCIL_FAIL, GL.STENCIL_PASS_DEPTH_FAIL, GL.STENCIL_PASS_DEPTH_PASS,
      GL.STENCIL_BACK_FAIL, GL.STENCIL_BACK_PASS_DEPTH_FAIL, GL.STENCIL_BACK_PASS_DEPTH_PASS
    ],
    value: [GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP, GL.KEEP],
    setter: (gl, value) => {
      const [sfail, dpfail, dppass, backSfail, backDpfail, backDppass] = value;
      gl.stencilOpSeparate(GL.FRONT, sfail, dpfail, dppass);
      gl.stencilOpSeparate(GL.BACK, backSfail, backDpfail, backDppass);
    }
  },

  viewport: {
    // We use [0, 0, 1024, 1024] as default, but usually this is updated in each frame.
    params: GL.VIEWPORT,
    value: new Int32Array([0, 0, 1024, 1024]),
    setter: (gl, value) => gl.viewport(...value)
  },

  // WEBGL1 PIXEL PACK/UNPACK MODES

  // Packing of pixel data in memory (1,2,4,8)
  [GL.PACK_ALIGNMENT]: {
    params: GL.PACK_ALIGNMENT,
    value: 4,
    setter: (gl, value) => gl.pixelStorei(GL.PACK_ALIGNMENT, value)
  },
  // Unpacking pixel data from memory(1,2,4,8)
  [GL.UNPACK_ALIGNMENT]: {
    params: GL.UNPACK_ALIGNMENT,
    value: 4,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_ALIGNMENT, value)
  },
  // Flip source data along its vertical axis
  [GL.UNPACK_FLIP_Y_WEBGL]: {
    params: GL.UNPACK_FLIP_Y_WEBGL,
    value: false,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, value)
  },
  // Multiplies the alpha channel into the other color channels
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]: {
    params: GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
    value: false,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, value)
  },
  // Default color space conversion or no color space conversion.
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]: {
    params: GL.UNPACK_COLORSPACE_CONVERSION_WEBGL,
    value: GL.BROWSER_DEFAULT_WEBGL,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_COLORSPACE_CONVERSION_WEBGL, value)
  },

  // WEBGL2 PIXEL PACK/UNPACK MODES

  // Number of pixels in a row.
  [GL.PACK_ROW_LENGTH]: {
    params: GL.PACK_ROW_LENGTH,
    value: 0,
    setter: (gl, value) => gl.pixelStorei(GL.PACK_ROW_LENGTH, value),
    webgl2: true
  },
  // Number of pixels skipped before the first pixel is written into memory.
  [GL.PACK_SKIP_PIXELS]: {
    params: GL.PACK_SKIP_PIXELS,
    value: 0,
    setter: (gl, value) => gl.pixelStorei(GL.PACK_SKIP_PIXELS, value),
    webgl2: true
  },
  // Number of rows of pixels skipped before first pixel is written to memory.
  [GL.PACK_SKIP_ROWS]: {
    params: GL.PACK_SKIP_ROWS,
    value: 0,
    setter: (gl, value) => gl.pixelStorei(GL.PACK_SKIP_ROWS, value),
    webgl2: true
  },
  // Number of pixels in a row.
  [GL.UNPACK_ROW_LENGTH]: {
    params: GL.UNPACK_ROW_LENGTH,
    value: 0,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_ROW_LENGTH, value),
    webgl2: true
  },
  // Image height used for reading pixel data from memory
  [GL.UNPACK_IMAGE_HEIGHT]: {
    params: GL.UNPACK_IMAGE_HEIGHT,
    value: 0,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_IMAGE_HEIGHT, value),
    webgl2: true
  },
  // Number of pixel images skipped before first pixel is read from memory
  [GL.UNPACK_SKIP_PIXELS]: {
    params: GL.UNPACK_SKIP_PIXELS,
    value: 0,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_SKIP_PIXELS, value),
    webgl2: true
  },
  // Number of rows of pixels skipped before first pixel is read from memory
  [GL.UNPACK_SKIP_ROWS]: {
    params: GL.UNPACK_SKIP_ROWS,
    value: 0,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_SKIP_ROWS, value),
    webgl2: true
  },
  // Number of pixel images skipped before first pixel is read from memory
  [GL.UNPACK_SKIP_IMAGES]: {
    params: GL.UNPACK_SKIP_IMAGES,
    value: 0,
    setter: (gl, value) => gl.pixelStorei(GL.UNPACK_SKIP_IMAGES, value),
    webgl2: true
  }
};

// HELPERS

function isArray(array) {
  return Array.isArray(array) || ArrayBuffer.isView(array);
}
