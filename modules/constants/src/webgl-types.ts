// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import {GL} from './webgl-constants';

/** Type covering all typed arrays and classic arrays consisting of numbers */
export type NumberArray = number[] | TypedArray;
/** Type covering all typed arrays and classic arrays consisting of numbers */
export type NumericArray = TypedArray | number[];

/** TypeScript type covering all typed arrays */
export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array;

/** type covering all typed arrays and classic arrays consisting of numbers */

/** We don't know the type of Framebuffer at this stage */
type Framebuffer = unknown;

/** Rendering primitives. Constants passed to drawElements() or drawArrays() to specify what kind of primitive to render. */
export type GLPrimitiveTopology =
  | GL.POINTS
  | GL.LINES
  | GL.LINE_STRIP
  | GL.LINE_LOOP
  | GL.TRIANGLES
  | GL.TRIANGLE_STRIP
  | GL.TRIANGLE_FAN;

/** Rendering primitives. Constants passed to transform feedback  . */
export type GLPrimitive = GL.POINTS | GL.LINES | GL.TRIANGLES;

/** Data Type */
export type GLDataType =
  | GL.FLOAT
  | GL.UNSIGNED_SHORT
  | GL.UNSIGNED_INT
  | GL.UNSIGNED_BYTE
  | GL.BYTE
  | GL.SHORT
  | GL.INT;

/** Pixel Type */
export type GLPixelType =
  | GL.UNSIGNED_BYTE
  | GL.UNSIGNED_SHORT_5_6_5
  | GL.UNSIGNED_SHORT_4_4_4_4
  | GL.UNSIGNED_SHORT_5_5_5_1;

/** Uniform Type */
export type GLUniformType = GLSamplerType | GLCompositeType;

/**
 * Sampler uniform type
 * @note These are all the valid sampler types used with `gl.uniform1i((location, value)`
 */
export type GLSamplerType =
  | GL.SAMPLER_2D
  | GL.SAMPLER_CUBE
  | GL.SAMPLER_3D
  | GL.SAMPLER_2D_SHADOW
  | GL.SAMPLER_2D_ARRAY
  | GL.SAMPLER_2D_ARRAY_SHADOW
  | GL.SAMPLER_CUBE_SHADOW
  | GL.INT_SAMPLER_2D
  | GL.INT_SAMPLER_3D
  | GL.INT_SAMPLER_CUBE
  | GL.INT_SAMPLER_2D_ARRAY
  | GL.UNSIGNED_INT_SAMPLER_2D
  | GL.UNSIGNED_INT_SAMPLER_3D
  | GL.UNSIGNED_INT_SAMPLER_CUBE
  | GL.UNSIGNED_INT_SAMPLER_2D_ARRAY;

/**
 * Composite types table
 * @note These are all the valid non-sampler uniform types,
 * Different `gl.uniformXXX(location, value)` functions must be used depending on which composite type is being set.
 */
export type GLCompositeType =
  | GL.FLOAT
  | GL.FLOAT_VEC2
  | GL.FLOAT_VEC3
  | GL.FLOAT_VEC4
  | GL.INT
  | GL.INT_VEC2
  | GL.INT_VEC3
  | GL.INT_VEC4
  | GL.UNSIGNED_INT
  | GL.UNSIGNED_INT_VEC2
  | GL.UNSIGNED_INT_VEC3
  | GL.UNSIGNED_INT_VEC4
  | GL.BOOL
  | GL.BOOL_VEC2
  | GL.BOOL_VEC3
  | GL.BOOL_VEC4
  | GL.FLOAT_MAT2
  | GL.FLOAT_MAT2x3
  | GL.FLOAT_MAT2x4
  | GL.FLOAT_MAT3x2
  | GL.FLOAT_MAT3
  | GL.FLOAT_MAT3x4
  | GL.FLOAT_MAT4x2
  | GL.FLOAT_MAT4x3
  | GL.FLOAT_MAT4;

/**
 * Depth or stencil tests
 * Constants passed to WebGLRenderingContext.depthFunc() or WebGLRenderingContext.stencilFunc().
 */
export type GLFunction =
  | GL.NEVER
  | GL.LESS
  | GL.EQUAL
  | GL.LEQUAL
  | GL.GREATER
  | GL.NOTEQUAL
  | GL.GEQUAL
  | GL.ALWAYS;

