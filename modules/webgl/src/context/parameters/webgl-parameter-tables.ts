// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Tables describing WebGL parameters
import {GL, GLParameters} from '@luma.gl/constants';

// DEFAULT SETTINGS - FOR FAST CACHE INITIALIZATION AND CONTEXT RESETS

/* eslint-disable no-shadow */

export const GL_PARAMETER_DEFAULTS: GLParameters = {
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
  [GL.CURRENT_PROGRAM]: null,
  // FRAMEBUFFER_BINDING and DRAW_FRAMEBUFFER_BINDING(WebGL2) refer same state.
  [GL.FRAMEBUFFER_BINDING]: null,
  [GL.RENDERBUFFER_BINDING]: null,
  [GL.VERTEX_ARRAY_BINDING]: null,
  [GL.ARRAY_BUFFER_BINDING]: null,
  [GL.FRONT_FACE]: GL.CCW,
  [GL.GENERATE_MIPMAP_HINT]: GL.DONT_CARE,
  [GL.LINE_WIDTH]: 1,
  [GL.POLYGON_OFFSET_FILL]: false,
  [GL.POLYGON_OFFSET_FACTOR]: 0,
  [GL.POLYGON_OFFSET_UNITS]: 0,
  [GL.SAMPLE_ALPHA_TO_COVERAGE]: false,
  [GL.SAMPLE_COVERAGE]: false,
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

  [GL.TRANSFORM_FEEDBACK_BINDING]: null,
  [GL.COPY_READ_BUFFER_BINDING]: null,
  [GL.COPY_WRITE_BUFFER_BINDING]: null,
  [GL.PIXEL_PACK_BUFFER_BINDING]: null,
  [GL.PIXEL_UNPACK_BUFFER_BINDING]: null,
  [GL.FRAGMENT_SHADER_DERIVATIVE_HINT]: GL.DONT_CARE,
  [GL.READ_FRAMEBUFFER_BINDING]: null,
  [GL.RASTERIZER_DISCARD]: false,

  [GL.PACK_ALIGNMENT]: 4,
  [GL.UNPACK_ALIGNMENT]: 4,
  [GL.UNPACK_FLIP_Y_WEBGL]: false,
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]: false,
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]: GL.BROWSER_DEFAULT_WEBGL,
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

const enable = (gl: WebGL2RenderingContext, value: unknown, key: GL) =>
  value ? gl.enable(key) : gl.disable(key);
const hint = (gl: WebGL2RenderingContext, value: GL, key: GL) => gl.hint(key, value);
const pixelStorei = (gl: WebGL2RenderingContext, value: number | boolean, key: GL) =>
  gl.pixelStorei(key, value);

const bindFramebuffer = (gl: WebGL2RenderingContext, value: unknown, key: GL) => {
  const target = key === GL.FRAMEBUFFER_BINDING ? GL.DRAW_FRAMEBUFFER : GL.READ_FRAMEBUFFER;
  return gl.bindFramebuffer(target, value as WebGLFramebuffer);
};

const bindBuffer = (gl: WebGL2RenderingContext, value: unknown, key: GL) => {
  const bindingMap: Partial<Record<GL, GL>> = {
    [GL.ARRAY_BUFFER_BINDING]: GL.ARRAY_BUFFER,
    [GL.COPY_READ_BUFFER_BINDING]: GL.COPY_READ_BUFFER,
    [GL.COPY_WRITE_BUFFER_BINDING]: GL.COPY_WRITE_BUFFER,
    [GL.PIXEL_PACK_BUFFER_BINDING]: GL.PIXEL_PACK_BUFFER,
    [GL.PIXEL_UNPACK_BUFFER_BINDING]: GL.PIXEL_UNPACK_BUFFER
  };
  const glTarget = bindingMap[key];

  gl.bindBuffer(glTarget as number, value as WebGLBuffer | null);
};

// Utility
function isArray(array: unknown): boolean {
  return Array.isArray(array) || (ArrayBuffer.isView(array) && !(array instanceof DataView));
}

