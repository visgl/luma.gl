// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import {GL, type GLConstant, type GLValue} from './webgl-constants';

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
  | GLConstant<'TEXTURE_2D'>
  | GLConstant<'TEXTURE_CUBE_MAP'>
  | GLConstant<'TEXTURE_2D_ARRAY'>
  | GLConstant<'TEXTURE_3D'>;

/** All possible cube face targets for textImage2D */
export type GLTextureCubeMapTarget =
  | GLConstant<'TEXTURE_CUBE_MAP_POSITIVE_X'>
  | GLConstant<'TEXTURE_CUBE_MAP_NEGATIVE_X'>
  | GLConstant<'TEXTURE_CUBE_MAP_POSITIVE_Y'>
  | GLConstant<'TEXTURE_CUBE_MAP_NEGATIVE_Y'>
  | GLConstant<'TEXTURE_CUBE_MAP_POSITIVE_Z'>
  | GLConstant<'TEXTURE_CUBE_MAP_NEGATIVE_Z'>;

/** Texel data formats for gl.texSubImage() */
export type GLTexelDataFormat =
  | GLConstant<'ALPHA'> // Discards the red, green and blue components and reads the alpha component.
  | GLConstant<'RGB'> // Discards the alpha components and reads the red, green and blue components.
  | GLConstant<'RGBA'> // Red, green, blue and alpha components are read from the color buffer.
  | GLConstant<'LUMINANCE'> // Each color component is a luminance component, alpha is 1.0.
  | GLConstant<'LUMINANCE_ALPHA'> // Each component is a luminance/alpha component.
  | GLConstant<'SRGB'>
  // | GL.SRGB_ALPHA_EXT
  | GLConstant<'RED'>
  | GLConstant<'RG'>
  | GLConstant<'RED_INTEGER'>
  | GLConstant<'RG_INTEGER'>
  | GLConstant<'RGB_INTEGER'>
  | GLConstant<'RGBA_INTEGER'>
  | GLConstant<'DEPTH_COMPONENT'>
  | GLConstant<'DEPTH_STENCIL'>;

/** Rendering primitives. Constants passed to drawElements() or drawArrays() to specify what kind of primitive to render. */
export type GLPrimitiveTopology =
  | GLConstant<'POINTS'>
  | GLConstant<'LINES'>
  | GLConstant<'LINE_STRIP'>
  | GLConstant<'LINE_LOOP'>
  | GLConstant<'TRIANGLES'>
  | GLConstant<'TRIANGLE_STRIP'>
  | GLConstant<'TRIANGLE_FAN'>;

/** Rendering primitives. Constants passed to transform feedback  . */
export type GLPrimitive = GLConstant<'POINTS'> | GLConstant<'LINES'> | GLConstant<'TRIANGLES'>;

/** Data Type */
export type GLDataType =
  | GLConstant<'FLOAT'>
  | GLConstant<'UNSIGNED_SHORT'>
  | GLConstant<'UNSIGNED_INT'>
  | GLConstant<'UNSIGNED_BYTE'>
  | GLConstant<'BYTE'>
  | GLConstant<'SHORT'>
  | GLConstant<'INT'>
  | GLConstant<'HALF_FLOAT'>;

/** Pixel Data Type */
export type GLPixelType =
  | GLDataType
  | GLConstant<'UNSIGNED_SHORT_5_6_5'>
  | GLConstant<'UNSIGNED_SHORT_4_4_4_4'>
  | GLConstant<'UNSIGNED_SHORT_5_5_5_1'>
  | GLConstant<'UNSIGNED_INT_2_10_10_10_REV'>
  | GLConstant<'UNSIGNED_INT_10F_11F_11F_REV'>
  | GLConstant<'UNSIGNED_INT_5_9_9_9_REV'>
  | GLConstant<'UNSIGNED_INT_24_8'>
  | GLConstant<'FLOAT_32_UNSIGNED_INT_24_8_REV'>;

/**
 * Sampler uniform type
 * @note These are all the valid sampler types used with `gl.uniform1i((location, value)`
 */