export type GLBlendEquation =
  | GL.FUNC_ADD
  | GL.FUNC_SUBTRACT
  | GL.FUNC_REVERSE_SUBTRACT
  | GL.MIN_EXT
  | GL.MAX_EXT;

export type GLBlendFunction =
  | GL.ZERO
  | GL.ONE
  | GL.SRC_COLOR
  | GL.ONE_MINUS_SRC_COLOR
  | GL.DST_COLOR
  | GL.ONE_MINUS_DST_COLOR
  | GL.SRC_ALPHA
  | GL.ONE_MINUS_SRC_ALPHA
  | GL.DST_ALPHA
  | GL.ONE_MINUS_DST_ALPHA
  | GL.CONSTANT_COLOR
  | GL.ONE_MINUS_CONSTANT_COLOR
  | GL.CONSTANT_ALPHA
  | GL.ONE_MINUS_CONSTANT_ALPHA
  | GL.SRC_ALPHA_SATURATE;

/**
 * Stencil actions
 * Constants passed to WebGLRenderingContext.stencilOp().
 */
export type GLStencilOp =
  | GL.KEEP
  | GL.ZERO
  | GL.REPLACE
  | GL.INCR
  | GL.INCR_WRAP
  | GL.DECR
  | GL.DECR_WRAP
  | GL.INVERT;

/** Parameters for textures and samplers */
export type GLSamplerParameters = {
  /** Sets the wrap parameter for texture coordinate  to either GL_CLAMP_TO_EDGE, GL_MIRRORED_REPEAT, or GL_REPEAT. */
  [GL.TEXTURE_WRAP_S]?: GL.CLAMP_TO_EDGE | GL.REPEAT | GL.MIRRORED_REPEAT;
  /** Sets the wrap parameter for texture coordinate  to either GL_CLAMP_TO_EDGE, GL_MIRRORED_REPEAT, or GL_REPEAT. */
  [GL.TEXTURE_WRAP_T]?: GL.CLAMP_TO_EDGE | GL.REPEAT | GL.MIRRORED_REPEAT;
  /** Sets the wrap parameter for texture coordinate  to either GL_CLAMP_TO_EDGE, GL_MIRRORED_REPEAT, or GL_REPEAT. */
  [GL.TEXTURE_WRAP_R]?: GL.CLAMP_TO_EDGE | GL.REPEAT | GL.MIRRORED_REPEAT;

  /** The texture magnification function is used when the pixel being textured maps to an area less than or equal to one texture element. It sets the texture magnification function to either GL_NEAREST or GL_LINEAR (see below). GL_NEAREST is generally faster than GL_LINEAR, but it can produce textured images with sharper edges because the transition between texture elements is not as smooth. Default: GL_LINEAR.  */
  [GL.TEXTURE_MAG_FILTER]?: GL.NEAREST | GL.LINEAR;
  /** The texture minifying function is used whenever the pixel being textured maps to an area greater than one texture element. There are six defined minifying functions. Two of them use the nearest one or nearest four texture elements to compute the texture value. The other four use mipmaps. Default: GL_NEAREST_MIPMAP_LINEAR */
  [GL.TEXTURE_MIN_FILTER]?:
    | GL.NEAREST
    | GL.LINEAR
    | GL.NEAREST_MIPMAP_NEAREST
    | GL.NEAREST_MIPMAP_LINEAR
    | GL.LINEAR_MIPMAP_NEAREST
    | GL.LINEAR_MIPMAP_LINEAR;
  /* A GLfloat indicating the minimum level-of-detail mipmap. */
  [GL.TEXTURE_MIN_LOD]?: number;
  /* A GLfloat indicating the minimum level-of-detail mipmap. */
  [GL.TEXTURE_MAX_LOD]?: number;
  /** Texture parameter TEXTURE_COMPARE_FUNC specifies the depth texture comparison function */
  [GL.TEXTURE_COMPARE_FUNC]?: number; // COMPARE_FUNC);
  /** Texture parameter TEXTURE_COMPARE_MODE specifies the depth texture comparison operands. */
  [GL.TEXTURE_COMPARE_MODE]?: GL.COMPARE_REF_TO_TEXTURE;
  /** Max anisotropy level */
  [GL.TEXTURE_MAX_ANISOTROPY_EXT]?: number;
};