// Map from WebGL parameter names to corresponding WebGL setter functions
// WegGL constants are read by parameter names, but set by function names
// NOTE: When value type is a string, it will be handled by 'GL_COMPOSITE_PARAMETER_SETTERS'
export const GL_PARAMETER_SETTERS = {
  [GL.BLEND]: enable,
  [GL.BLEND_COLOR]: (gl: WebGL2RenderingContext, value: [number, number, number, number]) =>
    gl.blendColor(...value),
  [GL.BLEND_EQUATION_RGB]: 'blendEquation',
  [GL.BLEND_EQUATION_ALPHA]: 'blendEquation',
  [GL.BLEND_SRC_RGB]: 'blendFunc',
  [GL.BLEND_DST_RGB]: 'blendFunc',
  [GL.BLEND_SRC_ALPHA]: 'blendFunc',
  [GL.BLEND_DST_ALPHA]: 'blendFunc',
  [GL.COLOR_CLEAR_VALUE]: (gl: WebGL2RenderingContext, value: [number, number, number, number]) =>
    gl.clearColor(...value),
  [GL.COLOR_WRITEMASK]: (gl: WebGL2RenderingContext, value: [boolean, boolean, boolean, boolean]) =>
    gl.colorMask(...value),
  [GL.CULL_FACE]: enable,
  [GL.CULL_FACE_MODE]: (gl: WebGL2RenderingContext, value) => gl.cullFace(value),
  [GL.DEPTH_TEST]: enable,
  [GL.DEPTH_CLEAR_VALUE]: (gl: WebGL2RenderingContext, value) => gl.clearDepth(value),
  [GL.DEPTH_FUNC]: (gl: WebGL2RenderingContext, value) => gl.depthFunc(value),
  [GL.DEPTH_RANGE]: (gl: WebGL2RenderingContext, value: [number, number]) =>
    gl.depthRange(...value),
  [GL.DEPTH_WRITEMASK]: (gl: WebGL2RenderingContext, value) => gl.depthMask(value),
  [GL.DITHER]: enable,
  [GL.FRAGMENT_SHADER_DERIVATIVE_HINT]: hint,

  [GL.CURRENT_PROGRAM]: (gl: WebGL2RenderingContext, value) => gl.useProgram(value),
  [GL.RENDERBUFFER_BINDING]: (gl: WebGL2RenderingContext, value) =>
    gl.bindRenderbuffer(GL.RENDERBUFFER, value),
  [GL.TRANSFORM_FEEDBACK_BINDING]: (gl: WebGL2RenderingContext, value) =>
    gl.bindTransformFeedback?.(GL.TRANSFORM_FEEDBACK, value),
  [GL.VERTEX_ARRAY_BINDING]: (gl: WebGL2RenderingContext, value) => gl.bindVertexArray(value),
  // NOTE: FRAMEBUFFER_BINDING and DRAW_FRAMEBUFFER_BINDING(WebGL2) refer same state.
  [GL.FRAMEBUFFER_BINDING]: bindFramebuffer,
  [GL.READ_FRAMEBUFFER_BINDING]: bindFramebuffer,

  // Buffers
  [GL.ARRAY_BUFFER_BINDING]: bindBuffer,
  [GL.COPY_READ_BUFFER_BINDING]: bindBuffer,
  [GL.COPY_WRITE_BUFFER_BINDING]: bindBuffer,
  [GL.PIXEL_PACK_BUFFER_BINDING]: bindBuffer,
  [GL.PIXEL_UNPACK_BUFFER_BINDING]: bindBuffer,

  [GL.FRONT_FACE]: (gl: WebGL2RenderingContext, value) => gl.frontFace(value),
  [GL.GENERATE_MIPMAP_HINT]: hint,
  [GL.LINE_WIDTH]: (gl: WebGL2RenderingContext, value) => gl.lineWidth(value),
  [GL.POLYGON_OFFSET_FILL]: enable,
  [GL.POLYGON_OFFSET_FACTOR]: 'polygonOffset',
  [GL.POLYGON_OFFSET_UNITS]: 'polygonOffset',
  [GL.RASTERIZER_DISCARD]: enable,
  [GL.SAMPLE_ALPHA_TO_COVERAGE]: enable,
  [GL.SAMPLE_COVERAGE]: enable,
  [GL.SAMPLE_COVERAGE_VALUE]: 'sampleCoverage',
  [GL.SAMPLE_COVERAGE_INVERT]: 'sampleCoverage',
  [GL.SCISSOR_TEST]: enable,
  [GL.SCISSOR_BOX]: (gl: WebGL2RenderingContext, value: [number, number, number, number]) =>
    gl.scissor(...value),
  [GL.STENCIL_TEST]: enable,
  [GL.STENCIL_CLEAR_VALUE]: (gl: WebGL2RenderingContext, value) => gl.clearStencil(value),
  [GL.STENCIL_WRITEMASK]: (gl: WebGL2RenderingContext, value) =>
    gl.stencilMaskSeparate(GL.FRONT, value),
  [GL.STENCIL_BACK_WRITEMASK]: (gl: WebGL2RenderingContext, value) =>
    gl.stencilMaskSeparate(GL.BACK, value),
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
  [GL.VIEWPORT]: (gl: WebGL2RenderingContext, value: [number, number, number, number]) =>
    gl.viewport(...value),

  // WEBGL2 EXTENSIONS

  // EXT_depth_clamp https://registry.khronos.org/webgl/extensions/EXT_depth_clamp/

  [GL.DEPTH_CLAMP_EXT]: enable,

  // WEBGL_provoking_vertex https://registry.khronos.org/webgl/extensions/WEBGL_provoking_vertex/

  // [GL.PROVOKING_VERTEX_WEBL]: TODO - extension function needed

  // WEBGL_polygon_mode https://registry.khronos.org/webgl/extensions/WEBGL_polygon_mode/

  // POLYGON_MODE_WEBGL  TODO - extension function needed
  [GL.POLYGON_OFFSET_LINE_WEBGL]: enable,

  // WEBGL_clip_cull_distance https://registry.khronos.org/webgl/extensions/WEBGL_clip_cull_distance/

  [GL.CLIP_DISTANCE0_WEBGL]: enable,
  [GL.CLIP_DISTANCE1_WEBGL]: enable,
  [GL.CLIP_DISTANCE2_WEBGL]: enable,
  [GL.CLIP_DISTANCE3_WEBGL]: enable,
  [GL.CLIP_DISTANCE4_WEBGL]: enable,
  [GL.CLIP_DISTANCE5_WEBGL]: enable,
  [GL.CLIP_DISTANCE6_WEBGL]: enable,
  [GL.CLIP_DISTANCE7_WEBGL]: enable,

  // PIXEL PACK/UNPACK MODES
  [GL.PACK_ALIGNMENT]: pixelStorei,
  [GL.UNPACK_ALIGNMENT]: pixelStorei,
  [GL.UNPACK_FLIP_Y_WEBGL]: pixelStorei,
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]: pixelStorei,
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]: pixelStorei,
  [GL.PACK_ROW_LENGTH]: pixelStorei,
  [GL.PACK_SKIP_PIXELS]: pixelStorei,
  [GL.PACK_SKIP_ROWS]: pixelStorei,
  [GL.UNPACK_ROW_LENGTH]: pixelStorei,
  [GL.UNPACK_IMAGE_HEIGHT]: pixelStorei,
  [GL.UNPACK_SKIP_PIXELS]: pixelStorei,
  [GL.UNPACK_SKIP_ROWS]: pixelStorei,
  [GL.UNPACK_SKIP_IMAGES]: pixelStorei,

  // Function-style setters
  framebuffer: (gl: WebGL2RenderingContext, framebuffer) => {
    // accepts 1) a WebGLFramebuffer 2) null (default framebuffer), or 3) luma.gl Framebuffer class
    // framebuffer is null when restoring to default framebuffer, otherwise use the WebGL handle.
    const handle = framebuffer && 'handle' in framebuffer ? framebuffer.handle : framebuffer;
    return gl.bindFramebuffer(GL.FRAMEBUFFER, handle);
  },
  blend: (gl: WebGL2RenderingContext, value) =>
    value ? gl.enable(GL.BLEND) : gl.disable(GL.BLEND),
  blendColor: (gl: WebGL2RenderingContext, value: [number, number, number, number]) =>
    gl.blendColor(...value),
  blendEquation: (gl: WebGL2RenderingContext, args: number | [number, number]) => {
    const separateModes = typeof args === 'number' ? ([args, args] as [number, number]) : args;
    gl.blendEquationSeparate(...separateModes);
  },
  blendFunc: (
    gl: WebGL2RenderingContext,
    args: [number, number] | [number, number, number, number]
  ) => {
    const separateFuncs =
      args?.length === 2 ? ([...args, ...args] as [number, number, number, number]) : args;
    gl.blendFuncSeparate(...separateFuncs);
  },

  clearColor: (gl: WebGL2RenderingContext, value: [number, number, number, number]) =>
    gl.clearColor(...value),
  clearDepth: (gl: WebGL2RenderingContext, value) => gl.clearDepth(value),
  clearStencil: (gl: WebGL2RenderingContext, value) => gl.clearStencil(value),

  colorMask: (gl: WebGL2RenderingContext, value: [boolean, boolean, boolean, boolean]) =>
    gl.colorMask(...value),

  cull: (gl: WebGL2RenderingContext, value) =>
    value ? gl.enable(GL.CULL_FACE) : gl.disable(GL.CULL_FACE),
  cullFace: (gl: WebGL2RenderingContext, value) => gl.cullFace(value),

  depthTest: (gl: WebGL2RenderingContext, value) =>
    value ? gl.enable(GL.DEPTH_TEST) : gl.disable(GL.DEPTH_TEST),
  depthFunc: (gl: WebGL2RenderingContext, value) => gl.depthFunc(value),
  depthMask: (gl: WebGL2RenderingContext, value) => gl.depthMask(value),
  depthRange: (gl: WebGL2RenderingContext, value: [number, number]) => gl.depthRange(...value),

  dither: (gl: WebGL2RenderingContext, value) =>
    value ? gl.enable(GL.DITHER) : gl.disable(GL.DITHER),

  derivativeHint: (gl: WebGL2RenderingContext, value) => {
    // gl1: 'OES_standard_derivatives'
    gl.hint(GL.FRAGMENT_SHADER_DERIVATIVE_HINT, value);
  },

  frontFace: (gl: WebGL2RenderingContext, value) => gl.frontFace(value),

  mipmapHint: (gl: WebGL2RenderingContext, value) => gl.hint(GL.GENERATE_MIPMAP_HINT, value),

  lineWidth: (gl: WebGL2RenderingContext, value) => gl.lineWidth(value),

  polygonOffsetFill: (gl: WebGL2RenderingContext, value) =>
    value ? gl.enable(GL.POLYGON_OFFSET_FILL) : gl.disable(GL.POLYGON_OFFSET_FILL),
  polygonOffset: (gl: WebGL2RenderingContext, value: [number, number]) =>
    gl.polygonOffset(...value),

  sampleCoverage: (gl: WebGL2RenderingContext, value: [number, boolean?]) =>
    gl.sampleCoverage(value[0], value[1] || false),

  scissorTest: (gl: WebGL2RenderingContext, value) =>
    value ? gl.enable(GL.SCISSOR_TEST) : gl.disable(GL.SCISSOR_TEST),
  scissor: (gl: WebGL2RenderingContext, value: [number, number, number, number]) =>
    gl.scissor(...value),

  stencilTest: (gl: WebGL2RenderingContext, value) =>
    value ? gl.enable(GL.STENCIL_TEST) : gl.disable(GL.STENCIL_TEST),
  stencilMask: (gl: WebGL2RenderingContext, value) => {
    value = isArray(value) ? value : [value, value];
    const [mask, backMask] = value;
    gl.stencilMaskSeparate(GL.FRONT, mask);
    gl.stencilMaskSeparate(GL.BACK, backMask);
  },
  stencilFunc: (gl: WebGL2RenderingContext, args) => {
    args = isArray(args) && args.length === 3 ? [...args, ...args] : args;
    const [func, ref, mask, backFunc, backRef, backMask] = args;
    gl.stencilFuncSeparate(GL.FRONT, func, ref, mask);
    gl.stencilFuncSeparate(GL.BACK, backFunc, backRef, backMask);
  },
  stencilOp: (gl: WebGL2RenderingContext, args) => {
    args = isArray(args) && args.length === 3 ? [...args, ...args] : args;
    const [sfail, dpfail, dppass, backSfail, backDpfail, backDppass] = args;
    gl.stencilOpSeparate(GL.FRONT, sfail, dpfail, dppass);
    gl.stencilOpSeparate(GL.BACK, backSfail, backDpfail, backDppass);
  },

  viewport: (gl: WebGL2RenderingContext, value: [number, number, number, number]) =>
    gl.viewport(...value)
};

