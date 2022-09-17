// Utils
export {log} from './utils/log';
export {
  isWebGL,
  isWebGL2,
  getWebGL2Context,
  assertWebGLContext,
  assertWebGL2Context
} from './utils/webgl-checks';

// Polyfills to support a subset of WebGL2 APIs on WebGL1 contexts
export {polyfillContext} from './polyfill/polyfill-context';

// unified parameter APIs
export {
  getParameters,
  setParameters,
  resetParameters,
  withParameters
} from './state-tracker/unified-parameter-api';

// state tracking
export {
  trackContextState,
  pushContextState,
  popContextState
} from './state-tracker/track-context-state';

export {
  CreateGLContextOptions,
  createGLContext,
  resizeGLContext,
  instrumentGLContext,
  getContextDebugInfo
} from './context/context';

export {cssToDeviceRatio, cssToDevicePixels} from './utils/device-pixels';