/**
 * All global WebGL parameters
 */
export type GLValueParameters = {
  [GL.BLEND]?: boolean;
  [GL.BLEND_COLOR]?: [number, number, number, number] | NumberArray;
  [GL.BLEND_EQUATION_RGB]?: GLBlendEquation;
  [GL.BLEND_EQUATION_ALPHA]?: GLBlendEquation;
  [GL.BLEND_SRC_RGB]?: GLBlendFunction;
  [GL.BLEND_DST_RGB]?: GLBlendFunction;
  [GL.BLEND_SRC_ALPHA]?: GLBlendFunction;
  [GL.BLEND_DST_ALPHA]?: GLBlendFunction;
  [GL.COLOR_CLEAR_VALUE]?: [number, number, number, number] | NumberArray;
  [GL.COLOR_WRITEMASK]?: [boolean, boolean, boolean, boolean] | boolean[];
  [GL.CULL_FACE]?: boolean;
  [GL.CULL_FACE_MODE]?: GL.FRONT | GL.BACK | GL.FRONT_AND_BACK;
  [GL.DEPTH_TEST]?: boolean;
  [GL.DEPTH_CLEAR_VALUE]?: number;
  [GL.DEPTH_FUNC]?: GLFunction;
  [GL.DEPTH_RANGE]?: [number, number] | NumberArray;
  [GL.DEPTH_WRITEMASK]?: boolean;
  [GL.DITHER]?: boolean;
  [GL.FRAGMENT_SHADER_DERIVATIVE_HINT]?: GL.FASTEST | GL.NICEST | GL.DONT_CARE;
  [GL.CURRENT_PROGRAM]?: WebGLProgram | null;
  [GL.FRAMEBUFFER_BINDING]?: WebGLFramebuffer | null;
  [GL.RENDERBUFFER_BINDING]?: WebGLRenderbuffer | null;
  [GL.TRANSFORM_FEEDBACK_BINDING]?: WebGLTransformFeedback | null;
  [GL.VERTEX_ARRAY_BINDING]?: WebGLVertexArrayObject | null;
  [GL.ARRAY_BUFFER_BINDING]?: WebGLBuffer | null;
  [GL.COPY_READ_BUFFER_BINDING]?: WebGLBuffer | null;
  [GL.COPY_WRITE_BUFFER_BINDING]?: WebGLBuffer | null;
  [GL.PIXEL_PACK_BUFFER_BINDING]?: WebGLBuffer | null;
  [GL.PIXEL_UNPACK_BUFFER_BINDING]?: WebGLBuffer | null;
  [GL.TEXTURE_BINDING_2D]?: WebGLTexture | null;
  [GL.TEXTURE_BINDING_2D_ARRAY]?: WebGLTexture | null;
  [GL.TEXTURE_BINDING_3D]?: WebGLTexture | null;
  [GL.TEXTURE_BINDING_CUBE_MAP]?: WebGLTexture | null;
  [GL.FRONT_FACE]?: GL.CW | GL.CCW;
  [GL.GENERATE_MIPMAP_HINT]?: GL.FASTEST | GL.NICEST | GL.DONT_CARE;
  [GL.LINE_WIDTH]?: number;
  [GL.POLYGON_OFFSET_FILL]?: boolean;
  [GL.POLYGON_OFFSET_FACTOR]?: number;
  [GL.POLYGON_OFFSET_UNITS]?: number;
  [GL.SAMPLE_ALPHA_TO_COVERAGE]?: boolean;
  [GL.SAMPLE_COVERAGE]?: boolean;
  [GL.RASTERIZER_DISCARD]?: boolean;
  [GL.SAMPLE_COVERAGE_VALUE]?: number;
  [GL.SAMPLE_COVERAGE_INVERT]?: boolean;
  [GL.SCISSOR_TEST]?: boolean;
  [GL.SCISSOR_BOX]?: [number, number, number, number] | NumberArray;
  [GL.STENCIL_TEST]?: boolean;
  [GL.STENCIL_CLEAR_VALUE]?: number;
  [GL.STENCIL_WRITEMASK]?: number;
  [GL.STENCIL_BACK_WRITEMASK]?: number;
  [GL.STENCIL_FUNC]?: GLFunction;
  [GL.STENCIL_REF]?: number;
  [GL.STENCIL_VALUE_MASK]?: number;
  [GL.STENCIL_BACK_FUNC]?: GLFunction;
  [GL.STENCIL_BACK_REF]?: number;
  [GL.STENCIL_BACK_VALUE_MASK]?: number;
  [GL.STENCIL_FAIL]?: GLStencilOp;
  [GL.STENCIL_PASS_DEPTH_FAIL]?: GLStencilOp;
  [GL.STENCIL_PASS_DEPTH_PASS]?: GLStencilOp;
  [GL.STENCIL_BACK_FAIL]?: GLStencilOp;
  [GL.STENCIL_BACK_PASS_DEPTH_FAIL]?: GLStencilOp;
  [GL.STENCIL_BACK_PASS_DEPTH_PASS]?: GLStencilOp;
  [GL.VIEWPORT]?: [number, number, number, number] | NumberArray;

  // WEBGL1 PIXEL PACK/UNPACK MODES
  [GL.PACK_ALIGNMENT]?: number;
  [GL.UNPACK_ALIGNMENT]?: number;
  [GL.UNPACK_FLIP_Y_WEBGL]?: boolean;
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]?: boolean;
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]?: GL.NONE | GL.BROWSER_DEFAULT_WEBGL;

  // WEBGL2 PIXEL PACK/UNPACK MODES
  // RASTERIZER_DISCARD ...
  [GL.PACK_ROW_LENGTH]?: number;
  [GL.PACK_SKIP_PIXELS]?: number;
  [GL.PACK_SKIP_ROWS]?: number;
  [GL.READ_FRAMEBUFFER_BINDING]?: Framebuffer | null;
  [GL.UNPACK_ROW_LENGTH]?: number;
  [GL.UNPACK_IMAGE_HEIGHT]?: number;
  [GL.UNPACK_SKIP_PIXELS]?: number;
  [GL.UNPACK_SKIP_ROWS]?: number;
  [GL.UNPACK_SKIP_IMAGES]?: number;
};