export type GLSamplerType =
  | GLConstant<'SAMPLER_2D'>
  | GLConstant<'SAMPLER_CUBE'>
  | GLConstant<'SAMPLER_3D'>
  | GLConstant<'SAMPLER_2D_SHADOW'>
  | GLConstant<'SAMPLER_2D_ARRAY'>
  | GLConstant<'SAMPLER_2D_ARRAY_SHADOW'>
  | GLConstant<'SAMPLER_CUBE_SHADOW'>
  | GLConstant<'INT_SAMPLER_2D'>
  | GLConstant<'INT_SAMPLER_3D'>
  | GLConstant<'INT_SAMPLER_CUBE'>
  | GLConstant<'INT_SAMPLER_2D_ARRAY'>
  | GLConstant<'UNSIGNED_INT_SAMPLER_2D'>
  | GLConstant<'UNSIGNED_INT_SAMPLER_3D'>
  | GLConstant<'UNSIGNED_INT_SAMPLER_CUBE'>
  | GLConstant<'UNSIGNED_INT_SAMPLER_2D_ARRAY'>;

/**
 * Composite types table
 * @note These are all the valid non-sampler uniform types,
 * Different `gl.uniformXXX(location, value)` functions must be used depending on which composite type is being set.
 */
export type GLUniformType =
  | GLConstant<'FLOAT'>
  | GLConstant<'FLOAT_VEC2'>
  | GLConstant<'FLOAT_VEC3'>
  | GLConstant<'FLOAT_VEC4'>
  | GLConstant<'INT'>
  | GLConstant<'INT_VEC2'>
  | GLConstant<'INT_VEC3'>
  | GLConstant<'INT_VEC4'>
  | GLConstant<'UNSIGNED_INT'>
  | GLConstant<'UNSIGNED_INT_VEC2'>
  | GLConstant<'UNSIGNED_INT_VEC3'>
  | GLConstant<'UNSIGNED_INT_VEC4'>
  | GLConstant<'BOOL'>
  | GLConstant<'BOOL_VEC2'>
  | GLConstant<'BOOL_VEC3'>
  | GLConstant<'BOOL_VEC4'>
  | GLConstant<'FLOAT_MAT2'>
  | GLConstant<'FLOAT_MAT2x3'>
  | GLConstant<'FLOAT_MAT2x4'>
  | GLConstant<'FLOAT_MAT3x2'>
  | GLConstant<'FLOAT_MAT3'>
  | GLConstant<'FLOAT_MAT3x4'>
  | GLConstant<'FLOAT_MAT4x2'>
  | GLConstant<'FLOAT_MAT4x3'>
  | GLConstant<'FLOAT_MAT4'>;

/**
 * Depth or stencil tests
 * Constants passed to WebGLRenderingContext.depthFunc() or WebGLRenderingContext.stencilFunc().
 */
export type GLFunction =
  | GLConstant<'NEVER'>
  | GLConstant<'LESS'>
  | GLConstant<'EQUAL'>
  | GLConstant<'LEQUAL'>
  | GLConstant<'GREATER'>
  | GLConstant<'NOTEQUAL'>
  | GLConstant<'GEQUAL'>
  | GLConstant<'ALWAYS'>;

export type GLBlendEquation =
  | GLConstant<'FUNC_ADD'>
  | GLConstant<'FUNC_SUBTRACT'>
  | GLConstant<'FUNC_REVERSE_SUBTRACT'>
  | GLConstant<'MIN'>
  | GLConstant<'MAX'>;

export type GLBlendFunction =
  | GLConstant<'ZERO'>
  | GLConstant<'ONE'>
  | GLConstant<'SRC_COLOR'>
  | GLConstant<'ONE_MINUS_SRC_COLOR'>
  | GLConstant<'DST_COLOR'>
  | GLConstant<'ONE_MINUS_DST_COLOR'>
  | GLConstant<'SRC_ALPHA'>
  | GLConstant<'ONE_MINUS_SRC_ALPHA'>
  | GLConstant<'DST_ALPHA'>
  | GLConstant<'ONE_MINUS_DST_ALPHA'>
  | GLConstant<'CONSTANT_COLOR'>
  | GLConstant<'ONE_MINUS_CONSTANT_COLOR'>
  | GLConstant<'CONSTANT_ALPHA'>
  | GLConstant<'ONE_MINUS_CONSTANT_ALPHA'>
  | GLConstant<'SRC_ALPHA_SATURATE'>;

/**
 * Stencil actions
 * Constants passed to WebGLRenderingContext.stencilOp().
 */
export type GLStencilOp =
  | GLConstant<'KEEP'>
  | GLConstant<'ZERO'>
  | GLConstant<'REPLACE'>
  | GLConstant<'INCR'>
  | GLConstant<'INCR_WRAP'>
  | GLConstant<'DECR'>
  | GLConstant<'DECR_WRAP'>
  | GLConstant<'INVERT'>;

