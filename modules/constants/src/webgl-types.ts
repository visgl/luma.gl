// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import {GL} from './webgl-constants';

/** Type covering all typed arrays and classic arrays consisting of numbers */
export type NumericArray = TypedArray | number[];

/** Type covering classic arrays consisting of numbers */
export type NumberArray = number[];

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

/** All possible texture targets */
export type GLTextureTarget =
  | GL.TEXTURE_2D
  | GL.TEXTURE_CUBE_MAP
  | GL.TEXTURE_2D_ARRAY
  | GL.TEXTURE_3D;

/** All possible cube face targets for textImage2D */
export type GLTextureCubeMapTarget =
  | GL.TEXTURE_CUBE_MAP_POSITIVE_X
  | GL.TEXTURE_CUBE_MAP_NEGATIVE_X
  | GL.TEXTURE_CUBE_MAP_POSITIVE_Y
  | GL.TEXTURE_CUBE_MAP_NEGATIVE_Y
  | GL.TEXTURE_CUBE_MAP_POSITIVE_Z
  | GL.TEXTURE_CUBE_MAP_NEGATIVE_Z;

/** Texel data formats for gl.texSubImage() */
export type GLTexelDataFormat =
  | GL.ALPHA // Discards the red, green and blue components and reads the alpha component.
  | GL.RGB // Discards the alpha components and reads the red, green and blue components.
  | GL.RGBA // Red, green, blue and alpha components are read from the color buffer.
  | GL.LUMINANCE // Each color component is a luminance component, alpha is 1.0.
  | GL.LUMINANCE_ALPHA // Each component is a luminance/alpha component.
  | GL.SRGB
  // | GL.SRGB_ALPHA_EXT
  | GL.RED
  | GL.RG
  | GL.RED_INTEGER
  | GL.RG_INTEGER
  | GL.RGB_INTEGER
  | GL.RGBA_INTEGER
  | GL.DEPTH_COMPONENT
  | GL.DEPTH_STENCIL;

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
  | GL.INT
  | GL.HALF_FLOAT;

/** Pixel Data Type */
export type GLPixelType =
  | GLDataType
  | GL.UNSIGNED_SHORT_5_6_5
  | GL.UNSIGNED_SHORT_4_4_4_4
  | GL.UNSIGNED_SHORT_5_5_5_1
  | GL.UNSIGNED_INT_2_10_10_10_REV
  | GL.UNSIGNED_INT_10F_11F_11F_REV
  | GL.UNSIGNED_INT_5_9_9_9_REV
  | GL.UNSIGNED_INT_24_8
  | GL.FLOAT_32_UNSIGNED_INT_24_8_REV;

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
  | GL.MIN
  | GL.MAX;

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

export type GLPolygonMode = GL.FILL_WEBGL | GL.LINE_WEBGL;
export type GLCullFaceMode = GL.FRONT | GL.BACK | GL.FRONT_AND_BACK;
export type GLProvokingVertex = GL.FIRST_VERTEX_CONVENTION_WEBGL | GL.LAST_VERTEX_CONVENTION_WEBGL;

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
  [GL.BLEND_COLOR]?: [number, number, number, number] | TypedArray;
  [GL.BLEND_EQUATION_RGB]?: GLBlendEquation;
  [GL.BLEND_EQUATION_ALPHA]?: GLBlendEquation;
  [GL.BLEND_SRC_RGB]?: GLBlendFunction;
  [GL.BLEND_DST_RGB]?: GLBlendFunction;
  [GL.BLEND_SRC_ALPHA]?: GLBlendFunction;
  [GL.BLEND_DST_ALPHA]?: GLBlendFunction;
  [GL.COLOR_CLEAR_VALUE]?: [number, number, number, number] | TypedArray;
  [GL.COLOR_WRITEMASK]?: [boolean, boolean, boolean, boolean] | boolean[];
  [GL.CULL_FACE]?: boolean;
  [GL.CULL_FACE_MODE]?: GL.FRONT | GL.BACK | GL.FRONT_AND_BACK;
  [GL.DEPTH_TEST]?: boolean;
  [GL.DEPTH_CLEAR_VALUE]?: number;
  [GL.DEPTH_FUNC]?: GLFunction;
  [GL.DEPTH_RANGE]?: [number, number] | TypedArray;
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
  [GL.SCISSOR_BOX]?: [number, number, number, number] | TypedArray;
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
  [GL.VIEWPORT]?: [number, number, number, number] | TypedArray;

  [GL.READ_FRAMEBUFFER_BINDING]?: Framebuffer | null;

  [GL.PACK_ALIGNMENT]?: number;
  [GL.PACK_ROW_LENGTH]?: number;
  [GL.PACK_SKIP_PIXELS]?: number;
  [GL.PACK_SKIP_ROWS]?: number;

  [GL.UNPACK_ALIGNMENT]?: number;
  [GL.UNPACK_FLIP_Y_WEBGL]?: boolean;
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]?: boolean;
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]?: GL.NONE | GL.BROWSER_DEFAULT_WEBGL;
  [GL.UNPACK_ROW_LENGTH]?: number;
  [GL.UNPACK_IMAGE_HEIGHT]?: number;
  [GL.UNPACK_SKIP_PIXELS]?: number;
  [GL.UNPACK_SKIP_ROWS]?: number;
  [GL.UNPACK_SKIP_IMAGES]?: number;
};