/**
 * Function style WebGL parameters used by luma.gl
 * @todo Should perhaps be defined in webgl module
 */
export type GLFunctionParameters = {
  // Function-style setters
  framebuffer?: Framebuffer | null;
  blend?: boolean;
  blendColor?: [number, number, number, number] | NumberArray;
  blendEquation?: GLBlendEquation | [GLBlendEquation, GLBlendEquation];
  /* defines which function is used for blending pixel arithmetic. Defaults to one and zero */
  blendFunc?:
    | [GLBlendFunction, GLBlendFunction]
    | [GLBlendFunction, GLBlendFunction, GLBlendFunction, GLBlendFunction];

  clearColor?: [number, number, number, number] | NumberArray;
  clearDepth?: number;
  clearStencil?: number;

  colorMask?: [boolean, boolean, boolean, boolean] | boolean[];

  cull?: boolean;
  cullFace?: GL.FRONT | GL.BACK | GL.FRONT_AND_BACK;

  depthTest?: boolean;
  depthFunc?: GLFunction;
  /** Specifies whether writing into the depth buffer is enabled. Default true, i.e. writing is enabled. */
  depthMask?: boolean;
  depthRange?: [number, number] | NumberArray;

  dither?: boolean;

  derivativeHint?: GL.FASTEST | GL.NICEST | GL.DONT_CARE;

  frontFace?: GL.CW | GL.CCW;

  mipmapHint?: GL.FASTEST | GL.NICEST | GL.DONT_CARE;

  lineWidth?: number;

  polygonOffsetFill?: boolean;
  polygonOffset?: [number, number];

  sampleCoverage?: [number, boolean];

  scissorTest?: boolean;
  scissor?: [number, number, number, number] | NumberArray;

  stencilTest?: boolean;
  /** Bit mask to enable or disable writing of individual bits in the stencil planes. By default, the mask is all 1. */
  stencilMask?: number | [number, number];
  stencilFunc?:
    | [GLFunction, number, number]
    | [GLFunction, number, number, GLFunction, number, number];
  stencilOp?:
    | [GLStencilOp, GLStencilOp, GLStencilOp]
    | [GLStencilOp, GLStencilOp, GLStencilOp, GLStencilOp, GLStencilOp, GLStencilOp];
  viewport?: [number, number, number, number] | NumberArray;
};

