import {global} from './utils/';

// Installs polyfills to support a subset of WebGL2 APIs on WebGL1 contexts
export {default as polyfillContext} from './polyfill/polyfill-context';

// unified parameter APIs
export {
  getParameters,
  setParameters,
  resetParameters,
  withParameters
} from './state-tracker/unified-parameter-api';

// state tracking
export {
  default as trackContextState,
  pushContextState,
  popContextState
} from './state-tracker/track-context-state';

export {
  createGLContext,
  resizeGLContext,
  instrumentGLContext,
  getContextDebugInfo
} from './context/context';

export {
  isBrowser,
  isNode,
  isElectron,
  global,
  window,
  cssToDeviceRatio,
  cssToDevicePixels,
  isWebGL,
  isWebGL2
} from './utils/';

// Ensures that WebGL2RenderingContext is defined in non-WebGL2 environments
// so that apps can test their gl contexts with instanceof
// E.g. if (gl instanceof WebGL2RenderingContext) { }
class WebGL2RenderingContextNotSupported {}
global.WebGL2RenderingContext = global.WebGL2RenderingContext || WebGL2RenderingContextNotSupported;

// Ensure that Image is defined under Node.js
class ImageNotSupported {}
global.Image = global.Image || ImageNotSupported;
