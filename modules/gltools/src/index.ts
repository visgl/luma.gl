// Utils
export {log} from '@luma.gl/api';

// export type {WebGLDeviceProps, WebGLDeviceInfo, WebGPUDeviceLimits} from './lib/webgl-device';
export type {WebGLDeviceProps} from '@luma.gl/webgl';
export {WebGLDevice, getWebGLDevice} from '@luma.gl/webgl';

export {
  isWebGL,
  isWebGL2,
  getWebGL2Context,
  assertWebGLContext,
  assertWebGL2Context
} from '@luma.gl/webgl';

// Device ratio
export {cssToDeviceRatio, cssToDevicePixels} from '@luma.gl/webgl';

// Unified parameter API

export type {GLParameters} from '@luma.gl/webgl';
export {
  getParameters,
  setParameters,
  resetParameters
} from '@luma.gl/webgl';

export {
  withParameters
} from '@luma.gl/webgl';

// State tracking
export {
  trackContextState,
  pushContextState,
  popContextState
} from '@luma.gl/webgl';

// Polyfills (supports a subset of WebGL2 APIs on WebGL1 contexts)
export {polyfillContext} from '@luma.gl/webgl';

// DEPRECATED

export type {GLContextOptions} from './lib/deprecated/context-api';
export {
  createGLContext,
  instrumentGLContext,
  resizeGLContext,
  hasFeature,
  hasFeatures,
  getFeatures,
  getContextInfo,
  getGLContextInfo,
  getContextLimits,
  getContextDebugInfo
} from './lib/deprecated/context-api';

// Features
export {FEATURES} from './lib/deprecated/features';
