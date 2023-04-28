// luma.gl, MIT license

export {VERSION} from './init';

// MAIN API ACCESS POINTS
export {default as luma} from './lib/luma';

export type {DeviceProps, DeviceLimits, DeviceInfo, DeviceFeature} from './adapter/device';
export {default as Device} from './adapter/device';
export type {CanvasContextProps} from './adapter/canvas-context';
export {default as CanvasContext} from './adapter/canvas-context';

// GPU RESOURCES
export type {ResourceProps} from './adapter/resources/resource';
export {default as Resource} from './adapter/resources/resource';
export type {BufferProps} from './adapter/resources/buffer';
export {default as Buffer} from './adapter/resources/buffer';
export type {TextureProps, TextureData} from './adapter/resources/texture';
export {default as Texture} from './adapter/resources/texture';
export type {ExternalTextureProps} from './adapter/resources/external-texture';
export {default as ExternalTexture} from './adapter/resources/external-texture';
export type {ShaderProps} from './adapter/resources/shader';
export {default as Shader} from './adapter/resources/shader';
export type {SamplerProps, SamplerParameters} from './adapter/resources/sampler';
export {default as Sampler} from './adapter/resources/sampler';
export type {FramebufferProps} from './adapter/resources/framebuffer';
export {default as Framebuffer} from './adapter/resources/framebuffer';

export type {RenderPipelineProps} from './adapter/resources/render-pipeline';
export {default as RenderPipeline} from './adapter/resources/render-pipeline';

export type {ComputePipelineProps} from './adapter/resources/compute-pipeline';
export {default as ComputePipeline} from './adapter/resources/compute-pipeline';
export type {CommandEncoderProps} from './adapter/resources/command-encoder';
export {default as CommandEncoder} from './adapter/resources/command-encoder';
export type {RenderPassProps} from './adapter/resources/render-pass';
export {default as RenderPass} from './adapter/resources/render-pass';
export type {ComputePassProps} from './adapter/resources/compute-pass';
export {default as ComputePass} from './adapter/resources/compute-pass';


// API TYPES
export type {CompilerMessage} from './lib/compiler-log/compiler-message';
export type {AccessorObject} from './adapter/types/accessor';
export type {
  Parameters,
  PrimitiveTopology,
  IndexFormat,
  CullMode,
  FrontFace,
  RasterizationParameters,
  CompareFunction,
  StencilOperation,
  DepthStencilParameters,
  BlendFactor,
  BlendOperation,
  ColorParameters,
  MultisampleParameters,
  RenderPassParameters,
  RenderPipelineParameters
} from './adapter/types/parameters';

export type {VertexFormat} from './adapter/types/vertex-formats';
export type {UniformFormat} from './adapter/types/uniform-formats';
export type {
  TextureFormat,
  ColorTextureFormat,
  DepthStencilTextureFormat
} from './adapter/types/texture-formats';
export type {ColorAttachment, DepthStencilAttachment} from './adapter/types/types';

export type {
  ShaderLayout,
  ProgramBindings,
  AttributeLayout,
  BindingLayout,
  Binding,
  //
  BufferMapping,
  // Deprecated, todo
  AttributeBinding,
  UniformBinding,
  UniformBlockBinding,
  VaryingBinding
} from './adapter/types/shader-layout';

export {default as UniformBufferLayout} from './lib/uniform-buffer-layout';
export {default as UniformBlock} from './lib/uniform-block';

// API UTILS
export {decodeVertexFormat} from './adapter/utils/decode-vertex-format';
export {decodeTextureFormat} from './adapter/utils/decode-texture-format';

// GENERAL TYPES
export type {
  TypedArray,
  TypedArrayConstructor,
  NumberArray,
  NumericArray,
  BigIntOrNumberArray,
  BigIntOrNumericArray,
  ConstructorOf,
  PartialBy
} from './types';

// GENERAL UTILS

export {default as StatsManager} from './lib/utils/stats-manager';
export {assert} from './lib/utils/assert';
export {cast} from './lib/utils/cast';
export {log} from './lib/utils/log';
export {uid, isPowerOfTwo, isObjectEmpty} from './lib/utils/utils';
export {formatValue} from './lib/utils/format-value';
export {stubRemovedMethods} from './lib/utils/stub-methods';
export {checkProps} from './lib/utils/check-props';
export {setPathPrefix, loadFile, loadImage, loadImageBitmap, loadScript} from './lib/utils/load-file';
export {getScratchArrayBuffer, getScratchArray, fillArray} from './lib/utils/array-utils-flat';
export {getRandom, random} from './lib/utils/random';

export {formatCompilerLog} from './lib/compiler-log/format-compiler-log';

// ENGINE - TODO/move to @luma.gl/engine once that module is webgl-independent?
export {requestAnimationFrame, cancelAnimationFrame} from './lib/request-animation-frame';

// SHADER HELPERS

/**
 * Marks GLSL shaders for syntax highlighting: glsl`...`
 * Install https://marketplace.visualstudio.com/items?itemName=boyswan.glsl-literal
 */
export const glsl = (x: TemplateStringsArray) => `${x}`;

// INTERNAL

export type {
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions
} from './adapter/resources/command-encoder';
