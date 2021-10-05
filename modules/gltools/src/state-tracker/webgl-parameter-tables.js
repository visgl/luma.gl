// Tables describing WebGL parameters
import GL from '@luma.gl/constants';
import {isWebGL2} from '../utils/webgl-checks';

// DEFAULT SETTINGS - FOR FAST CACHE INITIALIZATION AND CONTEXT RESETS

/* eslint-disable no-shadow */

export const GL_PARAMETER_DEFAULTS = {
  [GL.BLEND]: false,
  [GL.BLEND_COLOR]: new Float32Array([0, 0, 0, 0]),
  [GL.BLEND_EQUATION_RGB]: GL.FUNC_ADD,
  [GL.BLEND_EQUATION_ALPHA]: GL.FUNC_ADD,
  [GL.BLEND_SRC_RGB]: GL.ONE,
  [GL.BLEND_DST_RGB]: GL.ZERO,
  [GL.BLEND_SRC_ALPHA]: GL.ONE,
  [GL.BLEND_DST_ALPHA]: GL.ZERO,
  [GL.COLOR_CLEAR_VALUE]: new Float32Array([0, 0, 0, 0]), // TBD
  [GL.COLOR_WRITEMASK]: [true, true, true, true],
  [GL.CULL_FACE]: false,
  [GL.CULL_FACE_MODE]: GL.BACK,
  [GL.DEPTH_TEST]: false,
  [GL.DEPTH_CLEAR_VALUE]: 1,
  [GL.DEPTH_FUNC]: GL.LESS,
  [GL.DEPTH_RANGE]: new Float32Array([0, 1]), // TBD
  [GL.DEPTH_WRITEMASK]: true,
  [GL.DITHER]: true,
  // FRAMEBUFFER_BINDING and DRAW_FRAMEBUFFER_BINDING(WebGL2) refer same state.
  [GL.FRAMEBUFFER_BINDING]: null,
  [GL.FRONT_FACE]: GL.CCW,
  [GL.GENERATE_MIPMAP_HINT]: GL.DONT_CARE,
  [GL.LINE_WIDTH]: 1,
  [GL.POLYGON_OFFSET_FILL]: false,
  [GL.POLYGON_OFFSET_FACTOR]: 0,
  [GL.POLYGON_OFFSET_UNITS]: 0,
  [GL.SAMPLE_COVERAGE_VALUE]: 1.0,
  [GL.SAMPLE_COVERAGE_INVERT]: false,
  [GL.SCISSOR_TEST]: false,
  // Note: Dynamic value. If scissor test enabled we expect users to set correct scissor box
  [GL.SCISSOR_BOX]: new Int32Array([0, 0, 1024, 1024]),
  [GL.STENCIL_TEST]: false,
  [GL.STENCIL_CLEAR_VALUE]: 0,
  [GL.STENCIL_WRITEMASK]: 0xffffffff,
  [GL.STENCIL_BACK_WRITEMASK]: 0xffffffff,
  [GL.STENCIL_FUNC]: GL.ALWAYS,
  [GL.STENCIL_REF]: 0,
  [GL.STENCIL_VALUE_MASK]: 0xffffffff,
  [GL.STENCIL_BACK_FUNC]: GL.ALWAYS,
  [GL.STENCIL_BACK_REF]: 0,
  [GL.STENCIL_BACK_VALUE_MASK]: 0xffffffff,
  [GL.STENCIL_FAIL]: GL.KEEP,
  [GL.STENCIL_PASS_DEPTH_FAIL]: GL.KEEP,
  [GL.STENCIL_PASS_DEPTH_PASS]: GL.KEEP,
  [GL.STENCIL_BACK_FAIL]: GL.KEEP,
  [GL.STENCIL_BACK_PASS_DEPTH_FAIL]: GL.KEEP,
  [GL.STENCIL_BACK_PASS_DEPTH_PASS]: GL.KEEP,
  // Dynamic value: We use [0, 0, 1024, 1024] as default, but usually this is updated in each frame.
  [GL.VIEWPORT]: [0, 0, 1024, 1024],
  // WEBGL1 PIXEL PACK/UNPACK MODES
  [GL.PACK_ALIGNMENT]: 4,
  [GL.UNPACK_ALIGNMENT]: 4,
  [GL.UNPACK_FLIP_Y_WEBGL]: false,
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]: false,
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]: GL.BROWSER_DEFAULT_WEBGL,

  // WEBGL2 / EXTENSIONS
  // gl1: 'OES_standard_derivatives'
  [GL.FRAGMENT_SHADER_DERIVATIVE_HINT]: GL.DONT_CARE,
  [GL.READ_FRAMEBUFFER_BINDING]: null,
  [GL.RASTERIZER_DISCARD]: false,
  [GL.PACK_ROW_LENGTH]: 0,
  [GL.PACK_SKIP_PIXELS]: 0,
  [GL.PACK_SKIP_ROWS]: 0,
  [GL.UNPACK_ROW_LENGTH]: 0,
  [GL.UNPACK_IMAGE_HEIGHT]: 0,
  [GL.UNPACK_SKIP_PIXELS]: 0,
  [GL.UNPACK_SKIP_ROWS]: 0,
  [GL.UNPACK_SKIP_IMAGES]: 0
};