export type GLPackParameters = {
  [GL.PACK_ALIGNMENT]?: number;
  [GL.PACK_ROW_LENGTH]?: number;
  [GL.PACK_SKIP_PIXELS]?: number;
  [GL.PACK_SKIP_ROWS]?: number;
};

export type GLUnpackParameters = {
  [GL.UNPACK_ALIGNMENT]?: number;
  [GL.UNPACK_FLIP_Y_WEBGL]?: boolean;
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]?: boolean;
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]?: GL.NONE | GL.BROWSER_DEFAULT_WEBGL;
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
  blendColor?: [number, number, number, number] | TypedArray;
  blendEquation?: GLBlendEquation | [GLBlendEquation, GLBlendEquation];
  /* defines which function is used for blending pixel arithmetic. Defaults to one and zero */
  blendFunc?:
    | [GLBlendFunction, GLBlendFunction]
    | [GLBlendFunction, GLBlendFunction, GLBlendFunction, GLBlendFunction];

  clearColor?: [number, number, number, number] | TypedArray;
  clearDepth?: number;
  clearStencil?: number;

  colorMask?: [boolean, boolean, boolean, boolean] | boolean[];

  cull?: boolean;
  cullFace?: GL.FRONT | GL.BACK | GL.FRONT_AND_BACK;

  depthTest?: boolean;
  depthFunc?: GLFunction;
  /** Specifies whether writing into the depth buffer is enabled. Default true, i.e. writing is enabled. */
  depthMask?: boolean;
  depthRange?: [number, number] | TypedArray;

  dither?: boolean;

  derivativeHint?: GL.FASTEST | GL.NICEST | GL.DONT_CARE;

  frontFace?: GL.CW | GL.CCW;

  mipmapHint?: GL.FASTEST | GL.NICEST | GL.DONT_CARE;

  lineWidth?: number;

  polygonOffsetFill?: boolean;
  polygonOffset?: [number, number] | TypedArray;

  sampleCoverage?: [number, boolean];

  scissorTest?: boolean;
  scissor?: [number, number, number, number] | TypedArray;

  stencilTest?: boolean;
  /** Bit mask to enable or disable writing of individual bits in the stencil planes. By default, the mask is all 1. */
  stencilMask?: number | [number, number] | TypedArray;
  stencilFunc?:
    | [GLFunction, number, number]
    | [GLFunction, number, number, GLFunction, number, number];
  stencilOp?:
    | [GLStencilOp, GLStencilOp, GLStencilOp]
    | [GLStencilOp, GLStencilOp, GLStencilOp, GLStencilOp, GLStencilOp, GLStencilOp];
  viewport?: [number, number, number, number] | TypedArray;
};

/** WebGL style parameters object (with both GL constants and function style fields) */
export type GLParameters = GLValueParameters & GLFunctionParameters;

