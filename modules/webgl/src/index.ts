// luma.gl Base WebGL wrapper library
// Provides simple class/function wrappers around the low level webgl objects
// These classes are intentionally close to the WebGL API
// but make it easier to use.
// Higher level abstractions can be built on these classes

// Types
export type {WebGLLimits} from './adapter/device-helpers/device-limits';

export {registerHeadlessGL} from './context/context/create-headless-context';

// WebGL adapter classes
export {WebGLDevice} from './adapter/webgl-device';
export {WebGLCanvasContext} from './adapter/webgl-canvas-context';

// WebGL Resource classes
export {WebGLResource, WebGLResource as WEBGLResource} from './adapter/objects/webgl-resource';
export {WEBGLBuffer} from './adapter/resources/webgl-buffer';
export {WEBGLTexture} from './adapter/resources/webgl-texture';
// export {WEBGLExternalTexture} from './adapter/resources/webgl-external-texture';
export {WEBGLShader} from './adapter/resources/webgl-shader';
export {WEBGLSampler} from './adapter/resources/webgl-sampler';
export {WEBGLFramebuffer} from './adapter/resources/webgl-framebuffer';

export {WEBGLRenderPipeline} from './adapter/resources/webgl-render-pipeline';
// export {WEBGLComputePipeline} from './adapter/resources/webgl-compute-pipeline';
export {WEBGLCommandEncoder} from './adapter/resources/webgl-command-encoder';
export {WEBGLRenderPass} from './adapter/resources/webgl-render-pass';
// export {WEBGLComputePass} from './adapter/resources/webgl-compute-pass';

// non-api resources
export type {RenderbufferProps} from './adapter/objects/webgl-renderbuffer';
export {WEBGLRenderbuffer} from './adapter/objects/webgl-renderbuffer';
export {WEBGLVertexArrayObject} from './adapter/objects/webgl-vertex-array-object';

// WebGL adapter classes (Legacy, will be moved to gltools)
export {Accessor} from './classic/accessor';
export type {AccessorObject} from './types';
export type {ClassicBufferProps, ClassicBufferProps as BufferProps} from './classic/buffer';
export {ClassicBuffer, ClassicBuffer as Buffer} from './classic/buffer';

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
