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

// UTILS
export {default as StatsManager, lumaStats} from './utils/stats-manager';
export {default as assert} from './utils/assert';

// API TYPES
export type {Accessor, BufferAccessors} from './adapter/accessor';
export {cast} from './adapter/types';