/** WebGL context limits */
export type GLLimits = {
  [GL.ALIASED_LINE_WIDTH_RANGE]: [number, number];
  [GL.ALIASED_POINT_SIZE_RANGE]: [number, number];
  [GL.MAX_TEXTURE_SIZE]: number;
  [GL.MAX_CUBE_MAP_TEXTURE_SIZE]: number;
  [GL.MAX_TEXTURE_IMAGE_UNITS]: number;
  [GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS]: number;
  [GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS]: number;
  [GL.MAX_RENDERBUFFER_SIZE]: number;
  [GL.MAX_VARYING_VECTORS]: number;
  [GL.MAX_VERTEX_ATTRIBS]: number;
  [GL.MAX_VERTEX_UNIFORM_VECTORS]: number;
  [GL.MAX_FRAGMENT_UNIFORM_VECTORS]: number;
  [GL.MAX_VIEWPORT_DIMS]: [number, number];

  // Extensions
  [GL.MAX_TEXTURE_MAX_ANISOTROPY_EXT]: number;

  // WebGL2 Limits
  [GL.MAX_3D_TEXTURE_SIZE]: number;
  [GL.MAX_ARRAY_TEXTURE_LAYERS]: number;
  // [GL.MAX_CLIENT_WAIT_TIMEOUT_WEBGL]: number;
  [GL.MAX_COLOR_ATTACHMENTS]: number;
  [GL.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS]: number;
  [GL.MAX_COMBINED_UNIFORM_BLOCKS]: number;
  [GL.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS]: number;
  [GL.MAX_DRAW_BUFFERS]: number;
  [GL.MAX_ELEMENT_INDEX]: number;
  [GL.MAX_ELEMENTS_INDICES]: number;
  [GL.MAX_ELEMENTS_VERTICES]: number;
  [GL.MAX_FRAGMENT_INPUT_COMPONENTS]: number;
  [GL.MAX_FRAGMENT_UNIFORM_BLOCKS]: number;
  [GL.MAX_FRAGMENT_UNIFORM_COMPONENTS]: number;
  [GL.MAX_SAMPLES]: number;
  // [GL.MAX_SERVER_WAIT_TIMEOUT]: number;
  [GL.MAX_TEXTURE_LOD_BIAS]: number;
  [GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS]: number;
  [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS]: number;
  [GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS]: number;
  [GL.MAX_UNIFORM_BLOCK_SIZE]: number;
  [GL.MAX_UNIFORM_BUFFER_BINDINGS]: number;
  [GL.MAX_VARYING_COMPONENTS]: number;
  [GL.MAX_VERTEX_OUTPUT_COMPONENTS]: number;
  [GL.MAX_VERTEX_UNIFORM_BLOCKS]: number;
  [GL.MAX_VERTEX_UNIFORM_COMPONENTS]: number;
  [GL.MIN_PROGRAM_TEXEL_OFFSET]: number;
  [GL.MAX_PROGRAM_TEXEL_OFFSET]: number;
  [GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT]: number;

  // EXTENSIONS
  /** Max clip distances */
  MAX_CLIP_DISTANCES_WEBGL: number;
  /** Max cull distances */
  MAX_CULL_DISTANCES_WEBGL: number;
  /** Max clip and cull distances */
  MAX_COMBINED_CLIP_AND_CULL_DISTANCES_WEBGL: number;
  MAX_DUAL_SOURCE_DRAW_BUFFERS_WEBGL: number;
};