function getValue(glEnum, values, cache) {
  return values[glEnum] !== undefined ? values[glEnum] : cache[glEnum];
}

// COMPOSITE_WEBGL_PARAMETER_
export const GL_COMPOSITE_PARAMETER_SETTERS = {
  blendEquation: (gl: WebGL2RenderingContext, values, cache) =>
    gl.blendEquationSeparate(
      getValue(GL.BLEND_EQUATION_RGB, values, cache),
      getValue(GL.BLEND_EQUATION_ALPHA, values, cache)
    ),
  blendFunc: (gl: WebGL2RenderingContext, values, cache) =>
    gl.blendFuncSeparate(
      getValue(GL.BLEND_SRC_RGB, values, cache),
      getValue(GL.BLEND_DST_RGB, values, cache),
      getValue(GL.BLEND_SRC_ALPHA, values, cache),
      getValue(GL.BLEND_DST_ALPHA, values, cache)
    ),
  polygonOffset: (gl: WebGL2RenderingContext, values, cache) =>
    gl.polygonOffset(
      getValue(GL.POLYGON_OFFSET_FACTOR, values, cache),
      getValue(GL.POLYGON_OFFSET_UNITS, values, cache)
    ),
  sampleCoverage: (gl: WebGL2RenderingContext, values, cache) =>
    gl.sampleCoverage(
      getValue(GL.SAMPLE_COVERAGE_VALUE, values, cache),
      getValue(GL.SAMPLE_COVERAGE_INVERT, values, cache)
    ),
  stencilFuncFront: (gl: WebGL2RenderingContext, values, cache) =>
    gl.stencilFuncSeparate(
      GL.FRONT,
      getValue(GL.STENCIL_FUNC, values, cache),
      getValue(GL.STENCIL_REF, values, cache),
      getValue(GL.STENCIL_VALUE_MASK, values, cache)
    ),
  stencilFuncBack: (gl: WebGL2RenderingContext, values, cache) =>
    gl.stencilFuncSeparate(
      GL.BACK,
      getValue(GL.STENCIL_BACK_FUNC, values, cache),
      getValue(GL.STENCIL_BACK_REF, values, cache),
      getValue(GL.STENCIL_BACK_VALUE_MASK, values, cache)
    ),
  stencilOpFront: (gl: WebGL2RenderingContext, values, cache) =>
    gl.stencilOpSeparate(
      GL.FRONT,
      getValue(GL.STENCIL_FAIL, values, cache),
      getValue(GL.STENCIL_PASS_DEPTH_FAIL, values, cache),
      getValue(GL.STENCIL_PASS_DEPTH_PASS, values, cache)
    ),
  stencilOpBack: (gl: WebGL2RenderingContext, values, cache) =>
    gl.stencilOpSeparate(
      GL.BACK,
      getValue(GL.STENCIL_BACK_FAIL, values, cache),
      getValue(GL.STENCIL_BACK_PASS_DEPTH_FAIL, values, cache),
      getValue(GL.STENCIL_BACK_PASS_DEPTH_PASS, values, cache)
    )
};

