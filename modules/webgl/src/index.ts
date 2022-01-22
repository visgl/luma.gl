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

// UTILS
export {requestAnimationFrame, cancelAnimationFrame} from '@luma.gl/api';

// WebGL Functions
export {cloneTextureFrom} from './webgl-utils/texture-utils';
export {getKeyValue, getKey} from './webgl-utils/constants-to-keys';

// WebGL Helper Classes
export {default as Accessor} from './classic/accessor';

// WebGL1 classes
export type {ClassicBufferProps as BufferProps} from './classic/buffer';
export {default as Buffer} from './classic/buffer';
export type {Texture2DProps} from './classic/texture-2d';
export {default as Texture2D} from './classic/texture-2d';
export {default as TextureCube} from './classic/texture-cube';

export type {ProgramProps} from './classic/program';
export {default as Program} from './classic/program';
export type {ClassicFramebufferProps as FramebufferProps} from './classic/framebuffer';
export {default as Framebuffer} from './classic/framebuffer';
export type {RenderbufferProps} from './classic/renderbuffer';
export {default as Renderbuffer} from './classic/renderbuffer';

// Classic luma.gl classes (For backwards compatibility)
export type {ShaderProps} from './classic/shader';
export {Shader, VertexShader, FragmentShader} from './classic/shader';

export {clear, clearBuffer} from './classic/clear';

// Copy and Blit
export {
  readPixelsToArray,
  readPixelsToBuffer,
  copyToDataUrl,
  copyToImage,
  copyToTexture,
  blit
} from './classic/copy-and-blit';

// WebGL2 classes & Extensions
export type {QueryProps} from './classic/query';
export {default as Query} from './classic/query';
export {default as Texture3D} from './classic/texture-3d';
export type {TransformFeedbackProps} from './classic/transform-feedback';
export {default as TransformFeedback} from './classic/transform-feedback';
export type {VertexArrayObjectProps} from './classic/vertex-array-object';
export {default as VertexArrayObject} from './classic/vertex-array-object';
export type {VertexArrayProps} from './classic/vertex-array';
export {default as VertexArray} from './classic/vertex-array';

export {default as UniformBufferLayout} from './classic/uniform-buffer-layout';

// experimental WebGL exports

// UTILS
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

// INTERNAL
export {parseUniformName, getUniformSetter} from './classic/uniforms';
export {getDebugTableForUniforms} from './debug/debug-uniforms';
export {getDebugTableForVertexArray} from './debug/debug-vertex-array';
export {getDebugTableForProgramConfiguration} from './debug/debug-program-configuration';

// HELPERS - EXPERIMENTAL
export {getProgramBindings} from './adapter/helpers/get-program-bindings';
export {loadWebGLDeveloperTools} from './debug/webgl-developer-tools';

// DEPRECATED

export {_checkFloat32ColorAttachment} from './adapter/converters/texture-formats';

// Deprecated re-exports
export {lumaStats} from '@luma.gl/api';
export {log, assert, uid, isObjectEmpty} from '@luma.gl/api';
export {setPathPrefix, loadFile, loadImage} from '@luma.gl/api';

// GLTOOLS
export type {GLContextOptions} from './classic/context-api';
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
} from './classic/context-api';

// Features
export {DEPRECATED_FEATURES as FEATURES} from './classic/features';

// REMOVED in v8.7
// getShaderInfo,
// getShaderName
// getShaderVersion