/** WebGL2 Extensions */
export type GLExtensions = {
  /** https://registry.khronos.org/webgl/extensions/EXT_color_buffer_float */
  EXT_color_buffer_float?: EXT_color_buffer_float | null;
  /** https://registry.khronos.org/webgl/extensions/EXT_color_buffer_half_float */
  EXT_color_buffer_half_float?: EXT_color_buffer_half_float | null;
  /** https://registry.khronos.org/webgl/extensions/EXT_texture_compression_bptc */
  EXT_texture_compression_bptc?: EXT_texture_compression_bptc | null;
  /** https://registry.khronos.org/webgl/extensions/EXT_texture_compression_rgtc */
  EXT_texture_compression_rgtc?: EXT_texture_compression_rgtc | null;
  /** https://registry.khronos.org/webgl/extensions/EXT_texture_filter_anisotropic */
  EXT_texture_filter_anisotropic?: EXT_texture_filter_anisotropic | null;
  /** https://registry.khronos.org/webgl/extensions/KHR_parallel_shader_compile */
  KHR_parallel_shader_compile?: KHR_parallel_shader_compile | null;
  /** https://registry.khronos.org/webgl/extensions/OES_fbo_render_mipmap */
  OES_fbo_render_mipmap?: OES_fbo_render_mipmap | null;
  /** https://registry.khronos.org/webgl/extensions/OES_texture_float */
  OES_texture_float?: OES_texture_float | null;
  /** https://registry.khronos.org/webgl/extensions/OES_texture_float_linear */
  OES_texture_float_linear?: OES_texture_float_linear | null;
  /** https://registry.khronos.org/webgl/extensions/OES_texture_half_float */
  OES_texture_half_float?: OES_texture_half_float | null;
  /** https://registry.khronos.org/webgl/extensions/OES_texture_half_float_linear */
  OES_texture_half_float_linear?: OES_texture_half_float_linear | null;
  /** https://registry.khronos.org/webgl/extensions/OES_vertex_array_object */
  OES_vertex_array_object?: OES_vertex_array_object | null;
  /** https://registry.khronos.org/webgl/extensions/EXT_float_blend */
  EXT_float_blend?: EXT_float_blend | null;
  /** https://registry.khronos.org/webgl/extensions/OVR_multiview2 */
  OVR_multiview2?: OVR_multiview2 | null;
  /** https://registry.khronos.org/webgl/extensions/WEBGL_compressed_texture_astc */
  WEBGL_compressed_texture_astc?: WEBGL_compressed_texture_astc | null;
  /** https://registry.khronos.org/webgl/extensions/WEBGL_compressed_texture_etc */
  WEBGL_compressed_texture_etc?: WEBGL_compressed_texture_etc | null;
  /** https://registry.khronos.org/webgl/extensions/WEBGL_compressed_texture_etc1 */
  WEBGL_compressed_texture_etc1?: WEBGL_compressed_texture_etc1 | null;
  /** https://registry.khronos.org/webgl/extensions/WEBGL_compressed_texture_pvrtc */
  WEBGL_compressed_texture_pvrtc?: WEBGL_compressed_texture_pvrtc | null;
  /** https://registry.khronos.org/webgl/extensions/WEBGL_compressed_texture_s3tc */
  WEBGL_compressed_texture_s3tc?: WEBGL_compressed_texture_s3tc | null;
  /** https://registry.khronos.org/webgl/extensions/WEBGL_compressed_texture_s3tc_srgb */
  WEBGL_compressed_texture_s3tc_srgb?: WEBGL_compressed_texture_s3tc_srgb | null;
  /** https://registry.khronos.org/webgl/extensions/WEBGL_debug_renderer_info */
  WEBGL_debug_renderer_info?: WEBGL_debug_renderer_info | null;
  /** https://registry.khronos.org/webgl/extensions/WEBGL_debug_shaders */
  WEBGL_debug_shaders?: WEBGL_debug_shaders | null;
  /** https://registry.khronos.org/webgl/extensions/WEBGL_lose_context */
  WEBGL_lose_context?: WEBGL_lose_context | null;

  // Predefined typescript types not available for the following extensions

  /** https://registry.khronos.org/webgl/extensions/EXT_norm16/ */
  EXT_norm16?: EXT_norm16 | null;
  /** https://registry.khronos.org/webgl/extensions/EXT_snorm/ */
  EXT_snorm?: EXT_snorm | null;
  /** https://registry.khronos.org/webgl/extensions/WEBGL_render_shared_exponent/ */
  WEBGL_render_shared_exponent?: WEBGL_render_shared_exponent | null;

  /** https://registry.khronos.org/webgl/extensions/EXT_depth_clamp/ */
  EXT_depth_clamp?: EXT_depth_clamp | null;
  /** https://registry.khronos.org/webgl/extensions/WEBGL_provoking_vertex/ */
  WEBGL_provoking_vertex?: WEBGL_provoking_vertex | null;
  /** https://registry.khronos.org/webgl/extensions/WEBGL_polygon_mode/ */
  WEBGL_polygon_mode?: WEBGL_polygon_mode | null;

  /** WEBGL_clip_cull_distance https://registry.khronos.org/webgl/extensions/WEBGL_clip_cull_distance/ */
  WEBGL_clip_cull_distance?: WEBGL_clip_cull_distance | null;

  /** NV_shader_noperspective_interpolation https://registry.khronos.org/webgl/extensions/NV_shader_noperspective_interpolation/ */
  NV_shader_noperspective_interpolation?: NV_shader_noperspective_interpolation | null;

  /** EXT_conservative_depth https://registry.khronos.org/webgl/extensions/EXT_conservative_depth/ */
  EXT_conservative_depth?: EXT_conservative_depth | null;

  /** OES_sample_variables https://registry.khronos.org/webgl/extensions/OES_sample_variables/ */
  OES_sample_variables?: OES_sample_variables | null;

  /** EXT_polygon_offset_clamp https://registry.khronos.org/webgl/extensions/EXT_polygon_offset_clamp/ */
  EXT_polygon_offset_clamp?: EXT_polygon_offset_clamp | null;

  /** EXT_clip_control https://registry.khronos.org/webgl/extensions/EXT_clip_control/ */
  EXT_clip_control?: EXT_clip_control | null;

  /** EXT_texture_mirror_clamp_to_edge https://registry.khronos.org/webgl/extensions/EXT_texture_mirror_clamp_to_edge/ */
  EXT_texture_mirror_clamp_to_edge?: EXT_texture_mirror_clamp_to_edge | null;
  /** EXT_texture_mirror_clamp_to_edge https://registry.khronos.org/webgl/extensions/EXT_texture_mirror_clamp_to_edge/ */
  WEBGL_stencil_texturing?: WEBGL_stencil_texturing | null;

  /** WEBGL_blend_func_extended https://registry.khronos.org/webgl/extensions/WEBGL_blend_func_extended/ */
  WEBGL_blend_func_extended?: WEBGL_blend_func_extended | null;

  /** OES_draw_buffers_indexed https://registry.khronos.org/webgl/extensions/OES_draw_buffers_indexed/ */
  OES_draw_buffers_indexed?: OES_draw_buffers_indexed | null;

  /** WEBGL_draw_instanced_base_vertex_base_instance https://registry.khronos.org/webgl/extensions/WEBGL_draw_instanced_base_vertex_base_instance/ */
  WEBGL_draw_instanced_base_vertex_base_instance?: WEBGL_draw_instanced_base_vertex_base_instance | null;
  /** WEBGL_multi_draw https://registry.khronos.org/webgl/extensions/WEBGL_multi_draw/ */
  WEBGL_multi_draw?: WEBGL_multi_draw | null;
  /** WEBGL_multi_draw_instanced_base_vertex_base_instance https://registry.khronos.org/webgl/extensions/WEBGL_multi_draw_instanced_base_vertex_base_instance/ */
  WEBGL_multi_draw_instanced_base_vertex_base_instance?: WEBGL_multi_draw_instanced_base_vertex_base_instance | null;
  /** WEBGL_shader_pixel_local_storage https://registry.khronos.org/webgl/extensions/WEBGL_shader_pixel_local_storage/ */
  WEBGL_shader_pixel_local_storage?: WEBGL_shader_pixel_local_storage | null;

  // WEBGL1 extensions (available as built-in WebGL 2 APIs)
  // ANGLE_instanced_arrays?: ANGLE_instanced_arrays | null;
  // EXT_blend_minmax?: EXT_blend_minmax | null;
  // EXT_frag_depth?: EXT_frag_depth | null;
  // EXT_sRGB?: EXT_sRGB | null;
  // EXT_shader_texture_lod?: EXT_shader_texture_lod | null;
  // OES_element_index_uint?: OES_element_index_uint | null;
  // OES_standard_derivatives?: OES_standard_derivatives | null;
  // WEBGL_color_buffer_float?: WEBGL_color_buffer_float | null;
  // WEBGL_depth_texture?: WEBGL_depth_texture | null;
  // WEBGL_draw_buffers?: WEBGL_draw_buffers | null;
  // WEBGL_multi_draw?: WEBGL_multi_draw | null;
};

