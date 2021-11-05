// Utils
export {log} from './lib/utils/log';

export {
  isWebGL,
  isWebGL2,
  getWebGL2Context,
  assertWebGLContext,
  assertWebGL2Context
} from './lib/utils/webgl-checks';

// Polyfills to support a subset of WebGL2 APIs on WebGL1 contexts
export {polyfillContext} from './lib/polyfill/polyfill-context';

// unified parameter APIs
export type {GLParameters} from './lib/state-tracker/webgl-parameters';
export {
  getParameters,
  setParameters,
  resetParameters,
  withParameters
} from './lib/state-tracker/unified-parameter-api';

// state tracking
export {
  trackContextState,
  pushContextState,
  popContextState
} from './lib/state-tracker/track-context-state';

export type {GLContextOptions} from './lib/context/context';
export {
  createGLContext,
  resizeGLContext,
  instrumentGLContext,
  getContextDebugInfo
} from './lib/context/context';

export {cssToDeviceRatio, cssToDevicePixels} from './lib/utils/device-pixels';