// SETTER TABLES - ENABLES SETTING ANY PARAMETER WITH A COMMON API

const enable = (gl, value, key) => (value ? gl.enable(key) : gl.disable(key));
const hint = (gl, value, key) => gl.hint(key, value);
const pixelStorei = (gl, value, key) => gl.pixelStorei(key, value);

const drawFramebuffer = (gl, value) => {
  const target = isWebGL2(gl) ? GL.DRAW_FRAMEBUFFER : GL.FRAMEBUFFER;
  return gl.bindFramebuffer(target, value);
};
const readFramebuffer = (gl, value) => {
  return gl.bindFramebuffer(GL.READ_FRAMEBUFFER, value);
};

// Utility
function isArray(array) {
  return Array.isArray(array) || ArrayBuffer.isView(array);
}

// Map from WebGL parameter names to corresponding WebGL setter functions
// WegGL constants are read by parameter names, but set by function names
// NOTE: When value type is a string, it will be handled by 'GL_COMPOSITE_PARAMETER_SETTERS'
export const GL_PARAMETER_SETTERS = {
  [GL.BLEND]: enable,
  [GL.BLEND_COLOR]: (gl, value) => gl.blendColor(...value),
  [GL.BLEND_EQUATION_RGB]: 'blendEquation',
  [GL.BLEND_EQUATION_ALPHA]: 'blendEquation',
  [GL.BLEND_SRC_RGB]: 'blendFunc',
  [GL.BLEND_DST_RGB]: 'blendFunc',
  [GL.BLEND_SRC_ALPHA]: 'blendFunc',
  [GL.BLEND_DST_ALPHA]: 'blendFunc',
  [GL.COLOR_CLEAR_VALUE]: (gl, value) => gl.clearColor(...value),
  [GL.COLOR_WRITEMASK]: (gl, value) => gl.colorMask(...value),
  [GL.CULL_FACE]: enable,
  [GL.CULL_FACE_MODE]: (gl, value) => gl.cullFace(value),
  [GL.DEPTH_TEST]: enable,
  [GL.DEPTH_CLEAR_VALUE]: (gl, value) => gl.clearDepth(value),
  [GL.DEPTH_FUNC]: (gl, value) => gl.depthFunc(value),
  [GL.DEPTH_RANGE]: (gl, value) => gl.depthRange(...value),
  [GL.DEPTH_WRITEMASK]: (gl, value) => gl.depthMask(value),
  [GL.DITHER]: enable,
  [GL.FRAGMENT_SHADER_DERIVATIVE_HINT]: hint,
  // NOTE: FRAMEBUFFER_BINDING and DRAW_FRAMEBUFFER_BINDING(WebGL2) refer same state.
  [GL.FRAMEBUFFER_BINDING]: drawFramebuffer,
  [GL.FRONT_FACE]: (gl, value) => gl.frontFace(value),
  [GL.GENERATE_MIPMAP_HINT]: hint,
  [GL.LINE_WIDTH]: (gl, value) => gl.lineWidth(value),
  [GL.POLYGON_OFFSET_FILL]: enable,
  [GL.POLYGON_OFFSET_FACTOR]: 'polygonOffset',
  [GL.POLYGON_OFFSET_UNITS]: 'polygonOffset',
  [GL.RASTERIZER_DISCARD]: enable,
  [GL.SAMPLE_COVERAGE_VALUE]: 'sampleCoverage',
  [GL.SAMPLE_COVERAGE_INVERT]: 'sampleCoverage',
  [GL.SCISSOR_TEST]: enable,
  [GL.SCISSOR_BOX]: (gl, value) => gl.scissor(...value),
  [GL.STENCIL_TEST]: enable,
  [GL.STENCIL_CLEAR_VALUE]: (gl, value) => gl.clearStencil(value),
  [GL.STENCIL_WRITEMASK]: (gl, value) => gl.stencilMaskSeparate(GL.FRONT, value),
  [GL.STENCIL_BACK_WRITEMASK]: (gl, value) => gl.stencilMaskSeparate(GL.BACK, value),
  [GL.STENCIL_FUNC]: 'stencilFuncFront',
  [GL.STENCIL_REF]: 'stencilFuncFront',
  [GL.STENCIL_VALUE_MASK]: 'stencilFuncFront',
  [GL.STENCIL_BACK_FUNC]: 'stencilFuncBack',
  [GL.STENCIL_BACK_REF]: 'stencilFuncBack',
  [GL.STENCIL_BACK_VALUE_MASK]: 'stencilFuncBack',
  [GL.STENCIL_FAIL]: 'stencilOpFront',
  [GL.STENCIL_PASS_DEPTH_FAIL]: 'stencilOpFront',
  [GL.STENCIL_PASS_DEPTH_PASS]: 'stencilOpFront',
  [GL.STENCIL_BACK_FAIL]: 'stencilOpBack',
  [GL.STENCIL_BACK_PASS_DEPTH_FAIL]: 'stencilOpBack',
  [GL.STENCIL_BACK_PASS_DEPTH_PASS]: 'stencilOpBack',
  [GL.VIEWPORT]: (gl, value) => gl.viewport(...value),

  // WEBGL1 PIXEL PACK/UNPACK MODES
  [GL.PACK_ALIGNMENT]: pixelStorei,
  [GL.UNPACK_ALIGNMENT]: pixelStorei,
  [GL.UNPACK_FLIP_Y_WEBGL]: pixelStorei,
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]: pixelStorei,
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]: pixelStorei,

  // WEBGL2 PIXEL PACK/UNPACK MODES
  // RASTERIZER_DISCARD ...
  [GL.PACK_ROW_LENGTH]: pixelStorei,
  [GL.PACK_SKIP_PIXELS]: pixelStorei,
  [GL.PACK_SKIP_ROWS]: pixelStorei,
  [GL.READ_FRAMEBUFFER_BINDING]: readFramebuffer,
  [GL.UNPACK_ROW_LENGTH]: pixelStorei,
  [GL.UNPACK_IMAGE_HEIGHT]: pixelStorei,
  [GL.UNPACK_SKIP_PIXELS]: pixelStorei,
  [GL.UNPACK_SKIP_ROWS]: pixelStorei,
  [GL.UNPACK_SKIP_IMAGES]: pixelStorei,

  // Function-style setters
  framebuffer: (gl, framebuffer) => {
    // accepts 1) a WebGLFramebuffer 2) null (default framebuffer), or 3) luma.gl Framebuffer class
    // framebuffer is null when restoring to default framebuffer, otherwise use the WebGL handle.
    const handle = framebuffer && 'handle' in framebuffer ? framebuffer.handle : framebuffer;
    return gl.bindFramebuffer(GL.FRAMEBUFFER, handle);
  },
  blend: (gl, value) => (value ? gl.enable(GL.BLEND) : gl.disable(GL.BLEND)),
  blendColor: (gl, value) => gl.blendColor(...value),
  blendEquation: (gl, args) => {
    args = isArray(args) ? args : [args, args];
    gl.blendEquationSeparate(...args);
  },
  blendFunc: (gl, args) => {
    args = isArray(args) && args.length === 2 ? [...args, ...args] : args;
    gl.blendFuncSeparate(...args);
  },

  clearColor: (gl, value) => gl.clearColor(...value),
  clearDepth: (gl, value) => gl.clearDepth(value),
  clearStencil: (gl, value) => gl.clearStencil(value),

  colorMask: (gl, value) => gl.colorMask(...value),

  cull: (gl, value) => (value ? gl.enable(GL.CULL_FACE) : gl.disable(GL.CULL_FACE)),
  cullFace: (gl, value) => gl.cullFace(value),

  depthTest: (gl, value) => (value ? gl.enable(GL.DEPTH_TEST) : gl.disable(GL.DEPTH_TEST)),
  depthFunc: (gl, value) => gl.depthFunc(value),
  depthMask: (gl, value) => gl.depthMask(value),
  depthRange: (gl, value) => gl.depthRange(...value),

  dither: (gl, value) => (value ? gl.enable(GL.DITHER) : gl.disable(GL.DITHER)),

  derivativeHint: (gl, value) => {
    // gl1: 'OES_standard_derivatives'
    gl.hint(GL.FRAGMENT_SHADER_DERIVATIVE_HINT, value);
  },

  frontFace: (gl, value) => gl.frontFace(value),

  mipmapHint: (gl, value) => gl.hint(GL.GENERATE_MIPMAP_HINT, value),

  lineWidth: (gl, value) => gl.lineWidth(value),

  polygonOffsetFill: (gl, value) =>
    value ? gl.enable(GL.POLYGON_OFFSET_FILL) : gl.disable(GL.POLYGON_OFFSET_FILL),
  polygonOffset: (gl, value) => gl.polygonOffset(...value),

  sampleCoverage: (gl, value) => gl.sampleCoverage(...value),

  scissorTest: (gl, value) => (value ? gl.enable(GL.SCISSOR_TEST) : gl.disable(GL.SCISSOR_TEST)),
  scissor: (gl, value) => gl.scissor(...value),

  stencilTest: (gl, value) => (value ? gl.enable(GL.STENCIL_TEST) : gl.disable(GL.STENCIL_TEST)),
  stencilMask: (gl, value) => {
    value = isArray(value) ? value : [value, value];
    const [mask, backMask] = value;
    gl.stencilMaskSeparate(GL.FRONT, mask);
    gl.stencilMaskSeparate(GL.BACK, backMask);
  },
  stencilFunc: (gl, args) => {
    args = isArray(args) && args.length === 3 ? [...args, ...args] : args;
    const [func, ref, mask, backFunc, backRef, backMask] = args;
    gl.stencilFuncSeparate(GL.FRONT, func, ref, mask);
    gl.stencilFuncSeparate(GL.BACK, backFunc, backRef, backMask);
  },
  stencilOp: (gl, args) => {
    args = isArray(args) && args.length === 3 ? [...args, ...args] : args;
    const [sfail, dpfail, dppass, backSfail, backDpfail, backDppass] = args;
    gl.stencilOpSeparate(GL.FRONT, sfail, dpfail, dppass);
    gl.stencilOpSeparate(GL.BACK, backSfail, backDpfail, backDppass);
  },

  viewport: (gl, value) => gl.viewport(...value)
};