type UpdateFunc = (params: Record<string, any>) => void;

// Setter functions intercepted for cache updates
export const GL_HOOKED_SETTERS = {
  // GENERIC SETTERS

  enable: (update: UpdateFunc, capability: GL) =>
    update({
      [capability]: true
    }),
  disable: (update: UpdateFunc, capability: GL) =>
    update({
      [capability]: false
    }),
  pixelStorei: (update: UpdateFunc, pname: GL, value) =>
    update({
      [pname]: value
    }),
  hint: (update: UpdateFunc, pname: GL, value: GL) =>
    update({
      [pname]: value
    }),

  // SPECIFIC SETTERS
  useProgram: (update: UpdateFunc, value) =>
    update({
      [GL.CURRENT_PROGRAM]: value
    }),
  bindRenderbuffer: (update: UpdateFunc, target, value) =>
    update({
      [GL.RENDERBUFFER_BINDING]: value
    }),
  bindTransformFeedback: (update: UpdateFunc, target, value) =>
    update({
      [GL.TRANSFORM_FEEDBACK_BINDING]: value
    }),
  bindVertexArray: (update: UpdateFunc, value) =>
    update({
      [GL.VERTEX_ARRAY_BINDING]: value
    }),

  bindFramebuffer: (update: UpdateFunc, target, framebuffer) => {
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
  bindBuffer: (update: UpdateFunc, target, buffer) => {
    const pname = {
      [GL.ARRAY_BUFFER]: [GL.ARRAY_BUFFER_BINDING],
      [GL.COPY_READ_BUFFER]: [GL.COPY_READ_BUFFER_BINDING],
      [GL.COPY_WRITE_BUFFER]: [GL.COPY_WRITE_BUFFER_BINDING],
      [GL.PIXEL_PACK_BUFFER]: [GL.PIXEL_PACK_BUFFER_BINDING],
      [GL.PIXEL_UNPACK_BUFFER]: [GL.PIXEL_UNPACK_BUFFER_BINDING]
    }[target];

    if (pname) {
      return update({[pname]: buffer});
    }
    // targets that should not be cached
    return {valueChanged: true};
  },

  blendColor: (update: UpdateFunc, r: number, g: number, b: number, a: number) =>
    update({
      [GL.BLEND_COLOR]: new Float32Array([r, g, b, a])
    }),

  blendEquation: (update: UpdateFunc, mode) =>
    update({
      [GL.BLEND_EQUATION_RGB]: mode,
      [GL.BLEND_EQUATION_ALPHA]: mode
    }),

  blendEquationSeparate: (update: UpdateFunc, modeRGB, modeAlpha) =>
    update({
      [GL.BLEND_EQUATION_RGB]: modeRGB,
      [GL.BLEND_EQUATION_ALPHA]: modeAlpha
    }),

  blendFunc: (update: UpdateFunc, src, dst) =>
    update({
      [GL.BLEND_SRC_RGB]: src,
      [GL.BLEND_DST_RGB]: dst,
      [GL.BLEND_SRC_ALPHA]: src,
      [GL.BLEND_DST_ALPHA]: dst
    }),

  blendFuncSeparate: (update: UpdateFunc, srcRGB, dstRGB, srcAlpha, dstAlpha) =>
    update({
      [GL.BLEND_SRC_RGB]: srcRGB,
      [GL.BLEND_DST_RGB]: dstRGB,
      [GL.BLEND_SRC_ALPHA]: srcAlpha,
      [GL.BLEND_DST_ALPHA]: dstAlpha
    }),

  clearColor: (update: UpdateFunc, r: number, g: number, b: number, a: number) =>
    update({
      [GL.COLOR_CLEAR_VALUE]: new Float32Array([r, g, b, a])
    }),

  clearDepth: (update: UpdateFunc, depth: number) =>
    update({
      [GL.DEPTH_CLEAR_VALUE]: depth
    }),

  clearStencil: (update: UpdateFunc, s: number) =>
    update({
      [GL.STENCIL_CLEAR_VALUE]: s
    }),

  colorMask: (update: UpdateFunc, r: number, g: number, b: number, a: number) =>
    update({
      [GL.COLOR_WRITEMASK]: [r, g, b, a]
    }),

  cullFace: (update: UpdateFunc, mode) =>
    update({
      [GL.CULL_FACE_MODE]: mode
    }),

  depthFunc: (update: UpdateFunc, func) =>
    update({
      [GL.DEPTH_FUNC]: func
    }),

  depthRange: (update: UpdateFunc, zNear: number, zFar: number) =>
    update({
      [GL.DEPTH_RANGE]: new Float32Array([zNear, zFar])
    }),

  depthMask: (update: UpdateFunc, mask: number) =>
    update({
      [GL.DEPTH_WRITEMASK]: mask
    }),

  frontFace: (update: UpdateFunc, face) =>
    update({
      [GL.FRONT_FACE]: face
    }),

  lineWidth: (update: UpdateFunc, width) =>
    update({
      [GL.LINE_WIDTH]: width
    }),

  polygonOffset: (update: UpdateFunc, factor, units) =>
    update({
      [GL.POLYGON_OFFSET_FACTOR]: factor,
      [GL.POLYGON_OFFSET_UNITS]: units
    }),

  sampleCoverage: (update: UpdateFunc, value, invert) =>
    update({
      [GL.SAMPLE_COVERAGE_VALUE]: value,
      [GL.SAMPLE_COVERAGE_INVERT]: invert
    }),

  scissor: (update: UpdateFunc, x, y, width, height) =>
    update({
      [GL.SCISSOR_BOX]: new Int32Array([x, y, width, height])
    }),

  stencilMask: (update: UpdateFunc, mask) =>
    update({
      [GL.STENCIL_WRITEMASK]: mask,
      [GL.STENCIL_BACK_WRITEMASK]: mask
    }),

  stencilMaskSeparate: (update: UpdateFunc, face, mask) =>
    update({
      [face === GL.FRONT ? GL.STENCIL_WRITEMASK : GL.STENCIL_BACK_WRITEMASK]: mask
    }),

  stencilFunc: (update: UpdateFunc, func, ref, mask) =>
    update({
      [GL.STENCIL_FUNC]: func,
      [GL.STENCIL_REF]: ref,
      [GL.STENCIL_VALUE_MASK]: mask,
      [GL.STENCIL_BACK_FUNC]: func,
      [GL.STENCIL_BACK_REF]: ref,
      [GL.STENCIL_BACK_VALUE_MASK]: mask
    }),

  stencilFuncSeparate: (update: UpdateFunc, face, func, ref, mask) =>
    update({
      [face === GL.FRONT ? GL.STENCIL_FUNC : GL.STENCIL_BACK_FUNC]: func,
      [face === GL.FRONT ? GL.STENCIL_REF : GL.STENCIL_BACK_REF]: ref,
      [face === GL.FRONT ? GL.STENCIL_VALUE_MASK : GL.STENCIL_BACK_VALUE_MASK]: mask
    }),

  stencilOp: (update: UpdateFunc, fail, zfail, zpass) =>
    update({
      [GL.STENCIL_FAIL]: fail,
      [GL.STENCIL_PASS_DEPTH_FAIL]: zfail,
      [GL.STENCIL_PASS_DEPTH_PASS]: zpass,
      [GL.STENCIL_BACK_FAIL]: fail,
      [GL.STENCIL_BACK_PASS_DEPTH_FAIL]: zfail,
      [GL.STENCIL_BACK_PASS_DEPTH_PASS]: zpass
    }),

  stencilOpSeparate: (update: UpdateFunc, face, fail, zfail, zpass) =>
    update({
      [face === GL.FRONT ? GL.STENCIL_FAIL : GL.STENCIL_BACK_FAIL]: fail,
      [face === GL.FRONT ? GL.STENCIL_PASS_DEPTH_FAIL : GL.STENCIL_BACK_PASS_DEPTH_FAIL]: zfail,
      [face === GL.FRONT ? GL.STENCIL_PASS_DEPTH_PASS : GL.STENCIL_BACK_PASS_DEPTH_PASS]: zpass
    }),

  viewport: (update: UpdateFunc, x, y, width, height) =>
    update({
      [GL.VIEWPORT]: [x, y, width, height]
    })
};

// GETTER TABLE - FOR READING OUT AN ENTIRE CONTEXT

const isEnabled = (gl: WebGL2RenderingContext, key) => gl.isEnabled(key);

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
  [GL.RASTERIZER_DISCARD]: isEnabled
};