/** https://registry.khronos.org/webgl/extensions/EXT_norm16/ */
type EXT_norm16 = {
  // Constants in GL enum
};

/** https://registry.khronos.org/webgl/extensions/EXT_snorm/ */
type EXT_snorm = {
  // Constants in GL enum
};

/** https://registry.khronos.org/webgl/extensions/WEBGL_render_shared_exponent/ */
type WEBGL_render_shared_exponent = {
  // Constants in GL enum
};

/** https://registry.khronos.org/webgl/extensions/EXT_depth_clamp/ */
type EXT_depth_clamp = {
  // Constants in GL enum
};

/** https://registry.khronos.org/webgl/extensions/WEBGL_provoking_vertex/ */
type WEBGL_provoking_vertex = {
  // Constants in GL enum
  /** Set the provoking vertex */
  provokingVertexWEBGL(
    provokeMode: GL.FIRST_VERTEX_CONVENTION_WEBGL | GL.LAST_VERTEX_CONVENTION_WEBGL
  ): void;
};

/** WEBGL_polygon_mode https://registry.khronos.org/webgl/extensions/WEBGL_polygon_mode/ */
type WEBGL_polygon_mode = {
  /** Set polygon mode of face to fill or line */
  polygonModeWEBGL(face: GL.FRONT | GL.BACK, mode: GL.LINE_WEBGL | GL.FILL_WEBGL): void;
};

