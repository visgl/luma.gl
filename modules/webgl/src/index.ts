// luma.gl Base WebGL wrapper library
// Provides simple class/function wrappers around the low level webgl objects
// These classes are intentionally close to the WebGL API
// but make it easier to use.
// Higher level abstractions can be built on these classes

// Initialize any global state
import './init';

// export type {WebGLDeviceProps, WebGLDeviceInfo, WebGPUDeviceLimits} from './lib/webgl-device';
export type {WebGLDeviceProps} from './adapter/webgl-device';
export {default as WebGLDevice, getWebGLDevice} from './adapter/webgl-device';

// UTILS
export {requestAnimationFrame, cancelAnimationFrame} from './webgl-utils/request-animation-frame';

// WebGL Functions
export {cloneTextureFrom} from './webgl-utils/texture-utils';
export {getKeyValue, getKey} from './webgl-utils/constants-to-keys';

// WebGL Helper Classes
export {default as Accessor} from './classes/accessor';

// WebGL1 classes
export type {BufferProps} from '@luma.gl/api';
export {default as Buffer} from './classes/webgl-buffer';
export type {Texture2DProps} from './classes/texture-2d';
export {default as Texture2D} from './classes/texture-2d';
export type {TextureCubeProps} from './classes/texture-cube';
export {default as TextureCube} from './classes/texture-cube';

export type {ProgramProps} from './classes/program';
export {default as Program} from './classes/program';
export type {FramebufferProps} from './classes/framebuffer';
export {default as Framebuffer} from './classes/framebuffer';
export type {RenderbufferProps} from './classes/renderbuffer';
export {default as Renderbuffer} from './classes/renderbuffer';

// Classic luma.gl classes (For backwards compatibility)
export type {ShaderProps} from './classes/shader';
export {Shader, VertexShader, FragmentShader} from './classes/shader';

export {clear, clearBuffer} from './classes/clear';

// Copy and Blit
export {
  readPixelsToArray,
  readPixelsToBuffer,
  copyToDataUrl,
  copyToImage,
  copyToTexture,
  blit
} from './classes/copy-and-blit';

// WebGL2 classes & Extensions
export type {QueryProps} from './classes/query';
export {default as Query} from './classes/query';
export type {Texture3DProps} from './classes/texture-3d';
export {default as Texture3D} from './classes/texture-3d';
export type {TransformFeedbackProps} from './classes/transform-feedback';
export {default as TransformFeedback} from './classes/transform-feedback';
export type {VertexArrayObjectProps} from './classes/vertex-array-object';
export {default as VertexArrayObject} from './classes/vertex-array-object';
export type {VertexArrayProps} from './classes/vertex-array';
export {default as VertexArray} from './classes/vertex-array';
export {default as UniformBufferLayout} from './classes/uniform-buffer-layout';

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

export type {GLParameters} from './context/parameters/webgl-parameters';
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
export {parseUniformName, getUniformSetter} from './classes/uniforms';
export {getDebugTableForUniforms} from './debug/debug-uniforms';
export {getDebugTableForVertexArray} from './debug/debug-vertex-array';
export {getDebugTableForProgramConfiguration} from './debug/debug-program-configuration';

// DEPRECATED

// Deprecated re-exports
export {lumaStats} from './init';
export {log, assert, uid, isObjectEmpty} from '@luma.gl/api';
export {setPathPrefix, loadFile, loadImage} from '@luma.gl/api';


// export {
//   getContextInfo, getGLContextInfo, getContextLimits,
//   FEATURES,
//   getFeatures,
//   canCompileGLGSExtension
// } from '@luma.gl/gltools';

// REMOVED in v8.6
// getShaderInfo,
// getShaderName
// getShaderVersion