/** WebGL style parameters object (with both GL constants and function style fields) */
export type GLParameters = GLValueParameters & GLFunctionParameters;

/** WebGL2 Extensions */
export type GLExtensions = {
  // ANGLE_instanced_arrays?: ANGLE_instanced_arrays | null;
  // EXT_blend_minmax?: EXT_blend_minmax | null;
  EXT_color_buffer_float?: EXT_color_buffer_float | null;
  EXT_color_buffer_half_float?: EXT_color_buffer_half_float | null;
  // EXT_float_blend?: EXT_float_blend | null;
  // EXT_frag_depth?: EXT_frag_depth | null;
  // EXT_sRGB?: EXT_sRGB | null;
  // EXT_shader_texture_lod?: EXT_shader_texture_lod | null;
  EXT_texture_compression_bptc?: EXT_texture_compression_bptc | null;
  EXT_texture_compression_rgtc?: EXT_texture_compression_rgtc | null;
  EXT_texture_filter_anisotropic?: EXT_texture_filter_anisotropic | null;
  /** https://registry.khronos.org/webgl/extensions/KHR_parallel_shader_compile */
  KHR_parallel_shader_compile?: KHR_parallel_shader_compile | null;
  // OES_element_index_uint?: OES_element_index_uint | null;
  OES_fbo_render_mipmap?: OES_fbo_render_mipmap | null;
  // OES_standard_derivatives?: OES_standard_derivatives | null;
  OES_texture_float?: OES_texture_float | null;
  OES_texture_float_linear?: OES_texture_float_linear | null;
  OES_texture_half_float?: OES_texture_half_float | null;
  OES_texture_half_float_linear?: OES_texture_half_float_linear | null;
  OES_vertex_array_object?: OES_vertex_array_object | null;
  OVR_multiview2?: OVR_multiview2 | null;
  // WEBGL_color_buffer_float?: WEBGL_color_buffer_float | null;
  WEBGL_compressed_texture_astc?: WEBGL_compressed_texture_astc | null;
  WEBGL_compressed_texture_etc?: WEBGL_compressed_texture_etc | null;
  WEBGL_compressed_texture_etc1?: WEBGL_compressed_texture_etc1 | null;
  WEBGL_compressed_texture_pvrtc?: WEBGL_compressed_texture_pvrtc | null;
  WEBGL_compressed_texture_s3tc?: WEBGL_compressed_texture_s3tc | null;
  WEBGL_compressed_texture_s3tc_srgb?: WEBGL_compressed_texture_s3tc_srgb | null;
  WEBGL_debug_renderer_info?: WEBGL_debug_renderer_info | null;
  WEBGL_debug_shaders?: WEBGL_debug_shaders | null;
  // WEBGL_depth_texture?: WEBGL_depth_texture | null;
  // WEBGL_draw_buffers?: WEBGL_draw_buffers | null;
  WEBGL_lose_context?: WEBGL_lose_context | null;
  // WEBGL_multi_draw?: WEBGL_multi_draw | null;

  /** https://registry.khronos.org/webgl/extensions/EXT_depth_clamp/ */
  EXT_depth_clamp?: EXT_depth_clamp | null;

  /** https://registry.khronos.org/webgl/extensions/WEBGL_provoking_vertex/ */
  WEBGL_provoking_vertex?: WEBGL_provoking_vertex | null;

  /** https://registry.khronos.org/webgl/extensions/WEBGL_polygon_mode/ */
  WEBGL_polygon_mode?: WEBGL_polygon_mode | null;
};

/** https://registry.khronos.org/webgl/extensions/EXT_depth_clamp/ */
type EXT_depth_clamp = {
  // Constants in GL enum
};

/** https://registry.khronos.org/webgl/extensions/WEBGL_provoking_vertex/ */
type WEBGL_provoking_vertex = {
  // Constants in GL enum
  /** Set the provoking vertex */
  provokingVertexWEBGL(provokeMode: GL.FIRST_VERTEX_CONVENTION | GL.LAST_VERTEX_CONVENTION): void;
};

/** WEBGL_polygon_mode https://registry.khronos.org/webgl/extensions/WEBGL_polygon_mode/ */
type WEBGL_polygon_mode = {
  polygonModeWEBGL(face: GL.FRONT | GL.BACK, mode: GL.LINE_WEBGL | GL.FILL_WEBGL): void;
};