function getValue(glEnum, values, cache) {
  return values[glEnum] !== undefined ? values[glEnum] : cache[glEnum];
}

// COMPOSITE_WEBGL_PARAMETER_
export const GL_COMPOSITE_PARAMETER_SETTERS = {
  blendEquation: (gl, values, cache) =>
    gl.blendEquationSeparate(
      getValue(GL.BLEND_EQUATION_RGB, values, cache),
      getValue(GL.BLEND_EQUATION_ALPHA, values, cache)
    ),
  blendFunc: (gl, values, cache) =>
    gl.blendFuncSeparate(
      getValue(GL.BLEND_SRC_RGB, values, cache),
      getValue(GL.BLEND_DST_RGB, values, cache),
      getValue(GL.BLEND_SRC_ALPHA, values, cache),
      getValue(GL.BLEND_DST_ALPHA, values, cache)
    ),
  polygonOffset: (gl, values, cache) =>
    gl.polygonOffset(
      getValue(GL.POLYGON_OFFSET_FACTOR, values, cache),
      getValue(GL.POLYGON_OFFSET_UNITS, values, cache)
    ),
  sampleCoverage: (gl, values, cache) =>
    gl.sampleCoverage(
      getValue(GL.SAMPLE_COVERAGE_VALUE, values, cache),
      getValue(GL.SAMPLE_COVERAGE_INVERT, values, cache)
    ),
  stencilFuncFront: (gl, values, cache) =>
    gl.stencilFuncSeparate(
      GL.FRONT,
      getValue(GL.STENCIL_FUNC, values, cache),
      getValue(GL.STENCIL_REF, values, cache),
      getValue(GL.STENCIL_VALUE_MASK, values, cache)
    ),
  stencilFuncBack: (gl, values, cache) =>
    gl.stencilFuncSeparate(
      GL.BACK,
      getValue(GL.STENCIL_BACK_FUNC, values, cache),
      getValue(GL.STENCIL_BACK_REF, values, cache),
      getValue(GL.STENCIL_BACK_VALUE_MASK, values, cache)
    ),
  stencilOpFront: (gl, values, cache) =>
    gl.stencilOpSeparate(
      GL.FRONT,
      getValue(GL.STENCIL_FAIL, values, cache),
      getValue(GL.STENCIL_PASS_DEPTH_FAIL, values, cache),
      getValue(GL.STENCIL_PASS_DEPTH_PASS, values, cache)
    ),
  stencilOpBack: (gl, values, cache) =>
    gl.stencilOpSeparate(
      GL.BACK,
      getValue(GL.STENCIL_BACK_FAIL, values, cache),
      getValue(GL.STENCIL_BACK_PASS_DEPTH_FAIL, values, cache),
      getValue(GL.STENCIL_BACK_PASS_DEPTH_PASS, values, cache)
    )
};