/** WEBGL_clip_cull_distance https://registry.khronos.org/webgl/extensions/WEBGL_clip_cull_distance/ */
type WEBGL_clip_cull_distance = {
  /** Max clip distances */
  MAX_CLIP_DISTANCES_WEBGL: 0x0d32;
  /** Max cull distances */
  MAX_CULL_DISTANCES_WEBGL: 0x82f9;
  /** Max clip and cull distances */
  MAX_COMBINED_CLIP_AND_CULL_DISTANCES_WEBGL: 0x82fa;

  /** Enable gl_ClipDistance[0] and gl_CullDistance[0] */
  CLIP_DISTANCE0_WEBGL: 0x3000;
  /** Enable gl_ClipDistance[1] and gl_CullDistance[1] */
  CLIP_DISTANCE1_WEBGL: 0x3001;
  /** Enable gl_ClipDistance[2] and gl_CullDistance[2] */
  CLIP_DISTANCE2_WEBGL: 0x3002;
  /** Enable gl_ClipDistance[3] and gl_CullDistance[3] */
  CLIP_DISTANCE3_WEBGL: 0x3003;
  /** Enable gl_ClipDistance[4] and gl_CullDistance[4] */
  CLIP_DISTANCE4_WEBGL: 0x3004;
  /** Enable gl_ClipDistance[5] and gl_CullDistance[5] */
  CLIP_DISTANCE5_WEBGL: 0x3005;
  /** Enable gl_ClipDistance[6] and gl_CullDistance[6] */
  CLIP_DISTANCE6_WEBGL: 0x3006;
  /** Enable gl_ClipDistance[7] and gl_CullDistance[7] */
  CLIP_DISTANCE7_WEBGL: 0x3007;
};

/** NV_shader_noperspective_interpolation https://registry.khronos.org/webgl/extensions/NV_shader_noperspective_interpolation/ */
type NV_shader_noperspective_interpolation = {};

/** EXT_conservative_depth https://registry.khronos.org/webgl/extensions/EXT_conservative_depth/ */
type EXT_conservative_depth = {};

/** OES_sample_variables https://registry.khronos.org/webgl/extensions/OES_sample_variables/ */
type OES_sample_variables = {};

/** EXT_polygon_offset_clamp https://registry.khronos.org/webgl/extensions/EXT_polygon_offset_clamp/ */
type EXT_polygon_offset_clamp = {
  POLYGON_OFFSET_CLAMP_EXT: 0x8e1b;

  polygonOffsetClampEXT(factor: number, units: number, clamp: number): void;
};

/** EXT_clip_control https://registry.khronos.org/webgl/extensions/EXT_clip_control/ */
type EXT_clip_control = {
  LOWER_LEFT_EXT: 0x8ca1;
  UPPER_LEFT_EXT: 0x8ca2;

  NEGATIVE_ONE_TO_ONE_EXT: 0x935e;
  ZERO_TO_ONE_EXT: 0x935f;

  CLIP_ORIGIN_EXT: 0x935c;
  CLIP_DEPTH_MODE_EXT: 0x935d;

  clipControlEXT(origin: GL, depth: GL): void;
};

/** WEBGL_blend_func_extended https://registry.khronos.org/webgl/extensions/WEBGL_blend_func_extended/ */
type WEBGL_blend_func_extended = {
  SRC1_COLOR_WEBGL: 0x88f9;
  SRC1_ALPHA_WEBGL: 0x8589;
  ONE_MINUS_SRC1_COLOR_WEBGL: 0x88fa;
  ONE_MINUS_SRC1_ALPHA_WEBGL: 0x88fb;
  MAX_DUAL_SOURCE_DRAW_BUFFERS_WEBGL: 0x88fc;
};

