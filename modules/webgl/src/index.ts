// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// luma.gl Base WebGL wrapper library
// Provides simple class/function wrappers around the low level webgl objects
// These classes are intentionally close to the WebGL API
// but make it easier to use.
// Higher level abstractions can be built on these classes

// Types
export type {WebGLDeviceLimits} from './adapter/device-helpers/webgl-device-limits';

// WebGL adapter classes
export {webgl2Adapter} from './adapter/webgl-adapter';
export type {WebGLAdapter} from './adapter/webgl-adapter';

// WebGL Device classes
export {WebGLDevice} from './adapter/webgl-device';
export {WebGLCanvasContext} from './adapter/webgl-canvas-context';

// WebGL Resource classes
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

// WebGL adapter classes
export {WEBGLTransformFeedback} from './adapter/resources/webgl-transform-feedback';

// WebGL adapter classes
export {Accessor} from './deprecated/accessor';
export type {AccessorObject} from './types';

// Unified parameter API

export {setDeviceParameters, withDeviceParameters} from './adapter/converters/device-parameters';

// HELPERS - EXPERIMENTAL
export {getShaderLayoutFromGLSL} from './adapter/helpers/get-shader-layout';
export {WebGLStateTracker} from './context/state-tracker/webgl-state-tracker';

// DEPRECATED TEST EXPORTS
export {
  resetGLParameters,
  setGLParameters,
  getGLParameters
} from './context/parameters/unified-parameter-api';

export {withGLParameters} from './context/state-tracker/with-parameters';
