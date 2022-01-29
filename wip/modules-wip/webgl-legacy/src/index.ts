// luma.gl, MIT license
// DEPRECATION WARNING
// This is the `@luma.gl/webgl-legacy` module which contains the now deprecated luma.gl v8 WebGL-only API.
// Use `@luma.gl/core` to access the new API which supports both WebGL and WebGPU.

// Constants
export {default as GL} from '@luma.gl/constants';

// Utils
export {log} from '@luma.gl/core';

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

export {
  isWebGL,
  isWebGL2,
  getWebGL2Context,
  assertWebGLContext,
  assertWebGL2Context
} from '@luma.gl/webgl';

// Device ratio
export {
  cssToDeviceRatio,
  cssToDevicePixels,
  getDevicePixelRatio,
  setDevicePixelRatio
} from './classic/device-pixels';

// Unified parameter API

export type {GLParameters} from '@luma.gl/webgl';
export {getParameters, setParameters, resetParameters} from '@luma.gl/webgl';

export {withParameters} from '@luma.gl/webgl';

// State tracking
export {trackContextState, pushContextState, popContextState} from '@luma.gl/webgl';

// Polyfills (supports a subset of WebGL2 APIs on WebGL1 contexts)
export {polyfillContext} from '@luma.gl/webgl';

// Features
export {DEPRECATED_FEATURES as FEATURES} from './classic/features';

// WebGL Helper Classes
export {Accessor} from '@luma.gl/webgl';
export type {BufferProps as BufferProps} from '@luma.gl/webgl';
export {Buffer} from '@luma.gl/webgl';
export {parseUniformName, getUniformSetter} from './classic/uniforms';

// WebGL1 classes
export type {Texture2DProps} from './classic/texture-2d';
export {default as Texture2D} from './classic/texture-2d';
export {default as TextureCube} from './classic/texture-cube';

export type {ProgramProps} from './classic/program';
export {default as Program} from './classic/program';
export type {ClassicFramebufferProps as FramebufferProps} from './classic/framebuffer';
export {ClassicFramebuffer as Framebuffer} from './classic/framebuffer';
export type {ClassicRenderbufferProps as RenderbufferProps} from './classic/renderbuffer';
export {ClassicRenderbuffer as Renderbuffer} from './classic/renderbuffer';

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
// export type {TransformFeedbackProps} from './classic/transform-feedback';
// export {default as TransformFeedback} from './classic/transform-feedback';
export type {VertexArrayObjectProps} from './classic/vertex-array-object';
export {default as VertexArrayObject} from './classic/vertex-array-object';
export type {VertexArrayProps} from './classic/vertex-array';
export {default as VertexArray} from './classic/vertex-array';

export {default as UniformBufferLayout} from './classic/uniform-buffer-layout';

// WebGL Functions
export {cloneTextureFrom} from './webgl-utils/texture-utils';
export {getKeyValue, getKey} from './webgl-utils/constants-to-keys';

// INTERNAL
export {getDebugTableForUniforms} from './debug/debug-uniforms';
export {getDebugTableForVertexArray} from './debug/debug-vertex-array';
export {getDebugTableForProgramConfiguration} from './debug/debug-program-configuration';

// luma.gl v8 Engine API
export type {
  ClassicAnimationLoopProps,
  ClassicAnimationProps
} from './engine/classic-animation-loop';
export {default as ClassicAnimationLoop} from './engine/classic-animation-loop';
export type {ClassicModelProps} from './engine/classic-model';
export {default as ClassicModel} from './engine/classic-model';

export type {ClassicAnimationLoopProps as AnimationLoopProps} from './engine/classic-animation-loop';
export type {ClassicAnimationProps as AnimationProps} from './engine/classic-animation-loop';
export {default as AnimationLoop} from './engine/classic-animation-loop';
export type {ClassicModelProps as ModelProps} from './engine/classic-model';
export {default as Model} from './engine/classic-model';

export {default as ProgramManager} from './engine/program-manager';

// export {default as Transform} from './transform/transform';

export {default as ClipSpace} from './engine/classic-clip-space';

// GLSL debugger

export {COLOR_MODE} from './glsl-to-js-compiler/draw-model';
export {_DebugContext} from './glsl-to-js-compiler/debug-context';
export {
  compileShaderModule,
  compileVertexShader,
  compileFragmentShader
} from './glsl-to-js-compiler/compile-shader';

import './glsl-to-js-compiler/compile-shader.spec';