// Setter functions intercepted for cache updates
export const GL_HOOKED_SETTERS = {
  // GENERIC SETTERS

  enable: (update, capability) =>
    update({
      [capability]: true
    }),
  disable: (update, capability) =>
    update({
      [capability]: false
    }),
  pixelStorei: (update, pname, value) =>
    update({
      [pname]: value
    }),
  hint: (update, pname, hint) =>
    update({
      [pname]: hint
    }),

  // SPECIFIC SETTERS

  bindFramebuffer: (update, target, framebuffer) => {
    switch (target) {
      case GL.FRAMEBUFFER:
        return update({
          [GL.DRAW_FRAMEBUFFER_BINDING]: framebuffer,
          [GL.READ_FRAMEBUFFER_BINDING]: framebuffer
        });
      case GL.DRAW_FRAMEBUFFER:
        return update({[GL.DRAW_FRAMEBUFFER_BINDING]: framebuffer});
      case GL.READ_FRAMEBUFFER:
        return update({[GL.READ_FRAMEBUFFER_BINDING]: framebuffer});
      default:
        return null;
    }
  },
  blendColor: (update, r, g, b, a) =>
    update({
      [GL.BLEND_COLOR]: new Float32Array([r, g, b, a])
    }),

  blendEquation: (update, mode) =>
    update({
      [GL.BLEND_EQUATION_RGB]: mode,
      [GL.BLEND_EQUATION_ALPHA]: mode
    }),

  blendEquationSeparate: (update, modeRGB, modeAlpha) =>
    update({
      [GL.BLEND_EQUATION_RGB]: modeRGB,
      [GL.BLEND_EQUATION_ALPHA]: modeAlpha
    }),

  blendFunc: (update, src, dst) =>
    update({
      [GL.BLEND_SRC_RGB]: src,
      [GL.BLEND_DST_RGB]: dst,
      [GL.BLEND_SRC_ALPHA]: src,
      [GL.BLEND_DST_ALPHA]: dst
    }),

  blendFuncSeparate: (update, srcRGB, dstRGB, srcAlpha, dstAlpha) =>
    update({
      [GL.BLEND_SRC_RGB]: srcRGB,
      [GL.BLEND_DST_RGB]: dstRGB,
      [GL.BLEND_SRC_ALPHA]: srcAlpha,
      [GL.BLEND_DST_ALPHA]: dstAlpha
    }),

  clearColor: (update, r, g, b, a) =>
    update({
      [GL.COLOR_CLEAR_VALUE]: new Float32Array([r, g, b, a])
    }),

  clearDepth: (update, depth) =>
    update({
      [GL.DEPTH_CLEAR_VALUE]: depth
    }),

  clearStencil: (update, s) =>
    update({
      [GL.STENCIL_CLEAR_VALUE]: s
    }),

  colorMask: (update, r, g, b, a) =>
    update({
      [GL.COLOR_WRITEMASK]: [r, g, b, a]
    }),

  cullFace: (update, mode) =>
    update({
      [GL.CULL_FACE_MODE]: mode
    }),

  depthFunc: (update, func) =>
    update({
      [GL.DEPTH_FUNC]: func
    }),

  depthRange: (update, zNear, zFar) =>
    update({
      [GL.DEPTH_RANGE]: new Float32Array([zNear, zFar])
    }),

  depthMask: (update, mask) =>
    update({
      [GL.DEPTH_WRITEMASK]: mask
    }),

  frontFace: (update, face) =>
    update({
      [GL.FRONT_FACE]: face
    }),

  lineWidth: (update, width) =>
    update({
      [GL.LINE_WIDTH]: width
    }),

  polygonOffset: (update, factor, units) =>
    update({
      [GL.POLYGON_OFFSET_FACTOR]: factor,
      [GL.POLYGON_OFFSET_UNITS]: units
    }),

  sampleCoverage: (update, value, invert) =>
    update({
      [GL.SAMPLE_COVERAGE_VALUE]: value,
      [GL.SAMPLE_COVERAGE_INVERT]: invert
    }),

  scissor: (update, x, y, width, height) =>
    update({
      [GL.SCISSOR_BOX]: new Int32Array([x, y, width, height])
    }),

  stencilMask: (update, mask) =>
    update({
      [GL.STENCIL_WRITEMASK]: mask,
      [GL.STENCIL_BACK_WRITEMASK]: mask
    }),

  stencilMaskSeparate: (update, face, mask) =>
    update({
      [face === GL.FRONT ? GL.STENCIL_WRITEMASK : GL.STENCIL_BACK_WRITEMASK]: mask
    }),

  stencilFunc: (update, func, ref, mask) =>
    update({
      [GL.STENCIL_FUNC]: func,
      [GL.STENCIL_REF]: ref,
      [GL.STENCIL_VALUE_MASK]: mask,
      [GL.STENCIL_BACK_FUNC]: func,
      [GL.STENCIL_BACK_REF]: ref,
      [GL.STENCIL_BACK_VALUE_MASK]: mask
    }),

  stencilFuncSeparate: (update, face, func, ref, mask) =>
    update({
      [face === GL.FRONT ? GL.STENCIL_FUNC : GL.STENCIL_BACK_FUNC]: func,
      [face === GL.FRONT ? GL.STENCIL_REF : GL.STENCIL_BACK_REF]: ref,
      [face === GL.FRONT ? GL.STENCIL_VALUE_MASK : GL.STENCIL_BACK_VALUE_MASK]: mask
    }),

  stencilOp: (update, fail, zfail, zpass) =>
    update({
      [GL.STENCIL_FAIL]: fail,
      [GL.STENCIL_PASS_DEPTH_FAIL]: zfail,
      [GL.STENCIL_PASS_DEPTH_PASS]: zpass,
      [GL.STENCIL_BACK_FAIL]: fail,
      [GL.STENCIL_BACK_PASS_DEPTH_FAIL]: zfail,
      [GL.STENCIL_BACK_PASS_DEPTH_PASS]: zpass
    }),

  stencilOpSeparate: (update, face, fail, zfail, zpass) =>
    update({
      [face === GL.FRONT ? GL.STENCIL_FAIL : GL.STENCIL_BACK_FAIL]: fail,
      [face === GL.FRONT ? GL.STENCIL_PASS_DEPTH_FAIL : GL.STENCIL_BACK_PASS_DEPTH_FAIL]: zfail,
      [face === GL.FRONT ? GL.STENCIL_PASS_DEPTH_PASS : GL.STENCIL_BACK_PASS_DEPTH_PASS]: zpass
    }),

  viewport: (update, x, y, width, height) =>
    update({
      [GL.VIEWPORT]: [x, y, width, height]
    })
};

// GETTER TABLE - FOR READING OUT AN ENTIRE CONTEXT

const isEnabled = (gl, key) => gl.isEnabled(key);

// Exceptions for any keys that cannot be queried by gl.getParameters
export const GL_PARAMETER_GETTERS = {
  [GL.BLEND]: isEnabled,
  [GL.CULL_FACE]: isEnabled,
  [GL.DEPTH_TEST]: isEnabled,
  [GL.DITHER]: isEnabled,
  [GL.POLYGON_OFFSET_FILL]: isEnabled,
  [GL.SAMPLE_ALPHA_TO_COVERAGE]: isEnabled,
  [GL.SAMPLE_COVERAGE]: isEnabled,
  [GL.SCISSOR_TEST]: isEnabled,
  [GL.STENCIL_TEST]: isEnabled,

  // WebGL 2
  [GL.RASTERIZER_DISCARD]: isEnabled
};
