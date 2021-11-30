// Initialize any global state
import './init';

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
export type {ShaderProps, CompilerMessage} from './adapter/resources/shader';
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
export type {Accessor} from './adapter/types/accessor';
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

export type {
  TextureFormat,
  ColorTextureFormat,
  DepthStencilTextureFormat,
  VertexFormat
} from './adapter/types/formats';
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

// API UTILS
export {decodeVertexFormat} from './adapter/utils/decode-vertex-format';
export {decodeTextureFormat} from './adapter/utils/decode-texture-format';

// GENERAL TYPES
export type {TypedArray, TypedArrayConstructor, NumberArray} from './types';

// GENERAL UTILS

export {default as StatsManager, lumaStats} from './utils/stats-manager';
export {assert} from './utils/assert';
export {cast} from './utils/cast';
export {log} from './utils/log';
export {uid, isPowerOfTwo, isObjectEmpty} from './utils/utils';
export {formatValue} from './utils/format-value';
export {stubRemovedMethods} from './utils/stub-methods';
export {checkProps} from './utils/check-props';
export {setPathPrefix, loadFile, loadImage, loadImageBitmap, loadScript} from './utils/load-file';
export {getScratchArrayBuffer, getScratchArray, fillArray} from './utils/array-utils-flat';
export {getRandom, random} from './utils/random';

// ENGINE - TODO/move to @luma.gl/engine once that module is webgl-independent?
export {requestAnimationFrame, cancelAnimationFrame} from './engine/request-animation-frame';

// INTERNAL

export type {
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions
} from './adapter/resources/command-encoder';
