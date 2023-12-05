// luma.gl, MIT license
// Copyright (c) vis.gl contributors

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
export {WEBGLVertexArray} from './adapter/resources/webgl-vertex-array';

// non-api resources
export type {RenderbufferProps} from './adapter/objects/webgl-renderbuffer';
export {WEBGLRenderbuffer} from './adapter/objects/webgl-renderbuffer';

// WebGL adapter classes (Legacy will likely be removed)
export {Accessor} from './classic/accessor';
export type {AccessorObject} from './types';

export {
  isWebGL,
  isWebGL2,
  getWebGL2Context,
  assertWebGLContext,
  assertWebGL2Context
} from './context/context/webgl-checks';

// Unified parameter API

export {setDeviceParameters, withDeviceParameters} from './adapter/converters/device-parameters';

export type {GLParameters} from '@luma.gl/constants';
export {
  getGLParameters,
  setGLParameters,
  resetGLParameters
} from './context/parameters/unified-parameter-api';

export {withGLParameters} from './context/state-tracker/with-parameters';

// HELPERS - EXPERIMENTAL
export {getShaderLayout} from './adapter/helpers/get-shader-layout';
export {
  convertGLToTextureFormat,
  _checkFloat32ColorAttachment
} from './adapter/converters/texture-formats';

// TEST EXPORTS
export {TEXTURE_FORMATS as _TEXTURE_FORMATS} from './adapter/converters/texture-formats';

// DEPRECATED EXPORTS
export {clear} from './classic/clear';
export {readPixelsToBuffer, readPixelsToArray, copyToTexture} from './classic/copy-and-blit';
// State tracking
export {
  trackContextState,
  pushContextState,
  popContextState
} from './context/state-tracker/track-context-state';
// Polyfills (supports a subset of WebGL2 APIs on WebGL1 contexts)
export {polyfillContext} from './context/polyfill/polyfill-context';

// HELPERS - EXPERIMENTAL
// export {getShaderLayout, getProgramBindings} from './adapter/helpers/get-shader-layout';
// export {convertGLToTextureFormat, _checkFloat32ColorAttachment} from './adapter/converters/texture-formats';
// export {TEXTURE_FORMATS as _TEXTURE_FORMATS} from './adapter/converters/texture-formats';

// // WebGL Types - Experimental exports
// export type {
//   GLDrawMode,
//   GLPrimitive,
//   GLDataType,
//   GLPixelType,
//   GLUniformType,
//   GLSamplerType,
//   GLCompositeType,
//   GLFunction,
//   GLBlendEquation,
//   GLBlendFunction,
//   GLStencilOp,
//   GLSamplerParameters,
//   GLValueParameters,
//   GLFunctionParameters
// } from '@luma.gl/constants';
