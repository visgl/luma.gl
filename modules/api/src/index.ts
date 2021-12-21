// Initialize any global state
import './init';

// MAIN API ACCESS POINTS
export {default as luma} from './lib/luma';
export type {DeviceProps, DeviceLimits, DeviceInfo} from './adapter/device';
export {default as Device} from './adapter/device';
export type {CanvasContextProps} from './adapter/canvas-context';
export {default as CanvasContext} from './adapter/canvas-context';

// GPU RESOURCES
export type {ResourceProps} from './adapter/resources/resource';
export {default as Resource} from './adapter/resources/resource';
export type {BufferProps} from './adapter/resources/buffer';
export {default as Buffer} from './adapter/resources/buffer';
export type {TextureProps} from './adapter/resources/texture';
export {default as Texture} from './adapter/resources/texture';
export type {ShaderProps, CompilerMessage} from './adapter/resources/shader';
export {default as Shader} from './adapter/resources/shader';
export type {SamplerProps} from './adapter/resources/sampler';
export {default as Sampler} from './adapter/resources/sampler';
export type {RenderPipelineProps} from './adapter/resources/render-pipeline';
export {default as RenderPipeline} from './adapter/resources/render-pipeline';

// API TYPES
export type {Accessor, InterleavedAccessors} from './adapter/types/accessor';
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
  VertexFormat,
  BindingLayout,
  Binding,
  ColorAttachment,
  DepthStencilAttachment
} from './adapter/types/types';

export type {
  ProgramBindings,
  AttributeBinding,
  UniformBinding,
  UniformBlockBinding,
  VaryingBinding
} from './adapter/types/program-bindings';

// UTILS
export type {TypedArray, NumberArray} from './types';

export {default as StatsManager, lumaStats} from './utils/stats-manager';
export {assert} from './utils/assert';
export {cast} from './utils/cast';
export {log} from './utils/log';
export {uid, isPowerOfTwo, isObjectEmpty} from './utils/utils';
export {formatValue} from './utils/format-value';
export {stubRemovedMethods} from './utils/stub-methods';
export {checkProps} from './utils/check-props';
export {setPathPrefix, loadFile, loadImage} from './utils/load-file';
export {getScratchArrayBuffer, getScratchArray, fillArray} from './utils/array-utils-flat';
export {getRandom, random} from './utils/random';

// ENGINE - TODO/move to @luma.gl/engine once that module is webgl-independent?
export {requestAnimationFrame, cancelAnimationFrame} from './engine/request-animation-frame';