/** OES_draw_buffers_indexed https://registry.khronos.org/webgl/extensions/OES_draw_buffers_indexed/ */
type OES_draw_buffers_indexed = {
  /** Enables blending for an individual draw buffer */
  enableiOES(target: GL, index: number): void;
  /** Disables blending for an individual draw buffer */
  disableiOES(target: GL, index: number): void;
  /** Modifies blend equation for an individual draw buffer */
  blendEquationiOES(buf: number, mode: GL): void;
  /** Modifies blend equation for an individual draw buffer */
  blendEquationSeparateiOES(buf: number, modeRGB: GL, modeAlpha: GL): void;
  /** Modifies blend function for an individual draw buffer */
  blendFunciOES(buf: number, src: GL, dst: GL): void;
  /** Modifies blend function for an individual draw buffer */
  blendFuncSeparateiOES(buf: number, srcRGB: GL, dstRGB: GL, srcAlpha: GL, dstAlpha: GL): void;
  /** Modifies color mask for an individual draw buffer */
  colorMaskiOES(buf: number, r: boolean, g: boolean, b: boolean, a: boolean): void;
};

/** EXT_texture_mirror_clamp_to_edge https://registry.khronos.org/webgl/extensions/EXT_texture_mirror_clamp_to_edge/ */
type EXT_texture_mirror_clamp_to_edge = {
  MIRROR_CLAMP_TO_EDGE_EXT: 0x8743;
};

/** WEBGL_stencil_texturing https://registry.khronos.org/webgl/extensions/WEBGL_stencil_texturing/ */
type WEBGL_stencil_texturing = {
  DEPTH_STENCIL_TEXTURE_MODE_WEBGL: 0x90ea;
  STENCIL_INDEX_WEBGL: 0x1901;
};

/** WEBGL_draw_instanced_base_vertex_base_instance https://registry.khronos.org/webgl/extensions/WEBGL_draw_instanced_base_vertex_base_instance/ */
type WEBGL_draw_instanced_base_vertex_base_instance = {
  //   drawArraysInstancedBaseInstanceWEBGL(
  //       GLenum mode, GLint first, GLsizei count,
  //       GLsizei instanceCount, GLuint baseInstance);
  //   drawElementsInstancedBaseVertexBaseInstanceWEBGL(
  //       GLenum mode, GLsizei count, GLenum type, GLintptr offset,
  //       GLsizei instanceCount, GLint baseVertex, GLuint baseInstance);
};

/** WEBGL_multi_draw https://registry.khronos.org/webgl/extensions/WEBGL_multi_draw/ */
type WEBGL_multi_draw = {
  //   multiDrawArraysWEBGL(
  //       GLenum mode,
  //       ([AllowShared] Int32Array or sequence<GLint>) firstsList, unsigned long long firstsOffset,
  //       ([AllowShared] Int32Array or sequence<GLsizei>) countsList, unsigned long long countsOffset,
  //       GLsizei drawcount);
  //   multiDrawElementsWEBGL(
  //       GLenum mode,
  //       ([AllowShared] Int32Array or sequence<GLsizei>) countsList, unsigned long long countsOffset,
  //       GLenum type,
  //       ([AllowShared] Int32Array or sequence<GLsizei>) offsetsList, unsigned long long offsetsOffset,
  //       GLsizei drawcount);
  //   multiDrawArraysInstancedWEBGL(
  //       GLenum mode,
  //       ([AllowShared] Int32Array or sequence<GLint>) firstsList, unsigned long long firstsOffset,
  //       ([AllowShared] Int32Array or sequence<GLsizei>) countsList, unsigned long long countsOffset,
  //       ([AllowShared] Int32Array or sequence<GLsizei>) instanceCountsList, unsigned long long instanceCountsOffset,
  //       GLsizei drawcount);
  //   multiDrawElementsInstancedWEBGL(
  //       GLenum mode,
  //       ([AllowShared] Int32Array or sequence<GLsizei>) countsList, unsigned long long countsOffset,
  //       GLenum type,
  //       ([AllowShared] Int32Array or sequence<GLsizei>) offsetsList, unsigned long long offsetsOffset,
  //       ([AllowShared] Int32Array or sequence<GLsizei>) instanceCountsList, unsigned long long instanceCountsOffset,
  //       GLsizei drawcount);
};

