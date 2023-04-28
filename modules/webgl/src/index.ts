// luma.gl Base WebGL wrapper library
// Provides simple class/function wrappers around the low level webgl objects
// These classes are intentionally close to the WebGL API
// but make it easier to use.
// Higher level abstractions can be built on these classes

// Initialize any global state
import '@luma.gl/api';
import './init'

// Types
export type {WebGLLimits} from './adapter/device-helpers/device-limits';

export {registerHeadlessGL} from './context/context/create-headless-context';

// WebGL adapter classes
export {default as WebGLDevice} from './adapter/webgl-device';
export {default as WebGLCanvasContext} from './adapter/webgl-canvas-context';

// WebGL Resource classes
export {default as WEBGLResource, default as WebGLResource} from './adapter/objects/webgl-resource';
export {default as WEBGLBuffer} from './adapter/resources/webgl-buffer';
export {default as WEBGLTexture} from './adapter/resources/webgl-texture';
// export {default as WEBGLExternalTexture} from './adapter/resources/webgl-external-texture';
export {default as WEBGLShader} from './adapter/resources/webgl-shader';
export {default as WEBGLSampler} from './adapter/resources/webgl-sampler';
export {default as WEBGLFramebuffer} from './adapter/resources/webgl-framebuffer';

export {default as WEBGLRenderPipeline} from './adapter/resources/webgl-render-pipeline';
// export {default as WEBGLComputePipeline} from './adapter/resources/webgl-compute-pipeline';
export {default as WEBGLCommandEncoder} from './adapter/resources/webgl-command-encoder';
export {default as WEBGLRenderPass} from './adapter/resources/webgl-render-pass';
// export {default as WEBGLComputePass} from './adapter/resources/webgl-compute-pass';

// non-api resources
export type {RenderbufferProps} from './adapter/objects/webgl-renderbuffer';
export {default as WEBGLRenderbuffer} from './adapter/objects/webgl-renderbuffer';
export {default as WEBGLVertexArrayObject} from './adapter/objects/webgl-vertex-array-object';

// WebGL adapter classes (Legacy, will be moved to gltools)
export {default as Accessor} from './classic/accessor';
export type {AccessorObject} from './types';
export type {ClassicBufferProps, ClassicBufferProps as BufferProps} from './classic/buffer';
export {default as ClassicBuffer, default as Buffer} from './classic/buffer';

export {
  isWebGL,
  isWebGL2,
  getWebGL2Context,
  assertWebGLContext,
  assertWebGL2Context
} from './context/context/webgl-checks';

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
export {getShaderLayout, getProgramBindings} from './adapter/helpers/get-shader-layout';
export {_checkFloat32ColorAttachment} from './adapter/converters/texture-formats';
