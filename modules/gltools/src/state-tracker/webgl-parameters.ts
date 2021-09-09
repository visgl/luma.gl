// WebGL parameter types
import GL from '@luma.gl/constants';

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

/**
 * TypeScript type covering all typed arrays and classic arrays consisting of numbers
 */
export type NumberArray = number[] | TypedArray;

type Framebuffer = any;

type GL_FUNCTION = 
  GL.NEVER |
  GL.LESS |
  GL.EQUAL |
  GL.LEQUAL |
  GL.GREATER |
  GL.NOTEQUAL |
  GL.GEQUAL |
  GL.ALWAYS;

type GL_BLEND_EQUATION = GL.FUNC_ADD | GL.FUNC_SUBTRACT | GL.FUNC_REVERSE_SUBTRACT | GL.MIN_EXT | GL.MAX_EXT;

type GL_BLEND_FUNCTION = 
  GL.ZERO |
  GL.ONE |
  GL.SRC_COLOR |
  GL.ONE_MINUS_SRC_COLOR |
  GL.DST_COLOR |
  GL.ONE_MINUS_DST_COLOR |
  GL.SRC_ALPHA |
  GL.ONE_MINUS_SRC_ALPHA |
  GL.DST_ALPHA |
  GL.ONE_MINUS_DST_ALPHA |
  GL.CONSTANT_COLOR |
  GL.ONE_MINUS_CONSTANT_COLOR |
  GL.CONSTANT_ALPHA |
  GL.ONE_MINUS_CONSTANT_ALPHA |
  GL.SRC_ALPHA_SATURATE;

type GL_STENCIL_OP =
  GL.KEEP |
  GL.ZERO |
  GL.REPLACE |
  GL.INCR |
  GL.INCR_WRAP |
  GL.DECR |
  GL.DECR_WRAP |
  GL.INVERT;

export type GLValueParameters = {
   [GL.BLEND]?: boolean;
   [GL.BLEND_COLOR]?: [number, number, number, number] | NumberArray;
   [GL.BLEND_EQUATION_RGB]?: GL_BLEND_EQUATION;
   [GL.BLEND_EQUATION_ALPHA]?: GL_BLEND_EQUATION;
   [GL.BLEND_SRC_RGB]?: GL_BLEND_FUNCTION;
   [GL.BLEND_DST_RGB]?: GL_BLEND_FUNCTION;
   [GL.BLEND_SRC_ALPHA]?: GL_BLEND_FUNCTION;
   [GL.BLEND_DST_ALPHA]?: GL_BLEND_FUNCTION;
   [GL.COLOR_CLEAR_VALUE]?: [number, number, number, number] | NumberArray;
   [GL.COLOR_WRITEMASK]?: [boolean, boolean, boolean, boolean] | boolean[];
   [GL.CULL_FACE]?: boolean;
   [GL.CULL_FACE_MODE]?: GL.FRONT | GL.BACK | GL.FRONT_AND_BACK;
   [GL.DEPTH_TEST]?: boolean;
   [GL.DEPTH_CLEAR_VALUE]?: number;
   [GL.DEPTH_FUNC]?: GL_FUNCTION;
   [GL.DEPTH_RANGE]?: [number, number] | NumberArray;
   [GL.DEPTH_WRITEMASK]?: boolean;
   [GL.DITHER]?: boolean;
   [GL.FRAGMENT_SHADER_DERIVATIVE_HINT]?: GL.FASTEST | GL.NICEST | GL.DONT_CARE;
   // NOTE?: FRAMEBUFFER_BINDING and DRAW_FRAMEBUFFER_BINDING(WebGL2) refer same state.
   [GL.FRAMEBUFFER_BINDING]?: Framebuffer | null;
   [GL.FRONT_FACE]?: GL.CW | GL.CCW;
   [GL.GENERATE_MIPMAP_HINT]?: GL.FASTEST | GL.NICEST | GL.DONT_CARE;
   [GL.LINE_WIDTH]?: number;
   [GL.POLYGON_OFFSET_FILL]?: boolean;
   [GL.POLYGON_OFFSET_FACTOR]?: number;
   [GL.POLYGON_OFFSET_UNITS]?: number;
   [GL.RASTERIZER_DISCARD]?: boolean;
   [GL.SAMPLE_COVERAGE_VALUE]?: number;
   [GL.SAMPLE_COVERAGE_INVERT]?: boolean;
   [GL.SCISSOR_TEST]?: boolean;
   [GL.SCISSOR_BOX]?: [number, number, number, number] | NumberArray;
   [GL.STENCIL_TEST]?: boolean;
   [GL.STENCIL_CLEAR_VALUE]?: number;
   [GL.STENCIL_WRITEMASK]?: number;
   [GL.STENCIL_BACK_WRITEMASK]?: number;
   [GL.STENCIL_FUNC]?: GL_FUNCTION;
   [GL.STENCIL_REF]?: GL_FUNCTION;
   [GL.STENCIL_VALUE_MASK]?: GL_FUNCTION;
   [GL.STENCIL_BACK_FUNC]?: GL_FUNCTION;
   [GL.STENCIL_BACK_REF]?: GL_FUNCTION;
   [GL.STENCIL_BACK_VALUE_MASK]?: GL_FUNCTION;
   [GL.STENCIL_FAIL]?: GL_STENCIL_OP;
   [GL.STENCIL_PASS_DEPTH_FAIL]?: GL_STENCIL_OP;
   [GL.STENCIL_PASS_DEPTH_PASS]?: GL_STENCIL_OP;
   [GL.STENCIL_BACK_FAIL]?: GL_STENCIL_OP;
   [GL.STENCIL_BACK_PASS_DEPTH_FAIL]?: GL_STENCIL_OP;
   [GL.STENCIL_BACK_PASS_DEPTH_PASS]?: GL_STENCIL_OP;
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

export type GLFunctionStyleParameters = {
   // Function-style setters
   framebuffer?: Framebuffer | null;
   blend?: boolean;
   blendColor?: [number, number, number, number] | NumberArray;
   blendEquation?: GL_BLEND_EQUATION | [GL_BLEND_EQUATION, GL_BLEND_EQUATION];
   blendFunc?: 
    [GL_BLEND_FUNCTION, GL_BLEND_FUNCTION] |
    [GL_BLEND_FUNCTION, GL_BLEND_FUNCTION, GL_BLEND_FUNCTION, GL_BLEND_FUNCTION];
 
   clearColor?: [number, number, number, number] | NumberArray;
   clearDepth?: number;
   clearStencil?: number;
 
   colorMask?: [boolean, boolean, boolean, boolean];
 
   cull?: boolean;
   cullFace?: GL.FRONT | GL.BACK | GL.FRONT_AND_BACK;
 
   depthTest?: boolean;
   depthFunc?: GL_FUNCTION;
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
   stencilFunc?: [GL_FUNCTION, number, number] | [GL_FUNCTION, number, number, GL_FUNCTION, number, number];
   stencilOp?: 
    [GL_STENCIL_OP, GL_STENCIL_OP, GL_STENCIL_OP] |
    [GL_STENCIL_OP, GL_STENCIL_OP, GL_STENCIL_OP, GL_STENCIL_OP, GL_STENCIL_OP, GL_STENCIL_OP];
   viewport?: [number, number, number, number] | NumberArray;
 };
 
 export type GLParameters = GLValueParameters | GLFunctionStyleParameters;