export const NON_CACHE_PARAMETERS = new Set([
  // setter not intercepted
  GL.ACTIVE_TEXTURE,
  GL.TRANSFORM_FEEDBACK_ACTIVE,
  GL.TRANSFORM_FEEDBACK_PAUSED,

  // setters bindBufferRange/bindBufferBase cannot be pruned based on cache
  GL.TRANSFORM_FEEDBACK_BUFFER_BINDING,
  GL.UNIFORM_BUFFER_BINDING,

  // states depending on VERTEX_ARRAY_BINDING
  GL.ELEMENT_ARRAY_BUFFER_BINDING,
  // states depending on READ_FRAMEBUFFER_BINDING
  GL.IMPLEMENTATION_COLOR_READ_FORMAT,
  GL.IMPLEMENTATION_COLOR_READ_TYPE,
  // states depending on FRAMEBUFFER_BINDING
  GL.READ_BUFFER,
  GL.DRAW_BUFFER0,
  GL.DRAW_BUFFER1,
  GL.DRAW_BUFFER2,
  GL.DRAW_BUFFER3,
  GL.DRAW_BUFFER4,
  GL.DRAW_BUFFER5,
  GL.DRAW_BUFFER6,
  GL.DRAW_BUFFER7,
  GL.DRAW_BUFFER8,
  GL.DRAW_BUFFER9,
  GL.DRAW_BUFFER10,
  GL.DRAW_BUFFER11,
  GL.DRAW_BUFFER12,
  GL.DRAW_BUFFER13,
  GL.DRAW_BUFFER14,
  GL.DRAW_BUFFER15,
  // states depending on ACTIVE_TEXTURE
  GL.SAMPLER_BINDING,
  GL.TEXTURE_BINDING_2D,
  GL.TEXTURE_BINDING_2D_ARRAY,
  GL.TEXTURE_BINDING_3D,
  GL.TEXTURE_BINDING_CUBE_MAP
]);