/** WEBGL_multi_draw_instanced_base_vertex_base_instance https://registry.khronos.org/webgl/extensions/WEBGL_multi_draw_instanced_base_vertex_base_instance/ */
type WEBGL_multi_draw_instanced_base_vertex_base_instance = {
  //   multiDrawArraysInstancedBaseInstanceWEBGL(
  //       GLenum mode,
  //       ([AllowShared] Int32Array or sequence<GLint>) firstsList, unsigned long long firstsOffset,
  //       ([AllowShared] Int32Array or sequence<GLsizei>) countsList, unsigned long long countsOffset,
  //       ([AllowShared] Int32Array or sequence<GLsizei>) instanceCountsList, unsigned long long instanceCountsOffset,
  //       ([AllowShared] Uint32Array or sequence<GLuint>) baseInstancesList, unsigned long long baseInstancesOffset,
  //       GLsizei drawcount
  //   );
  //   multiDrawElementsInstancedBaseVertexBaseInstanceWEBGL(
  //       GLenum mode,
  //       ([AllowShared] Int32Array or sequence<GLsizei>) countsList, unsigned long long countsOffset,
  //       GLenum type,
  //       ([AllowShared] Int32Array or sequence<GLsizei>) offsetsList, unsigned long long offsetsOffset,
  //       ([AllowShared] Int32Array or sequence<GLsizei>) instanceCountsList, unsigned long long instanceCountsOffset,
  //       ([AllowShared] Int32Array or sequence<GLint>) baseVerticesList, unsigned long long baseVerticesOffset,
  //       ([AllowShared] Uint32Array or sequence<GLuint>) baseInstancesList, unsigned long long baseInstancesOffset,
  //       GLsizei drawcount
  //   );
};

/** WEBGL_shader_pixel_local_storage https://registry.khronos.org/webgl/extensions/WEBGL_shader_pixel_local_storage/ */
type WEBGL_shader_pixel_local_storage = {
  MAX_PIXEL_LOCAL_STORAGE_PLANES_WEBGL: 0x96e0;
  MAX_COLOR_ATTACHMENTS_WITH_ACTIVE_PIXEL_LOCAL_STORAGE_WEBGL: 0x96e1;
  MAX_COMBINED_DRAW_BUFFERS_AND_PIXEL_LOCAL_STORAGE_PLANES_WEBGL: 0x96e2;
  PIXEL_LOCAL_STORAGE_ACTIVE_PLANES_WEBGL: 0x96e3;
  LOAD_OP_ZERO_WEBGL: 0x96e4;
  LOAD_OP_CLEAR_WEBGL: 0x96e5;
  LOAD_OP_LOAD_WEBGL: 0x96e6;
  STORE_OP_STORE_WEBGL: 0x96e7;
  PIXEL_LOCAL_FORMAT_WEBGL: 0x96e8;
  PIXEL_LOCAL_TEXTURE_NAME_WEBGL: 0x96e9;
  PIXEL_LOCAL_TEXTURE_LEVEL_WEBGL: 0x96ea;
  PIXEL_LOCAL_TEXTURE_LAYER_WEBGL: 0x96eb;
  PIXEL_LOCAL_CLEAR_VALUE_FLOAT_WEBGL: 0x96ec;
  PIXEL_LOCAL_CLEAR_VALUE_INT_WEBGL: 0x96ed;
  PIXEL_LOCAL_CLEAR_VALUE_UNSIGNED_INT_WEBGL: 0x96ee;
  isCoherent(): boolean;
  framebufferTexturePixelLocalStorageWEBGL(
    plane: number,
    texture: WebGLTexture,
    level: number,
    layer: number
  ): void;
  // framebufferPixelLocalClearValuefvWEBGL(plane: number,
  //                                                  Float32List value,
  //                                                  optional unsigned long long srcOffset = 0): void;
  // framebufferPixelLocalClearValueivWEBGL(plane: number,
  //                                                  Int32List value,
  //                                                  optional unsigned long long srcOffset = 0): void;
  // framebufferPixelLocalClearValueuivWEBGL(plane: number,
  //                                                   Uint32List value,
  //                                                   optional unsigned long long srcOffset = 0): void;
  beginPixelLocalStorageWEBGL(loadops: GL[]): void;
  endPixelLocalStorageWEBGL(storeops: GL[]): void;
  pixelLocalStorageBarrierWEBGL(): void;
  getFramebufferPixelLocalStorageParameterWEBGL(plane: number, pname: GL): any;
};