export type GLPolygonMode = GLConstant<'FILL_WEBGL'> | GLConstant<'LINE_WEBGL'>;
export type GLCullFaceMode =
  | GLConstant<'FRONT'>
  | GLConstant<'BACK'>
  | GLConstant<'FRONT_AND_BACK'>;
export type GLProvokingVertex =
  | GLConstant<'FIRST_VERTEX_CONVENTION_WEBGL'>
  | GLConstant<'LAST_VERTEX_CONVENTION_WEBGL'>;

/** Parameters for textures and samplers */
export type GLSamplerParameters = {
  /** Sets the wrap parameter for texture coordinate  to either GL_CLAMP_TO_EDGE, GL_MIRRORED_REPEAT, or GL_REPEAT. */
  [GL.TEXTURE_WRAP_S]?:
    | GLConstant<'CLAMP_TO_EDGE'>
    | GLConstant<'REPEAT'>
    | GLConstant<'MIRRORED_REPEAT'>;
  /** Sets the wrap parameter for texture coordinate  to either GL_CLAMP_TO_EDGE, GL_MIRRORED_REPEAT, or GL_REPEAT. */
  [GL.TEXTURE_WRAP_T]?:
    | GLConstant<'CLAMP_TO_EDGE'>
    | GLConstant<'REPEAT'>
    | GLConstant<'MIRRORED_REPEAT'>;
  /** Sets the wrap parameter for texture coordinate  to either GL_CLAMP_TO_EDGE, GL_MIRRORED_REPEAT, or GL_REPEAT. */
  [GL.TEXTURE_WRAP_R]?:
    | GLConstant<'CLAMP_TO_EDGE'>
    | GLConstant<'REPEAT'>
    | GLConstant<'MIRRORED_REPEAT'>;

  /** The texture magnification function is used when the pixel being textured maps to an area less than or equal to one texture element. It sets the texture magnification function to either GL_NEAREST or GL_LINEAR (see below). GL_NEAREST is generally faster than GL_LINEAR, but it can produce textured images with sharper edges because the transition between texture elements is not as smooth. Default: GL_LINEAR.  */
  [GL.TEXTURE_MAG_FILTER]?: GLConstant<'NEAREST'> | GLConstant<'LINEAR'>;
  /** The texture minifying function is used whenever the pixel being textured maps to an area greater than one texture element. There are six defined minifying functions. Two of them use the nearest one or nearest four texture elements to compute the texture value. The other four use mipmaps. Default: GL_NEAREST_MIPMAP_LINEAR */
  [GL.TEXTURE_MIN_FILTER]?:
    | GLConstant<'NEAREST'>
    | GLConstant<'LINEAR'>
    | GLConstant<'NEAREST_MIPMAP_NEAREST'>
    | GLConstant<'NEAREST_MIPMAP_LINEAR'>
    | GLConstant<'LINEAR_MIPMAP_NEAREST'>
    | GLConstant<'LINEAR_MIPMAP_LINEAR'>;
  /* A GLfloat indicating the minimum level-of-detail mipmap. */
  [GL.TEXTURE_MIN_LOD]?: number;
  /* A GLfloat indicating the minimum level-of-detail mipmap. */
  [GL.TEXTURE_MAX_LOD]?: number;
  /** Texture parameter TEXTURE_COMPARE_FUNC specifies the depth texture comparison function */
  [GL.TEXTURE_COMPARE_FUNC]?: number; // COMPARE_FUNC);
  /** Texture parameter TEXTURE_COMPARE_MODE specifies the depth texture comparison operands. */
  [GL.TEXTURE_COMPARE_MODE]?: GLConstant<'COMPARE_REF_TO_TEXTURE'>;
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
  [GL.CULL_FACE_MODE]?: GLConstant<'FRONT'> | GLConstant<'BACK'> | GLConstant<'FRONT_AND_BACK'>;
  [GL.DEPTH_TEST]?: boolean;
  [GL.DEPTH_CLEAR_VALUE]?: number;
  [GL.DEPTH_FUNC]?: GLFunction;
  [GL.DEPTH_RANGE]?: [number, number] | TypedArray;
  [GL.DEPTH_WRITEMASK]?: boolean;
  [GL.DITHER]?: boolean;
  [GL.FRAGMENT_SHADER_DERIVATIVE_HINT]?:
    | GLConstant<'FASTEST'>
    | GLConstant<'NICEST'>
    | GLConstant<'DONT_CARE'>;
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
  [GL.FRONT_FACE]?: GLConstant<'CW'> | GLConstant<'CCW'>;
  [GL.GENERATE_MIPMAP_HINT]?:
    | GLConstant<'FASTEST'>
    | GLConstant<'NICEST'>
    | GLConstant<'DONT_CARE'>;
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

  [GL.UNPACK_ALIGNMENT]?: 1 | 2 | 4 | 8;
  [GL.UNPACK_FLIP_Y_WEBGL]?: boolean;
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]?: boolean;
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]?:
    | GLConstant<'NONE'>
    | GLConstant<'BROWSER_DEFAULT_WEBGL'>;
  [GL.UNPACK_ROW_LENGTH]?: number;
  [GL.UNPACK_IMAGE_HEIGHT]?: number;
  [GL.UNPACK_SKIP_PIXELS]?: number;
  [GL.UNPACK_SKIP_ROWS]?: number;
  [GL.UNPACK_SKIP_IMAGES]?: number;
};

