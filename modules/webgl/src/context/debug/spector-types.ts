// Forked from https://github.com/BabylonJS/Spector.js/blob/master/dist/spector.d.ts
/* eslint-disable camelcase, no-shadow */

interface IEvent<T> {
  add(callback: (element: T) => void, context?: any): number;
  remove(id: number): void;
  clear(): void;
  trigger(value: T): void;
}
type EventConstructor = {
  new <T>(): IEvent<T>;
};
enum LogLevel {
  noLog = 0,
  error = 1,
  warning = 2,
  info = 3
}
interface ILogger {
  setLevel(level: LogLevel): void;
  error(msg: string, ...restOfMsg: string[]): void;
  warn(msg: string, ...restOfMsg: string[]): void;
  info(msg: string, ...restOfMsg: string[]): void;
}
type LoggerConstructor = {
  // new (level?: LogLevel): Utils.ConsoleLogger;
};
interface IStackTrace {
  getStackTrace(removeFirstNCalls?: number, removeLastNCalls?: number): string[];
}
type StackTraceConstructor = {
  new (): IStackTrace;
};
interface ITime {
  readonly now: number;
}
type TimeConstructor = {
  new (): ITime;
};
interface ICanvasCapture {
  width: number;
  height: number;
  clientWidth: number;
  clientHeight: number;
  browserAgent: string;
}
interface IContextCapture {
  version: number;
  contextAttributes: any;
  capabilities: {
    [name: string]: any;
  };
  extensions: {
    [name: string]: boolean;
  };
  compressedTextures: {
    [name: string]: any;
  };
}
type State = {
  [stateName: string]: any;
};
type CommandCapturedCallback = (command: ICommandCapture) => void;
type CommandCapturedCallbacks = {
  [name: string]: CommandCapturedCallback[];
};
const enum CommandCaptureStatus {
  Unknown = 0,
  Unused = 10,
  Disabled = 20,
  Redundant = 30,
  Valid = 40,
  Deprecated = 50
}
interface ICommandCapture extends State {
  id: number;
  startTime: number;
  commandEndTime: number;
  endTime: number;
  name: string;
  commandArguments: IArguments;
  result: any;
  stackTrace: string[];
  status: CommandCaptureStatus;
  text: string;
  marker: string;
  consumeCommandId?: number;
  [stateName: string]: any;
}
interface IAnalysis {
  analyserName: string;
  [key: string]: any;
}
interface ICapture {
  canvas: ICanvasCapture;
  context: IContextCapture;
  initState: State;
  commands: ICommandCapture[];
  endState: State;
  startTime: number;
  listenCommandsStartTime: number;
  listenCommandsEndTime: number;
  endTime: number;
  analyses: IAnalysis[];
  frameMemory: {
    [objectName: string]: number;
  };
  memory: {
    [objectName: string]: {
      [second: number]: number;
    };
  };
}
enum CaptureComparisonStatus {
  Equal = 0,
  Different = 1,
  OnlyInA = 2,
  OnlyInB = 3
}
type PropertyComparisonResult = {
  name: string;
  status: CaptureComparisonStatus;
  valueA: any;
  valueB: any;
};
type GroupComparisonResult = {
  name: string;
  groups: GroupComparisonResult[];
  properties: PropertyComparisonResult[];
  status: CaptureComparisonStatus;
};
interface ICommandCaptureComparison {
  groups: GroupComparisonResult[];
  properties: PropertyComparisonResult[];
}
type FunctionIndexer = {
  [key: string]: any;
};
interface IFunctionInformation {
  readonly name: string;
  readonly arguments: IArguments;
  readonly result: any;
  readonly startTime: number;
  readonly endTime: number;
}
type WebGLRenderingContexts = WebGLRenderingContext | WebGL2RenderingContext;
type ExtensionList = {
  [key: string]: any;
};
interface IContextInformation {
  readonly context: WebGLRenderingContexts;
  readonly contextVersion: number;
  readonly toggleCapture?: (capture: boolean) => void;
  readonly tagWebGlObject?: (object: any) => WebGlObjectTag;
  readonly extensions?: ExtensionList;
}
interface WebGlConstant {
  readonly name: string;
  readonly value: number;
  readonly description: string;
  readonly extensionName?: string;
}
export class WebGlConstants {
  static readonly DEPTH_BUFFER_BIT: WebGlConstant;
  static readonly STENCIL_BUFFER_BIT: WebGlConstant;
  static readonly COLOR_BUFFER_BIT: WebGlConstant;
  static readonly POINTS: WebGlConstant;
  static readonly LINES: WebGlConstant;
  static readonly LINE_LOOP: WebGlConstant;
  static readonly LINE_STRIP: WebGlConstant;
  static readonly TRIANGLES: WebGlConstant;
  static readonly TRIANGLE_STRIP: WebGlConstant;
  static readonly TRIANGLE_FAN: WebGlConstant;
  static readonly ZERO: WebGlConstant;
  static readonly ONE: WebGlConstant;
  static readonly SRC_COLOR: WebGlConstant;
  static readonly ONE_MINUS_SRC_COLOR: WebGlConstant;
  static readonly SRC_ALPHA: WebGlConstant;
  static readonly ONE_MINUS_SRC_ALPHA: WebGlConstant;
  static readonly DST_ALPHA: WebGlConstant;
  static readonly ONE_MINUS_DST_ALPHA: WebGlConstant;
  static readonly DST_COLOR: WebGlConstant;
  static readonly ONE_MINUS_DST_COLOR: WebGlConstant;
  static readonly SRC_ALPHA_SATURATE: WebGlConstant;
  static readonly CONSTANT_COLOR: WebGlConstant;
  static readonly ONE_MINUS_CONSTANT_COLOR: WebGlConstant;
  static readonly CONSTANT_ALPHA: WebGlConstant;
  static readonly ONE_MINUS_CONSTANT_ALPHA: WebGlConstant;
  static readonly FUNC_ADD: WebGlConstant;
  static readonly FUNC_SUBSTRACT: WebGlConstant;
  static readonly FUNC_REVERSE_SUBTRACT: WebGlConstant;
  static readonly BLEND_EQUATION: WebGlConstant;
  static readonly BLEND_EQUATION_RGB: WebGlConstant;
  static readonly BLEND_EQUATION_ALPHA: WebGlConstant;
  static readonly BLEND_DST_RGB: WebGlConstant;
  static readonly BLEND_SRC_RGB: WebGlConstant;
  static readonly BLEND_DST_ALPHA: WebGlConstant;
  static readonly BLEND_SRC_ALPHA: WebGlConstant;
  static readonly BLEND_COLOR: WebGlConstant;
  static readonly ARRAY_BUFFER_BINDING: WebGlConstant;
  static readonly ELEMENT_ARRAY_BUFFER_BINDING: WebGlConstant;
  static readonly LINE_WIDTH: WebGlConstant;
  static readonly ALIASED_POINT_SIZE_RANGE: WebGlConstant;
  static readonly ALIASED_LINE_WIDTH_RANGE: WebGlConstant;
  static readonly CULL_FACE_MODE: WebGlConstant;
  static readonly FRONT_FACE: WebGlConstant;
  static readonly DEPTH_RANGE: WebGlConstant;
  static readonly DEPTH_WRITEMASK: WebGlConstant;
  static readonly DEPTH_CLEAR_VALUE: WebGlConstant;
  static readonly DEPTH_FUNC: WebGlConstant;
  static readonly STENCIL_CLEAR_VALUE: WebGlConstant;
  static readonly STENCIL_FUNC: WebGlConstant;
  static readonly STENCIL_FAIL: WebGlConstant;
  static readonly STENCIL_PASS_DEPTH_FAIL: WebGlConstant;
  static readonly STENCIL_PASS_DEPTH_PASS: WebGlConstant;
  static readonly STENCIL_REF: WebGlConstant;
  static readonly STENCIL_VALUE_MASK: WebGlConstant;
  static readonly STENCIL_WRITEMASK: WebGlConstant;
  static readonly STENCIL_BACK_FUNC: WebGlConstant;
  static readonly STENCIL_BACK_FAIL: WebGlConstant;
  static readonly STENCIL_BACK_PASS_DEPTH_FAIL: WebGlConstant;
  static readonly STENCIL_BACK_PASS_DEPTH_PASS: WebGlConstant;
  static readonly STENCIL_BACK_REF: WebGlConstant;
  static readonly STENCIL_BACK_VALUE_MASK: WebGlConstant;
  static readonly STENCIL_BACK_WRITEMASK: WebGlConstant;
  static readonly VIEWPORT: WebGlConstant;
  static readonly SCISSOR_BOX: WebGlConstant;
  static readonly COLOR_CLEAR_VALUE: WebGlConstant;
  static readonly COLOR_WRITEMASK: WebGlConstant;
  static readonly UNPACK_ALIGNMENT: WebGlConstant;
  static readonly PACK_ALIGNMENT: WebGlConstant;
  static readonly MAX_TEXTURE_SIZE: WebGlConstant;
  static readonly MAX_VIEWPORT_DIMS: WebGlConstant;
  static readonly SUBPIXEL_BITS: WebGlConstant;
  static readonly RED_BITS: WebGlConstant;
  static readonly GREEN_BITS: WebGlConstant;
  static readonly BLUE_BITS: WebGlConstant;
  static readonly ALPHA_BITS: WebGlConstant;
  static readonly DEPTH_BITS: WebGlConstant;
  static readonly STENCIL_BITS: WebGlConstant;
  static readonly POLYGON_OFFSET_UNITS: WebGlConstant;
  static readonly POLYGON_OFFSET_FACTOR: WebGlConstant;
  static readonly TEXTURE_BINDING_2D: WebGlConstant;
  static readonly SAMPLE_BUFFERS: WebGlConstant;
  static readonly SAMPLES: WebGlConstant;
  static readonly SAMPLE_COVERAGE_VALUE: WebGlConstant;
  static readonly SAMPLE_COVERAGE_INVERT: WebGlConstant;
  static readonly COMPRESSED_TEXTURE_FORMATS: WebGlConstant;
  static readonly VENDOR: WebGlConstant;
  static readonly RENDERER: WebGlConstant;
  static readonly VERSION: WebGlConstant;
  static readonly IMPLEMENTATION_COLOR_READ_TYPE: WebGlConstant;
  static readonly IMPLEMENTATION_COLOR_READ_FORMAT: WebGlConstant;
  static readonly BROWSER_DEFAULT_WEBGL: WebGlConstant;
  static readonly STATIC_DRAW: WebGlConstant;
  static readonly STREAM_DRAW: WebGlConstant;
  static readonly DYNAMIC_DRAW: WebGlConstant;
  static readonly ARRAY_BUFFER: WebGlConstant;
  static readonly ELEMENT_ARRAY_BUFFER: WebGlConstant;
  static readonly BUFFER_SIZE: WebGlConstant;
  static readonly BUFFER_USAGE: WebGlConstant;
  static readonly CURRENT_VERTEX_ATTRIB: WebGlConstant;
  static readonly VERTEX_ATTRIB_ARRAY_ENABLED: WebGlConstant;
  static readonly VERTEX_ATTRIB_ARRAY_SIZE: WebGlConstant;
  static readonly VERTEX_ATTRIB_ARRAY_STRIDE: WebGlConstant;
  static readonly VERTEX_ATTRIB_ARRAY_TYPE: WebGlConstant;
  static readonly VERTEX_ATTRIB_ARRAY_NORMALIZED: WebGlConstant;
  static readonly VERTEX_ATTRIB_ARRAY_POINTER: WebGlConstant;
  static readonly VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: WebGlConstant;
  static readonly CULL_FACE: WebGlConstant;
  static readonly FRONT: WebGlConstant;
  static readonly BACK: WebGlConstant;
  static readonly FRONT_AND_BACK: WebGlConstant;
  static readonly BLEND: WebGlConstant;
  static readonly DEPTH_TEST: WebGlConstant;
  static readonly DITHER: WebGlConstant;
  static readonly POLYGON_OFFSET_FILL: WebGlConstant;
  static readonly SAMPLE_ALPHA_TO_COVERAGE: WebGlConstant;
  static readonly SAMPLE_COVERAGE: WebGlConstant;
  static readonly SCISSOR_TEST: WebGlConstant;
  static readonly STENCIL_TEST: WebGlConstant;
  static readonly NO_ERROR: WebGlConstant;
  static readonly INVALID_ENUM: WebGlConstant;
  static readonly INVALID_VALUE: WebGlConstant;
  static readonly INVALID_OPERATION: WebGlConstant;
  static readonly OUT_OF_MEMORY: WebGlConstant;
  static readonly CONTEXT_LOST_WEBGL: WebGlConstant;
  static readonly CW: WebGlConstant;
  static readonly CCW: WebGlConstant;
  static readonly DONT_CARE: WebGlConstant;
  static readonly FASTEST: WebGlConstant;
  static readonly NICEST: WebGlConstant;
  static readonly GENERATE_MIPMAP_HINT: WebGlConstant;
  static readonly BYTE: WebGlConstant;
  static readonly UNSIGNED_BYTE: WebGlConstant;
  static readonly SHORT: WebGlConstant;
  static readonly UNSIGNED_SHORT: WebGlConstant;
  static readonly INT: WebGlConstant;
  static readonly UNSIGNED_INT: WebGlConstant;
  static readonly FLOAT: WebGlConstant;
  static readonly DEPTH_COMPONENT: WebGlConstant;
  static readonly ALPHA: WebGlConstant;
  static readonly RGB: WebGlConstant;
  static readonly RGBA: WebGlConstant;
  static readonly LUMINANCE: WebGlConstant;
  static readonly LUMINANCE_ALPHA: WebGlConstant;
  static readonly UNSIGNED_SHORT_4_4_4_4: WebGlConstant;
  static readonly UNSIGNED_SHORT_5_5_5_1: WebGlConstant;
  static readonly UNSIGNED_SHORT_5_6_5: WebGlConstant;
  static readonly FRAGMENT_SHADER: WebGlConstant;
  static readonly VERTEX_SHADER: WebGlConstant;
  static readonly COMPILE_STATUS: WebGlConstant;
  static readonly DELETE_STATUS: WebGlConstant;
  static readonly LINK_STATUS: WebGlConstant;
  static readonly VALIDATE_STATUS: WebGlConstant;
  static readonly ATTACHED_SHADERS: WebGlConstant;
  static readonly ACTIVE_ATTRIBUTES: WebGlConstant;
  static readonly ACTIVE_UNIFORMS: WebGlConstant;
  static readonly MAX_VERTEX_ATTRIBS: WebGlConstant;
  static readonly MAX_VERTEX_UNIFORM_VECTORS: WebGlConstant;
  static readonly MAX_VARYING_VECTORS: WebGlConstant;
  static readonly MAX_COMBINED_TEXTURE_IMAGE_UNITS: WebGlConstant;
  static readonly MAX_VERTEX_TEXTURE_IMAGE_UNITS: WebGlConstant;
  static readonly MAX_TEXTURE_IMAGE_UNITS: WebGlConstant;
  static readonly MAX_FRAGMENT_UNIFORM_VECTORS: WebGlConstant;
  static readonly SHADER_TYPE: WebGlConstant;
  static readonly SHADING_LANGUAGE_VERSION: WebGlConstant;
  static readonly CURRENT_PROGRAM: WebGlConstant;
  static readonly NEVER: WebGlConstant;
  static readonly ALWAYS: WebGlConstant;
  static readonly LESS: WebGlConstant;
  static readonly EQUAL: WebGlConstant;
  static readonly LEQUAL: WebGlConstant;
  static readonly GREATER: WebGlConstant;
  static readonly GEQUAL: WebGlConstant;
  static readonly NOTEQUAL: WebGlConstant;
  static readonly KEEP: WebGlConstant;
  static readonly REPLACE: WebGlConstant;
  static readonly INCR: WebGlConstant;
  static readonly DECR: WebGlConstant;
  static readonly INVERT: WebGlConstant;
  static readonly INCR_WRAP: WebGlConstant;
  static readonly DECR_WRAP: WebGlConstant;
  static readonly NEAREST: WebGlConstant;
  static readonly LINEAR: WebGlConstant;
  static readonly NEAREST_MIPMAP_NEAREST: WebGlConstant;
  static readonly LINEAR_MIPMAP_NEAREST: WebGlConstant;
  static readonly NEAREST_MIPMAP_LINEAR: WebGlConstant;
  static readonly LINEAR_MIPMAP_LINEAR: WebGlConstant;
  static readonly TEXTURE_MAG_FILTER: WebGlConstant;
  static readonly TEXTURE_MIN_FILTER: WebGlConstant;
  static readonly TEXTURE_WRAP_S: WebGlConstant;
  static readonly TEXTURE_WRAP_T: WebGlConstant;
  static readonly TEXTURE_2D: WebGlConstant;
  static readonly TEXTURE: WebGlConstant;
  static readonly TEXTURE_CUBE_MAP: WebGlConstant;
  static readonly TEXTURE_BINDING_CUBE_MAP: WebGlConstant;
  static readonly TEXTURE_CUBE_MAP_POSITIVE_X: WebGlConstant;
  static readonly TEXTURE_CUBE_MAP_NEGATIVE_X: WebGlConstant;
  static readonly TEXTURE_CUBE_MAP_POSITIVE_Y: WebGlConstant;
  static readonly TEXTURE_CUBE_MAP_NEGATIVE_Y: WebGlConstant;
  static readonly TEXTURE_CUBE_MAP_POSITIVE_Z: WebGlConstant;
  static readonly TEXTURE_CUBE_MAP_NEGATIVE_Z: WebGlConstant;
  static readonly MAX_CUBE_MAP_TEXTURE_SIZE: WebGlConstant;
  static readonly TEXTURE0: WebGlConstant;
  static readonly TEXTURE1: WebGlConstant;
  static readonly TEXTURE2: WebGlConstant;
  static readonly TEXTURE3: WebGlConstant;
  static readonly TEXTURE4: WebGlConstant;
  static readonly TEXTURE5: WebGlConstant;
  static readonly TEXTURE6: WebGlConstant;
  static readonly TEXTURE7: WebGlConstant;
  static readonly TEXTURE8: WebGlConstant;
  static readonly TEXTURE9: WebGlConstant;
  static readonly TEXTURE10: WebGlConstant;
  static readonly TEXTURE11: WebGlConstant;
  static readonly TEXTURE12: WebGlConstant;
  static readonly TEXTURE13: WebGlConstant;
  static readonly TEXTURE14: WebGlConstant;
  static readonly TEXTURE15: WebGlConstant;
  static readonly TEXTURE16: WebGlConstant;
  static readonly TEXTURE17: WebGlConstant;
  static readonly TEXTURE18: WebGlConstant;
  static readonly TEXTURE19: WebGlConstant;
  static readonly TEXTURE20: WebGlConstant;
  static readonly TEXTURE21: WebGlConstant;
  static readonly TEXTURE22: WebGlConstant;
  static readonly TEXTURE23: WebGlConstant;
  static readonly TEXTURE24: WebGlConstant;
  static readonly TEXTURE25: WebGlConstant;
  static readonly TEXTURE26: WebGlConstant;
  static readonly TEXTURE27: WebGlConstant;
  static readonly TEXTURE28: WebGlConstant;
  static readonly TEXTURE29: WebGlConstant;
  static readonly TEXTURE30: WebGlConstant;
  static readonly TEXTURE31: WebGlConstant;
  static readonly ACTIVE_TEXTURE: WebGlConstant;
  static readonly REPEAT: WebGlConstant;
  static readonly CLAMP_TO_EDGE: WebGlConstant;
  static readonly MIRRORED_REPEAT: WebGlConstant;
  static readonly FLOAT_VEC2: WebGlConstant;
  static readonly FLOAT_VEC3: WebGlConstant;
  static readonly FLOAT_VEC4: WebGlConstant;
  static readonly INT_VEC2: WebGlConstant;
  static readonly INT_VEC3: WebGlConstant;
  static readonly INT_VEC4: WebGlConstant;
  static readonly BOOL: WebGlConstant;
  static readonly BOOL_VEC2: WebGlConstant;
  static readonly BOOL_VEC3: WebGlConstant;
  static readonly BOOL_VEC4: WebGlConstant;
  static readonly FLOAT_MAT2: WebGlConstant;
  static readonly FLOAT_MAT3: WebGlConstant;
  static readonly FLOAT_MAT4: WebGlConstant;
  static readonly SAMPLER_2D: WebGlConstant;
  static readonly SAMPLER_CUBE: WebGlConstant;
  static readonly LOW_FLOAT: WebGlConstant;
  static readonly MEDIUM_FLOAT: WebGlConstant;
  static readonly HIGH_FLOAT: WebGlConstant;
  static readonly LOW_INT: WebGlConstant;
  static readonly MEDIUM_INT: WebGlConstant;
  static readonly HIGH_INT: WebGlConstant;
  static readonly FRAMEBUFFER: WebGlConstant;
  static readonly RENDERBUFFER: WebGlConstant;
  static readonly RGBA4: WebGlConstant;
  static readonly RGB5_A1: WebGlConstant;
  static readonly RGB565: WebGlConstant;
  static readonly DEPTH_COMPONENT16: WebGlConstant;
  static readonly STENCIL_INDEX: WebGlConstant;
  static readonly STENCIL_INDEX8: WebGlConstant;
  static readonly DEPTH_STENCIL: WebGlConstant;
  static readonly RENDERBUFFER_WIDTH: WebGlConstant;
  static readonly RENDERBUFFER_HEIGHT: WebGlConstant;
  static readonly RENDERBUFFER_INTERNAL_FORMAT: WebGlConstant;
  static readonly RENDERBUFFER_RED_SIZE: WebGlConstant;
  static readonly RENDERBUFFER_GREEN_SIZE: WebGlConstant;
  static readonly RENDERBUFFER_BLUE_SIZE: WebGlConstant;
  static readonly RENDERBUFFER_ALPHA_SIZE: WebGlConstant;
  static readonly RENDERBUFFER_DEPTH_SIZE: WebGlConstant;
  static readonly RENDERBUFFER_STENCIL_SIZE: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: WebGlConstant;
  static readonly COLOR_ATTACHMENT0: WebGlConstant;
  static readonly DEPTH_ATTACHMENT: WebGlConstant;
  static readonly STENCIL_ATTACHMENT: WebGlConstant;
  static readonly DEPTH_STENCIL_ATTACHMENT: WebGlConstant;
  static readonly NONE: WebGlConstant;
  static readonly FRAMEBUFFER_COMPLETE: WebGlConstant;
  static readonly FRAMEBUFFER_INCOMPLETE_ATTACHMENT: WebGlConstant;
  static readonly FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: WebGlConstant;
  static readonly FRAMEBUFFER_INCOMPLETE_DIMENSIONS: WebGlConstant;
  static readonly FRAMEBUFFER_UNSUPPORTED: WebGlConstant;
  static readonly FRAMEBUFFER_BINDING: WebGlConstant;
  static readonly RENDERBUFFER_BINDING: WebGlConstant;
  static readonly MAX_RENDERBUFFER_SIZE: WebGlConstant;
  static readonly INVALID_FRAMEBUFFER_OPERATION: WebGlConstant;
  static readonly UNPACK_FLIP_Y_WEBGL: WebGlConstant;
  static readonly UNPACK_PREMULTIPLY_ALPHA_WEBGL: WebGlConstant;
  static readonly UNPACK_COLORSPACE_CONVERSION_WEBGL: WebGlConstant;
  static readonly READ_BUFFER: WebGlConstant;
  static readonly UNPACK_ROW_LENGTH: WebGlConstant;
  static readonly UNPACK_SKIP_ROWS: WebGlConstant;
  static readonly UNPACK_SKIP_PIXELS: WebGlConstant;
  static readonly PACK_ROW_LENGTH: WebGlConstant;
  static readonly PACK_SKIP_ROWS: WebGlConstant;
  static readonly PACK_SKIP_PIXELS: WebGlConstant;
  static readonly TEXTURE_BINDING_3D: WebGlConstant;
  static readonly UNPACK_SKIP_IMAGES: WebGlConstant;
  static readonly UNPACK_IMAGE_HEIGHT: WebGlConstant;
  static readonly MAX_3D_TEXTURE_SIZE: WebGlConstant;
  static readonly MAX_ELEMENTS_VERTICES: WebGlConstant;
  static readonly MAX_ELEMENTS_INDICES: WebGlConstant;
  static readonly MAX_TEXTURE_LOD_BIAS: WebGlConstant;
  static readonly MAX_FRAGMENT_UNIFORM_COMPONENTS: WebGlConstant;
  static readonly MAX_VERTEX_UNIFORM_COMPONENTS: WebGlConstant;
  static readonly MAX_ARRAY_TEXTURE_LAYERS: WebGlConstant;
  static readonly MIN_PROGRAM_TEXEL_OFFSET: WebGlConstant;
  static readonly MAX_PROGRAM_TEXEL_OFFSET: WebGlConstant;
  static readonly MAX_VARYING_COMPONENTS: WebGlConstant;
  static readonly FRAGMENT_SHADER_DERIVATIVE_HINT: WebGlConstant;
  static readonly RASTERIZER_DISCARD: WebGlConstant;
  static readonly VERTEX_ARRAY_BINDING: WebGlConstant;
  static readonly MAX_VERTEX_OUTPUT_COMPONENTS: WebGlConstant;
  static readonly MAX_FRAGMENT_INPUT_COMPONENTS: WebGlConstant;
  static readonly MAX_SERVER_WAIT_TIMEOUT: WebGlConstant;
  static readonly MAX_ELEMENT_INDEX: WebGlConstant;
  static readonly RED: WebGlConstant;
  static readonly RGB8: WebGlConstant;
  static readonly RGBA8: WebGlConstant;
  static readonly RGB10_A2: WebGlConstant;
  static readonly TEXTURE_3D: WebGlConstant;
  static readonly TEXTURE_WRAP_R: WebGlConstant;
  static readonly TEXTURE_MIN_LOD: WebGlConstant;
  static readonly TEXTURE_MAX_LOD: WebGlConstant;
  static readonly TEXTURE_BASE_LEVEL: WebGlConstant;
  static readonly TEXTURE_MAX_LEVEL: WebGlConstant;
  static readonly TEXTURE_COMPARE_MODE: WebGlConstant;
  static readonly TEXTURE_COMPARE_FUNC: WebGlConstant;
  static readonly SRGB: WebGlConstant;
  static readonly SRGB8: WebGlConstant;
  static readonly SRGB8_ALPHA8: WebGlConstant;
  static readonly COMPARE_REF_TO_TEXTURE: WebGlConstant;
  static readonly RGBA32F: WebGlConstant;
  static readonly RGB32F: WebGlConstant;
  static readonly RGBA16F: WebGlConstant;
  static readonly RGB16F: WebGlConstant;
  static readonly TEXTURE_2D_ARRAY: WebGlConstant;
  static readonly TEXTURE_BINDING_2D_ARRAY: WebGlConstant;
  static readonly R11F_G11F_B10F: WebGlConstant;
  static readonly RGB9_E5: WebGlConstant;
  static readonly RGBA32UI: WebGlConstant;
  static readonly RGB32UI: WebGlConstant;
  static readonly RGBA16UI: WebGlConstant;
  static readonly RGB16UI: WebGlConstant;
  static readonly RGBA8UI: WebGlConstant;
  static readonly RGB8UI: WebGlConstant;
  static readonly RGBA32I: WebGlConstant;
  static readonly RGB32I: WebGlConstant;
  static readonly RGBA16I: WebGlConstant;
  static readonly RGB16I: WebGlConstant;
  static readonly RGBA8I: WebGlConstant;
  static readonly RGB8I: WebGlConstant;
  static readonly RED_INTEGER: WebGlConstant;
  static readonly RGB_INTEGER: WebGlConstant;
  static readonly RGBA_INTEGER: WebGlConstant;
  static readonly R8: WebGlConstant;
  static readonly RG8: WebGlConstant;
  static readonly R16F: WebGlConstant;
  static readonly R32F: WebGlConstant;
  static readonly RG16F: WebGlConstant;
  static readonly RG32F: WebGlConstant;
  static readonly R8I: WebGlConstant;
  static readonly R8UI: WebGlConstant;
  static readonly R16I: WebGlConstant;
  static readonly R16UI: WebGlConstant;
  static readonly R32I: WebGlConstant;
  static readonly R32UI: WebGlConstant;
  static readonly RG8I: WebGlConstant;
  static readonly RG8UI: WebGlConstant;
  static readonly RG16I: WebGlConstant;
  static readonly RG16UI: WebGlConstant;
  static readonly RG32I: WebGlConstant;
  static readonly RG32UI: WebGlConstant;
  static readonly R8_SNORM: WebGlConstant;
  static readonly RG8_SNORM: WebGlConstant;
  static readonly RGB8_SNORM: WebGlConstant;
  static readonly RGBA8_SNORM: WebGlConstant;
  static readonly RGB10_A2UI: WebGlConstant;
  static readonly TEXTURE_IMMUTABLE_FORMAT: WebGlConstant;
  static readonly TEXTURE_IMMUTABLE_LEVELS: WebGlConstant;
  static readonly UNSIGNED_INT_2_10_10_10_REV: WebGlConstant;
  static readonly UNSIGNED_INT_10F_11F_11F_REV: WebGlConstant;
  static readonly UNSIGNED_INT_5_9_9_9_REV: WebGlConstant;
  static readonly FLOAT_32_UNSIGNED_INT_24_8_REV: WebGlConstant;
  static readonly UNSIGNED_INT_24_8: WebGlConstant;
  static readonly HALF_FLOAT: WebGlConstant;
  static readonly RG: WebGlConstant;
  static readonly RG_INTEGER: WebGlConstant;
  static readonly INT_2_10_10_10_REV: WebGlConstant;
  static readonly CURRENT_QUERY: WebGlConstant;
  static readonly QUERY_RESULT: WebGlConstant;
  static readonly QUERY_RESULT_AVAILABLE: WebGlConstant;
  static readonly ANY_SAMPLES_PASSED: WebGlConstant;
  static readonly ANY_SAMPLES_PASSED_CONSERVATIVE: WebGlConstant;
  static readonly MAX_DRAW_BUFFERS: WebGlConstant;
  static readonly DRAW_BUFFER0: WebGlConstant;
  static readonly DRAW_BUFFER1: WebGlConstant;
  static readonly DRAW_BUFFER2: WebGlConstant;
  static readonly DRAW_BUFFER3: WebGlConstant;
  static readonly DRAW_BUFFER4: WebGlConstant;
  static readonly DRAW_BUFFER5: WebGlConstant;
  static readonly DRAW_BUFFER6: WebGlConstant;
  static readonly DRAW_BUFFER7: WebGlConstant;
  static readonly DRAW_BUFFER8: WebGlConstant;
  static readonly DRAW_BUFFER9: WebGlConstant;
  static readonly DRAW_BUFFER10: WebGlConstant;
  static readonly DRAW_BUFFER11: WebGlConstant;
  static readonly DRAW_BUFFER12: WebGlConstant;
  static readonly DRAW_BUFFER13: WebGlConstant;
  static readonly DRAW_BUFFER14: WebGlConstant;
  static readonly DRAW_BUFFER15: WebGlConstant;
  static readonly MAX_COLOR_ATTACHMENTS: WebGlConstant;
  static readonly COLOR_ATTACHMENT1: WebGlConstant;
  static readonly COLOR_ATTACHMENT2: WebGlConstant;
  static readonly COLOR_ATTACHMENT3: WebGlConstant;
  static readonly COLOR_ATTACHMENT4: WebGlConstant;
  static readonly COLOR_ATTACHMENT5: WebGlConstant;
  static readonly COLOR_ATTACHMENT6: WebGlConstant;
  static readonly COLOR_ATTACHMENT7: WebGlConstant;
  static readonly COLOR_ATTACHMENT8: WebGlConstant;
  static readonly COLOR_ATTACHMENT9: WebGlConstant;
  static readonly COLOR_ATTACHMENT10: WebGlConstant;
  static readonly COLOR_ATTACHMENT11: WebGlConstant;
  static readonly COLOR_ATTACHMENT12: WebGlConstant;
  static readonly COLOR_ATTACHMENT13: WebGlConstant;
  static readonly COLOR_ATTACHMENT14: WebGlConstant;
  static readonly COLOR_ATTACHMENT15: WebGlConstant;
  static readonly SAMPLER_3D: WebGlConstant;
  static readonly SAMPLER_2D_SHADOW: WebGlConstant;
  static readonly SAMPLER_2D_ARRAY: WebGlConstant;
  static readonly SAMPLER_2D_ARRAY_SHADOW: WebGlConstant;
  static readonly SAMPLER_CUBE_SHADOW: WebGlConstant;
  static readonly INT_SAMPLER_2D: WebGlConstant;
  static readonly INT_SAMPLER_3D: WebGlConstant;
  static readonly INT_SAMPLER_CUBE: WebGlConstant;
  static readonly INT_SAMPLER_2D_ARRAY: WebGlConstant;
  static readonly UNSIGNED_INT_SAMPLER_2D: WebGlConstant;
  static readonly UNSIGNED_INT_SAMPLER_3D: WebGlConstant;
  static readonly UNSIGNED_INT_SAMPLER_CUBE: WebGlConstant;
  static readonly UNSIGNED_INT_SAMPLER_2D_ARRAY: WebGlConstant;
  static readonly MAX_SAMPLES: WebGlConstant;
  static readonly SAMPLER_BINDING: WebGlConstant;
  static readonly PIXEL_PACK_BUFFER: WebGlConstant;
  static readonly PIXEL_UNPACK_BUFFER: WebGlConstant;
  static readonly PIXEL_PACK_BUFFER_BINDING: WebGlConstant;
  static readonly PIXEL_UNPACK_BUFFER_BINDING: WebGlConstant;
  static readonly COPY_READ_BUFFER: WebGlConstant;
  static readonly COPY_WRITE_BUFFER: WebGlConstant;
  static readonly COPY_READ_BUFFER_BINDING: WebGlConstant;
  static readonly COPY_WRITE_BUFFER_BINDING: WebGlConstant;
  static readonly FLOAT_MAT2x3: WebGlConstant;
  static readonly FLOAT_MAT2x4: WebGlConstant;
  static readonly FLOAT_MAT3x2: WebGlConstant;
  static readonly FLOAT_MAT3x4: WebGlConstant;
  static readonly FLOAT_MAT4x2: WebGlConstant;
  static readonly FLOAT_MAT4x3: WebGlConstant;
  static readonly UNSIGNED_INT_VEC2: WebGlConstant;
  static readonly UNSIGNED_INT_VEC3: WebGlConstant;
  static readonly UNSIGNED_INT_VEC4: WebGlConstant;
  static readonly UNSIGNED_NORMALIZED: WebGlConstant;
  static readonly SIGNED_NORMALIZED: WebGlConstant;
  static readonly VERTEX_ATTRIB_ARRAY_INTEGER: WebGlConstant;
  static readonly VERTEX_ATTRIB_ARRAY_DIVISOR: WebGlConstant;
  static readonly TRANSFORM_FEEDBACK_BUFFER_MODE: WebGlConstant;
  static readonly MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS: WebGlConstant;
  static readonly TRANSFORM_FEEDBACK_VARYINGS: WebGlConstant;
  static readonly TRANSFORM_FEEDBACK_BUFFER_START: WebGlConstant;
  static readonly TRANSFORM_FEEDBACK_BUFFER_SIZE: WebGlConstant;
  static readonly TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: WebGlConstant;
  static readonly MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: WebGlConstant;
  static readonly MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: WebGlConstant;
  static readonly INTERLEAVED_ATTRIBS: WebGlConstant;
  static readonly SEPARATE_ATTRIBS: WebGlConstant;
  static readonly TRANSFORM_FEEDBACK_BUFFER: WebGlConstant;
  static readonly TRANSFORM_FEEDBACK_BUFFER_BINDING: WebGlConstant;
  static readonly TRANSFORM_FEEDBACK: WebGlConstant;
  static readonly TRANSFORM_FEEDBACK_PAUSED: WebGlConstant;
  static readonly TRANSFORM_FEEDBACK_ACTIVE: WebGlConstant;
  static readonly TRANSFORM_FEEDBACK_BINDING: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_RED_SIZE: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: WebGlConstant;
  static readonly FRAMEBUFFER_DEFAULT: WebGlConstant;
  static readonly DEPTH24_STENCIL8: WebGlConstant;
  static readonly DRAW_FRAMEBUFFER_BINDING: WebGlConstant;
  static readonly READ_FRAMEBUFFER: WebGlConstant;
  static readonly DRAW_FRAMEBUFFER: WebGlConstant;
  static readonly READ_FRAMEBUFFER_BINDING: WebGlConstant;
  static readonly RENDERBUFFER_SAMPLES: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: WebGlConstant;
  static readonly FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: WebGlConstant;
  static readonly UNIFORM_BUFFER: WebGlConstant;
  static readonly UNIFORM_BUFFER_BINDING: WebGlConstant;
  static readonly UNIFORM_BUFFER_START: WebGlConstant;
  static readonly UNIFORM_BUFFER_SIZE: WebGlConstant;
  static readonly MAX_VERTEX_UNIFORM_BLOCKS: WebGlConstant;
  static readonly MAX_FRAGMENT_UNIFORM_BLOCKS: WebGlConstant;
  static readonly MAX_COMBINED_UNIFORM_BLOCKS: WebGlConstant;
  static readonly MAX_UNIFORM_BUFFER_BINDINGS: WebGlConstant;
  static readonly MAX_UNIFORM_BLOCK_SIZE: WebGlConstant;
  static readonly MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: WebGlConstant;
  static readonly MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: WebGlConstant;
  static readonly UNIFORM_BUFFER_OFFSET_ALIGNMENT: WebGlConstant;
  static readonly ACTIVE_UNIFORM_BLOCKS: WebGlConstant;
  static readonly UNIFORM_TYPE: WebGlConstant;
  static readonly UNIFORM_SIZE: WebGlConstant;
  static readonly UNIFORM_BLOCK_INDEX: WebGlConstant;
  static readonly UNIFORM_OFFSET: WebGlConstant;
  static readonly UNIFORM_ARRAY_STRIDE: WebGlConstant;
  static readonly UNIFORM_MATRIX_STRIDE: WebGlConstant;
  static readonly UNIFORM_IS_ROW_MAJOR: WebGlConstant;
  static readonly UNIFORM_BLOCK_BINDING: WebGlConstant;
  static readonly UNIFORM_BLOCK_DATA_SIZE: WebGlConstant;
  static readonly UNIFORM_BLOCK_ACTIVE_UNIFORMS: WebGlConstant;
  static readonly UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES: WebGlConstant;
  static readonly UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER: WebGlConstant;
  static readonly UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER: WebGlConstant;
  static readonly OBJECT_TYPE: WebGlConstant;
  static readonly SYNC_CONDITION: WebGlConstant;
  static readonly SYNC_STATUS: WebGlConstant;
  static readonly SYNC_FLAGS: WebGlConstant;
  static readonly SYNC_FENCE: WebGlConstant;
  static readonly SYNC_GPU_COMMANDS_COMPLETE: WebGlConstant;
  static readonly UNSIGNALED: WebGlConstant;
  static readonly SIGNALED: WebGlConstant;
  static readonly ALREADY_SIGNALED: WebGlConstant;
  static readonly TIMEOUT_EXPIRED: WebGlConstant;
  static readonly CONDITION_SATISFIED: WebGlConstant;
  static readonly WAIT_FAILED: WebGlConstant;
  static readonly SYNC_FLUSH_COMMANDS_BIT: WebGlConstant;
  static readonly COLOR: WebGlConstant;
  static readonly DEPTH: WebGlConstant;
  static readonly STENCIL: WebGlConstant;
  static readonly MIN: WebGlConstant;
  static readonly MAX: WebGlConstant;
  static readonly DEPTH_COMPONENT24: WebGlConstant;
  static readonly STREAM_READ: WebGlConstant;
  static readonly STREAM_COPY: WebGlConstant;
  static readonly STATIC_READ: WebGlConstant;
  static readonly STATIC_COPY: WebGlConstant;
  static readonly DYNAMIC_READ: WebGlConstant;
  static readonly DYNAMIC_COPY: WebGlConstant;
  static readonly DEPTH_COMPONENT32F: WebGlConstant;
  static readonly DEPTH32F_STENCIL8: WebGlConstant;
  static readonly INVALID_INDEX: WebGlConstant;
  static readonly TIMEOUT_IGNORED: WebGlConstant;
  static readonly MAX_CLIENT_WAIT_TIMEOUT_WEBGL: WebGlConstant;
  static readonly VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE: WebGlConstant;
  static readonly UNMASKED_VENDOR_WEBGL: WebGlConstant;
  static readonly UNMASKED_RENDERER_WEBGL: WebGlConstant;
  static readonly MAX_TEXTURE_MAX_ANISOTROPY_EXT: WebGlConstant;
  static readonly TEXTURE_MAX_ANISOTROPY_EXT: WebGlConstant;
  static readonly COMPRESSED_RGB_S3TC_DXT1_EXT: WebGlConstant;
  static readonly COMPRESSED_RGBA_S3TC_DXT1_EXT: WebGlConstant;
  static readonly COMPRESSED_RGBA_S3TC_DXT3_EXT: WebGlConstant;
  static readonly COMPRESSED_RGBA_S3TC_DXT5_EXT: WebGlConstant;
  static readonly COMPRESSED_R11_EAC: WebGlConstant;
  static readonly COMPRESSED_SIGNED_R11_EAC: WebGlConstant;
  static readonly COMPRESSED_RG11_EAC: WebGlConstant;
  static readonly COMPRESSED_SIGNED_RG11_EAC: WebGlConstant;
  static readonly COMPRESSED_RGB8_ETC2: WebGlConstant;
  static readonly COMPRESSED_RGBA8_ETC2_EAC: WebGlConstant;
  static readonly COMPRESSED_SRGB8_ETC2: WebGlConstant;
  static readonly COMPRESSED_SRGB8_ALPHA8_ETC2_EAC: WebGlConstant;
  static readonly COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2: WebGlConstant;
  static readonly COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2: WebGlConstant;
  static readonly COMPRESSED_RGB_PVRTC_4BPPV1_IMG: WebGlConstant;
  static readonly COMPRESSED_RGBA_PVRTC_4BPPV1_IMG: WebGlConstant;
  static readonly COMPRESSED_RGB_PVRTC_2BPPV1_IMG: WebGlConstant;
  static readonly COMPRESSED_RGBA_PVRTC_2BPPV1_IMG: WebGlConstant;
  static readonly COMPRESSED_RGB_ETC1_WEBGL: WebGlConstant;
  static readonly COMPRESSED_RGB_ATC_WEBGL: WebGlConstant;
  static readonly COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL: WebGlConstant;
  static readonly COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL: WebGlConstant;
  static readonly UNSIGNED_INT_24_8_WEBGL: WebGlConstant;
  static readonly HALF_FLOAT_OES: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT: WebGlConstant;
  static readonly UNSIGNED_NORMALIZED_EXT: WebGlConstant;
  static readonly MIN_EXT: WebGlConstant;
  static readonly MAX_EXT: WebGlConstant;
  static readonly SRGB_EXT: WebGlConstant;
  static readonly SRGB_ALPHA_EXT: WebGlConstant;
  static readonly SRGB8_ALPHA8_EXT: WebGlConstant;
  static readonly FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT: WebGlConstant;
  static readonly FRAGMENT_SHADER_DERIVATIVE_HINT_OES: WebGlConstant;
  static readonly COLOR_ATTACHMENT0_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT1_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT2_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT3_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT4_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT5_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT6_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT7_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT8_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT9_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT10_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT11_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT12_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT13_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT14_WEBGL: WebGlConstant;
  static readonly COLOR_ATTACHMENT15_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER0_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER1_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER2_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER3_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER4_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER5_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER6_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER7_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER8_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER9_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER10_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER11_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER12_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER13_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER14_WEBGL: WebGlConstant;
  static readonly DRAW_BUFFER15_WEBGL: WebGlConstant;
  static readonly MAX_COLOR_ATTACHMENTS_WEBGL: WebGlConstant;
  static readonly MAX_DRAW_BUFFERS_WEBGL: WebGlConstant;
  static readonly VERTEX_ARRAY_BINDING_OES: WebGlConstant;
  static readonly QUERY_COUNTER_BITS_EXT: WebGlConstant;
  static readonly CURRENT_QUERY_EXT: WebGlConstant;
  static readonly QUERY_RESULT_EXT: WebGlConstant;
  static readonly QUERY_RESULT_AVAILABLE_EXT: WebGlConstant;
  static readonly TIME_ELAPSED_EXT: WebGlConstant;
  static readonly TIMESTAMP_EXT: WebGlConstant;
  static readonly GPU_DISJOINT_EXT: WebGlConstant;
  // static isWebGlConstant(value: number): boolean;
  // static stringifyWebGlConstant(value: number, command: string): string;
  protected static readonly zeroMeaningByCommand: {
    [commandName: string]: string;
  };
  protected static readonly oneMeaningByCommand: {
    [commandName: string]: string;
  };
}
interface ITimeSpy {
  onFrameStart: IEvent<ITimeSpy>;
  onFrameEnd: IEvent<ITimeSpy>;
  onError: IEvent<string>;
  playNextFrame(): void;
  changeSpeedRatio(ratio: number): void;
  getFps(): number;
}
interface ITimeSpyOptions {
  spiedWindow?: {
    [name: string]: Function;
  };
  eventConstructor: EventConstructor;
  timeConstructor: TimeConstructor;
}
type TimeSpyConstructor = {
  new (options: ITimeSpyOptions, logger: ILogger): ITimeSpy;
};
interface ICanvasSpy {
  readonly onContextRequested: IEvent<IContextInformation>;
}
interface ICanvasSpyOptions {
  readonly canvas?: HTMLCanvasElement;
  readonly eventConstructor: EventConstructor;
}
type CanvasSpyConstructor = {
  new (options: ICanvasSpyOptions, logger: ILogger): ICanvasSpy;
};
interface IContextSpy {
  context: WebGLRenderingContexts;
  version: number;
  onMaxCommand: IEvent<IContextSpy>;
  spy(): void;
  unSpy(): void;
  startCapture(maxCommands?: number, quickCapture?: boolean): void;
  stopCapture(): ICapture;
  setMarker(marker: string): void;
  clearMarker(): void;
  isCapturing(): boolean;
  getNextCommandCaptureId(): number;
}
interface IContextSpyOptions {
  context: WebGLRenderingContexts;
  version: number;
  recordAlways?: boolean;
  injection: InjectionType;
}
type ContextSpyConstructor = {
  new (options: IContextSpyOptions, time: ITime, logger: ILogger): IContextSpy;
};
interface ICommandSpy {
  readonly spiedCommandName: string;
  createCapture(
    functionInformation: IFunctionInformation,
    commandCaptureId: number,
    marker: string
  ): ICommandCapture;
  spy(): void;
  unSpy(): void;
}
type CommandSpyCallback = (command: ICommandSpy, functionInformation: IFunctionInformation) => void;
interface ICommandSpyOptions extends IStateOptions {
  readonly spiedCommandName: string;
  readonly spiedCommandRunningContext: any;
  readonly callback: CommandSpyCallback;
  readonly commandNamespace: FunctionIndexer;
  readonly stackTraceCtor: StackTraceConstructor;
  readonly defaultCommandCtor: CommandConstructor;
}
type CommandSpyConstructor = {
  new (options: ICommandSpyOptions, time: ITime, logger: ILogger): ICommandSpy;
};
interface ICommand {
  readonly spiedCommandName: string;
  createCapture(
    functionInformation: IFunctionInformation,
    commandCaptureId: number,
    marker: string
  ): ICommandCapture;
}
interface ICommandOptions extends IContextInformation {
  readonly spiedCommandName: string;
}
type CommandConstructor = {
  new (options: ICommandOptions, stackTrace: IStackTrace, logger: ILogger): ICommand;
};
interface IRecorderSpy {
  readonly contextInformation: IContextInformation;
  recordCommand(functionInformation: IFunctionInformation): void;
  startCapture(): void;
  stopCapture(): void;
  appendRecordedInformation(capture: ICapture): void;
}
interface IRecorderSpyOptions {
  readonly contextInformation: IContextInformation;
  readonly recorderNamespace: FunctionIndexer;
  readonly timeConstructor: TimeConstructor;
}
type RecorderSpyConstructor = {
  new (options: IRecorderSpyOptions, logger: ILogger): IRecorderSpy;
};
interface IStateSpy {
  readonly contextInformation: IContextInformation;
  startCapture(currentCapture: ICapture, quickCapture: boolean): void;
  stopCapture(currentCapture: ICapture): void;
  captureState(commandCapture: ICommandCapture): void;
}
interface IStateSpyOptions {
  readonly contextInformation: IContextInformation;
  readonly stateNamespace: FunctionIndexer;
}
type StateSpyConstructor = {
  new (options: IStateSpyOptions, logger: ILogger): IStateSpy;
};
interface IWebGlObjectSpy {
  readonly contextInformation: IContextInformation;
  tagWebGlObjects(functionInformation: IFunctionInformation): void;
  tagWebGlObject(object: any): WebGlObjectTag;
}
interface IWebGlObjectSpyOptions {
  readonly contextInformation: IContextInformation;
  readonly webGlObjectNamespace: FunctionIndexer;
}
type WebGlObjectSpyConstructor = {
  new (options: IWebGlObjectSpyOptions, logger: ILogger): IWebGlObjectSpy;
};
type StateData = {
  [key: string]: any;
};
interface IState {
  readonly stateName: string;
  readonly requireStartAndStopStates: boolean;
  registerCallbacks(callbacks: CommandCapturedCallbacks): void;
  startCapture(loadFromContext: boolean, quickCapture: boolean): State;
  stopCapture(): State;
  getStateData(): StateData;
}
interface IStateOptions extends IContextInformation {
  readonly stateName?: string;
}
type StateConstructor = {
  new (options: IStateOptions, logger: ILogger): IState;
};
interface IExtensions extends IState {
  getExtensions(): ExtensionList;
}
type ExtensionsConstructor = {
  new (options: IStateOptions, logger: ILogger): IExtensions;
};
type WebGlObjectTag = {
  readonly typeName: string;
  readonly id: number;
  displayText?: string;
  customData?: any;
};
interface ICaptureAnalyser {
  appendAnalyses(capture: ICapture): void;
}
interface ICaptureAnalyserOptions {
  readonly contextInformation: IContextInformation;
  readonly analyserNamespace: FunctionIndexer;
}
type CaptureAnalyserConstructor = {
  new (options: ICaptureAnalyserOptions, logger: ILogger): ICaptureAnalyser;
};
interface ICommandComparator {
  compare(commandA: ICommandCapture, commandB: ICommandCapture): ICommandCaptureComparison;
}
type CommandComparatorConstructor = {
  new (logger: ILogger): ICommandComparator;
};
interface ICanvasInformation {
  id: string;
  width: number;
  height: number;
  ref: any;
}
interface ICaptureMenu {
  readonly onCanvasSelected: IEvent<ICanvasInformation>;
  readonly onCaptureRequested: IEvent<ICanvasInformation>;
  readonly onPauseRequested: IEvent<ICanvasInformation>;
  readonly onPlayRequested: IEvent<ICanvasInformation>;
  readonly onPlayNextFrameRequested: IEvent<ICanvasInformation>;
  display(): void;
  trackPageCanvases(): void;
  updateCanvasesList(canvases: NodeListOf<HTMLCanvasElement>): void;
  updateCanvasesListInformation(canvasesInformation: ICanvasInformation[]): void;
  getSelectedCanvasInformation(): ICanvasInformation;
  hide(): void;
  captureComplete(errorText: string): void;
  setFPS(fps: number): void;
}
interface ICaptureMenuOptions {
  readonly eventConstructor: EventConstructor;
  readonly rootPlaceHolder?: Element;
  readonly canvas?: HTMLCanvasElement;
  readonly hideLog?: boolean;
}
type CaptureMenuConstructor = {
  new (options: ICaptureMenuOptions, logger: ILogger): ICaptureMenu;
};
interface ISourceCodeChangeEvent {
  sourceVertex: string;
  sourceFragment: string;
  programId: number;
}
interface IResultView {
  readonly onSourceCodeChanged: IEvent<ISourceCodeChangeEvent>;
  display(): void;
  hide(): void;
  addCapture(capture: ICapture): number;
  selectCapture(captureId: number): void;
  showSourceCodeError(error: string): void;
}
interface IResultViewOptions {
  readonly eventConstructor: EventConstructor;
  readonly rootPlaceHolder?: Element;
}
type ResultViewConstructor = {
  new (options: IResultViewOptions, logger: ILogger): IResultView;
};
type InjectionType = {
  readonly WebGlObjectNamespace: FunctionIndexer;
  readonly RecorderNamespace: FunctionIndexer;
  readonly CommandNamespace: FunctionIndexer;
  readonly StateNamespace: FunctionIndexer;
  readonly AnalyserNamespace: FunctionIndexer;
  readonly StackTraceCtor: StackTraceConstructor;
  readonly LoggerCtor: LoggerConstructor;
  readonly EventCtor: EventConstructor;
  readonly TimeCtor: TimeConstructor;
  readonly CanvasSpyCtor: CanvasSpyConstructor;
  readonly CommandSpyCtor: CommandSpyConstructor;
  readonly ContextSpyCtor: ContextSpyConstructor;
  readonly RecorderSpyCtor: RecorderSpyConstructor;
  readonly StateSpyCtor: StateSpyConstructor;
  readonly TimeSpyCtor: TimeSpyConstructor;
  readonly WebGlObjectSpyCtor: WebGlObjectSpyConstructor;
  readonly CaptureAnalyserCtor: CaptureAnalyserConstructor;
  readonly ExtensionsCtor: ExtensionsConstructor;
  readonly CapabilitiesCtor: StateConstructor;
  readonly CompressedTexturesCtor: StateConstructor;
  readonly DefaultCommandCtor: CommandConstructor;
  readonly CommandComparatorCtor: CommandComparatorConstructor;
  readonly CaptureMenuConstructor: CaptureMenuConstructor;
  readonly ResultViewConstructor: ResultViewConstructor;
};
interface ISpectorOptions {
  readonly injection?: InjectionType;
}
interface IAvailableContext {
  readonly canvas: HTMLCanvasElement;
  readonly contextSpy: IContextSpy;
}
export abstract class Spector {
  protected options;
  static getFirstAvailable3dContext(canvas: HTMLCanvasElement): WebGLRenderingContexts {
    return null as any;
  }
  protected static tryGetContextFromHelperField: unknown;
  protected static tryGetContextFromCanvas: unknown;
  readonly onCaptureStarted: IEvent<any>;
  readonly onCapture: IEvent<ICapture>;
  readonly onError: IEvent<string>;
  protected readonly logger;
  protected readonly timeSpy;
  protected readonly contexts;
  protected readonly injection;
  protected readonly time;
  protected canvasSpy;
  protected captureNextFrames;
  protected captureNextCommands;
  protected quickCapture;
  protected capturingContext;
  protected captureMenu;
  protected resultView;
  protected retry;
  protected noFrameTimeout;
  protected marker;
  constructor(options?: ISpectorOptions) {}
  abstract displayUI(): void;
  abstract getResultUI(): IResultView;
  abstract getCaptureUI(): ICaptureMenu;
  abstract rebuildProgramFromProgramId(
    programId: number,
    vertexSourceCode: string,
    fragmentSourceCode: string,
    onCompiled: (program: WebGLProgram) => void,
    onError: (message: string) => void
  ): void;
  abstract rebuildProgram(
    program: WebGLProgram,
    vertexSourceCode: string,
    fragmentSourceCode: string,
    onCompiled: (program: WebGLProgram) => void,
    onError: (message: string) => void
  ): void;
  abstract referenceNewProgram(programId: number, program: WebGLProgram): void;
  abstract pause(): void;
  abstract play(): void;
  abstract playNextFrame(): void;
  abstract drawOnlyEveryXFrame(x: number): void;
  abstract getFps(): number;
  abstract spyCanvases(): void;
  abstract spyCanvas(canvas: HTMLCanvasElement): void;
  abstract getAvailableContexts(): IAvailableContext[];
  abstract captureCanvas(
    canvas: HTMLCanvasElement,
    commandCount?: number,
    quickCapture?: boolean
  ): void;
  abstract captureContext(
    context: WebGLRenderingContexts,
    commandCount?: number,
    quickCapture?: boolean
  ): void;
  abstract captureContextSpy(
    contextSpy: IContextSpy,
    commandCount?: number,
    quickCapture?: boolean
  ): void;
  abstract captureNextFrame(
    obj: HTMLCanvasElement | WebGLRenderingContexts,
    quickCapture?: boolean
  ): void;
  abstract startCapture(
    obj: HTMLCanvasElement | WebGLRenderingContexts,
    commandCount: number,
    quickCapture?: boolean
  ): void;
  abstract stopCapture(): ICapture;
  abstract setMarker(marker: string): void;
  abstract clearMarker(): void;
  protected captureFrames;
  protected captureCommands;
  protected spyContext;
  protected getAvailableContextSpyByCanvas;
  protected onFrameStart;
  protected onFrameEnd;
  protected triggerCapture;
  protected onErrorInternal;
}
