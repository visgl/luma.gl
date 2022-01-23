// luma.gl Base WebGL wrapper library
// Provides simple class/function wrappers around the low level webgl objects
// These classes are intentionally close to the WebGL API
// but make it easier to use.
// Higher level abstractions can be built on these classes

// Initialize any global state
import '@luma.gl/api';
import './init'

export {default as WebGLDevice, getWebGLDevice} from './adapter/webgl-device';
export {default as WebGLCanvasContext} from './adapter/webgl-canvas-context';

// WebGL Functions
export {getKeyValue, getKey} from './webgl-utils/constants-to-keys';

// Legacy WebGL Classes - will be moved to gltools
export {default as Accessor} from './classic/accessor';
export type {ClassicBufferProps as BufferProps} from './classic/buffer';
export {default as Buffer} from './classic/buffer';

export {
  isWebGL,
  isWebGL2,
  getWebGL2Context,
  assertWebGLContext,
  assertWebGL2Context
} from './context/context/webgl-checks';

// Device ratio
export {cssToDeviceRatio, cssToDevicePixels} from './context/context/device-pixels';

// Unified parameter API

export {setDeviceParameters, withDeviceParameters} from './adapter/converters/device-parameters';

export type {GLParameters} from './types/webgl';
export {
  getParameters,
  setParameters,
  resetParameters
} from './context/parameters/unified-parameter-api';

export {
  withParameters
} from './context/state-tracker/with-parameters';

// State tracking
export {
  trackContextState,
  pushContextState,
  popContextState
} from './context/state-tracker/track-context-state';

// Polyfills (supports a subset of WebGL2 APIs on WebGL1 contexts)
export {polyfillContext} from './context/polyfill/polyfill-context';

// HELPERS - EXPERIMENTAL
export {getProgramBindings} from './adapter/helpers/get-program-bindings';
export {loadWebGLDeveloperTools} from './debug/webgl-developer-tools';
export {_checkFloat32ColorAttachment} from './adapter/converters/texture-formats';


// Deprecated re-exports
// export {lumaStats} from '@luma.gl/api';
// export {log, assert, uid, isObjectEmpty} from '@luma.gl/api';
// export {setPathPrefix, loadFile, loadImage} from '@luma.gl/api';
