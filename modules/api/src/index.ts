// MAIN API ACCESS POINTS
export {default as luma} from './lib/luma';
export type {DeviceLimits, DeviceInfo} from './adapter/device';
export {default as Device} from './adapter/device';

// GPU RESOURCES
export type {ResourceProps} from './adapter/resource';
export {default as Resource} from './adapter/resource';
export type {BufferProps} from './adapter/buffer';
export {default as Buffer} from './adapter/buffer';
export type {TextureProps} from './adapter/texture';
export {default as Texture} from './adapter/texture';
export type {ShaderProps, CompilerMessage} from './adapter/shader';
export {default as Shader} from './adapter/shader';

// API TYPES
export {Accessor, BufferAccessors} from './adapter/accessor';
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
} from './adapter/parameters';

export {BindingLayout, Binding, ColorAttachment, DepthStencilAttachment} from './adapter/types';

// UTILS
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
