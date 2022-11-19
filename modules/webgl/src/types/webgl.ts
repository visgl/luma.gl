import type {NumberArray} from '@luma.gl/api';
import GL from '@luma.gl/constants';

type Framebuffer = any;

export type GLDrawMode =
  | GL.POINTS
  | GL.LINES
  | GL.LINE_STRIP
  | GL.LINE_LOOP
  | GL.TRIANGLES
  | GL.TRIANGLE_STRIP
  | GL.TRIANGLE_FAN;

export type GLPrimitive = GL.POINTS | GL.LINES | GL.TRIANGLES;

export type GLType =
  | GL.FLOAT
  | GL.UNSIGNED_SHORT
  | GL.UNSIGNED_INT
  | GL.UNSIGNED_BYTE
  | GL.BYTE
  | GL.SHORT
  | GL.INT;

export type GLPackedType =
  | GL.UNSIGNED_SHORT_5_6_5
  | GL.UNSIGNED_SHORT_4_4_4_4
  | GL.UNSIGNED_SHORT_5_5_5_1;

export type GLUniformType = GLSamplerType | GLCompositeType;

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

// Composite types table
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
export type WebGLSamplerParameters = {
  [GL.TEXTURE_WRAP_S]?: GL.CLAMP_TO_EDGE | GL.REPEAT | GL.MIRRORED_REPEAT;
  [GL.TEXTURE_WRAP_T]?: GL.CLAMP_TO_EDGE | GL.REPEAT | GL.MIRRORED_REPEAT;
  [GL.TEXTURE_WRAP_R]?: GL.CLAMP_TO_EDGE | GL.REPEAT | GL.MIRRORED_REPEAT;
  [GL.TEXTURE_MAG_FILTER]?: GL.NEAREST | GL.LINEAR;
  [GL.TEXTURE_MIN_FILTER]?:
    | GL.NEAREST
    | GL.LINEAR
    | GL.NEAREST_MIPMAP_NEAREST
    | GL.NEAREST_MIPMAP_LINEAR
    | GL.LINEAR_MIPMAP_NEAREST
    | GL.LINEAR_MIPMAP_LINEAR;
  [GL.TEXTURE_MIN_LOD]?: number;
  [GL.TEXTURE_MAX_LOD]?: number;
  [GL.TEXTURE_COMPARE_FUNC]?: number; // COMPARE_FUNC);
  [GL.TEXTURE_COMPARE_MODE]?: GL.COMPARE_REF_TO_TEXTURE;
  [GL.TEXTURE_MAX_ANISOTROPY_EXT]?: number; //
};

/**
 * All global WebGL values set by a variety of setter gl.enable ...
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
  [GL.STENCIL_REF]?: GLFunction;
  [GL.STENCIL_VALUE_MASK]?: GLFunction;
  [GL.STENCIL_BACK_FUNC]?: GLFunction;
  [GL.STENCIL_BACK_REF]?: GLFunction;
  [GL.STENCIL_BACK_VALUE_MASK]?: GLFunction;
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

export type GLFunctionParameters = {
  // Function-style setters
  framebuffer?: Framebuffer | null;
  blend?: boolean;
  blendColor?: [number, number, number, number] | NumberArray;
  blendEquation?: GLBlendEquation | [GLBlendEquation, GLBlendEquation];
  blendFunc?:
    | [GLBlendFunction, GLBlendFunction]
    | [GLBlendFunction, GLBlendFunction, GLBlendFunction, GLBlendFunction];

  clearColor?: [number, number, number, number] | NumberArray;
  clearDepth?: number;
  clearStencil?: number;

  colorMask?: [boolean, boolean, boolean, boolean];

  cull?: boolean;
  cullFace?: GL.FRONT | GL.BACK | GL.FRONT_AND_BACK;

  depthTest?: boolean;
  depthFunc?: GLFunction;
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
export type GLParameters = GLValueParameters | GLFunctionParameters;
