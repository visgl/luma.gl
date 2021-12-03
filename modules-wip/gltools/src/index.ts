// Utils
export {log} from './lib/utils/log';

// export type {WebGLDeviceProps, WebGLDeviceInfo, WebGPUDeviceLimits} from './lib/webgl-device';
export type {WebGLDeviceProps} from './lib/webgl-device';
export {default as WebGLDevice, getWebGLDevice} from './lib/webgl-device';

export {
  isWebGL,
  isWebGL2,
  getWebGL2Context,
  assertWebGLContext,
  assertWebGL2Context
} from './lib/context/webgl-checks';

// Device ratio
export {cssToDeviceRatio, cssToDevicePixels} from './lib/context/device-pixels';

// Unified parameter API

export type {GLParameters} from './lib/parameters/webgl-parameters';
export {
  getParameters,
  setParameters,
  resetParameters
} from './lib/parameters/unified-parameter-api';

export {
  withParameters
} from './lib/state-tracker/with-parameters';

// State tracking
export {
  trackContextState,
  pushContextState,
  popContextState
} from './lib/state-tracker/track-context-state';

// Polyfills (supports a subset of WebGL2 APIs on WebGL1 contexts)
export {polyfillContext} from './lib/polyfill/polyfill-context';

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
export {FEATURES} from './lib/device/get-webgl-features';

export {default as canCompileGLGSExtension} from './lib/device/check-glsl-extension';