export type GLPackParameters = {
  [GL.PACK_ALIGNMENT]?: 1 | 2 | 4 | 8;
  [GL.PACK_ROW_LENGTH]?: number;
  [GL.PACK_SKIP_PIXELS]?: number;
  [GL.PACK_SKIP_ROWS]?: number;
};

export type GLUnpackParameters = {
  [GL.UNPACK_ALIGNMENT]?: number;
  [GL.UNPACK_FLIP_Y_WEBGL]?: boolean;
  [GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL]?: boolean;
  [GL.UNPACK_COLORSPACE_CONVERSION_WEBGL]?:
    | GLConstant<'NONE'>
    | GLConstant<'BROWSER_DEFAULT_WEBGL'>;
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
  cullFace?: GLConstant<'FRONT'> | GLConstant<'BACK'> | GLConstant<'FRONT_AND_BACK'>;

  depthTest?: boolean;
  depthFunc?: GLFunction;
  /** Specifies whether writing into the depth buffer is enabled. Default true, i.e. writing is enabled. */
  depthMask?: boolean;
  depthRange?: [number, number] | TypedArray;

  dither?: boolean;

  derivativeHint?: GLConstant<'FASTEST'> | GLConstant<'NICEST'> | GLConstant<'DONT_CARE'>;

  frontFace?: GLConstant<'CW'> | GLConstant<'CCW'>;

  mipmapHint?: GLConstant<'FASTEST'> | GLConstant<'NICEST'> | GLConstant<'DONT_CARE'>;

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
    provokeMode:
      | GLConstant<'FIRST_VERTEX_CONVENTION_WEBGL'>
      | GLConstant<'LAST_VERTEX_CONVENTION_WEBGL'>
  ): void;
};

/** WEBGL_polygon_mode https://registry.khronos.org/webgl/extensions/WEBGL_polygon_mode/ */
type WEBGL_polygon_mode = {
  /** Set polygon mode of face to fill or line */
  polygonModeWEBGL(
    face: GLConstant<'FRONT'> | GLConstant<'BACK'>,
    mode: GLConstant<'LINE_WEBGL'> | GLConstant<'FILL_WEBGL'>
  ): void;
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

  clipControlEXT(origin: GLValue, depth: GLValue): void;
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
  enableiOES(target: GLValue, index: number): void;
  /** Disables blending for an individual draw buffer */
  disableiOES(target: GLValue, index: number): void;
  /** Modifies blend equation for an individual draw buffer */
  blendEquationiOES(buf: number, mode: GLValue): void;
  /** Modifies blend equation for an individual draw buffer */
  blendEquationSeparateiOES(buf: number, modeRGB: GLValue, modeAlpha: GLValue): void;
  /** Modifies blend function for an individual draw buffer */
  blendFunciOES(buf: number, src: GLValue, dst: GLValue): void;
  /** Modifies blend function for an individual draw buffer */
  blendFuncSeparateiOES(
    buf: number,
    srcRGB: GLValue,
    dstRGB: GLValue,
    srcAlpha: GLValue,
    dstAlpha: GLValue
  ): void;
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
  beginPixelLocalStorageWEBGL(loadops: GLValue[]): void;
  endPixelLocalStorageWEBGL(storeops: GLValue[]): void;
  pixelLocalStorageBarrierWEBGL(): void;
  getFramebufferPixelLocalStorageParameterWEBGL(plane: number, pname: GLValue): any;
};
