// luma.gl Base WebGL wrapper library
// Provides simple class/function wrappers around the low level webgl objects
// These classes are intentionally close to the WebGL API
// but make it easier to use.
// Higher level abstractions can be built on these classes

export {GL} from './gl-constants';
export {GL as default} from './gl-constants';

// Exports WebGL API constants and types, plus some basic type checks
export {
  Image,
  WebGLRenderingContext,
  WebGLProgram,
  WebGLShader,
  WebGLBuffer,
  WebGLFramebuffer,
  WebGLRenderbuffer,
  WebGLTexture,
  WebGLUniformLocation,
  WebGLActiveInfo,
  WebGLShaderPrecisionFormat,
  WebGL2RenderingContext,

  webGLTypesAvailable
} from './api/types';

export {
  isWebGL,
  isWebGL2,
  createGLContext,
  deleteGLContext
} from './context';

export {
  withParameters,
  resetParameters
} from './context-state';

export {
  getContextInfo
} from './context-limits';

// WebGL1 objects
export {default as Buffer} from './buffer';
export {default as Shader, VertexShader, FragmentShader} from './shader';
export {default as Program} from './program';
export {default as Framebuffer} from './framebuffer';
export {default as Renderbuffer} from './renderbuffer';
export {default as Texture2D} from './texture-2d';
export {default as TextureCube} from './texture-cube';

// Functions
export {
  draw
} from './draw';

export {
  clear
} from './clear';

export {
  readPixels,
  readPixelsFromBuffer
} from './functions';

export {
  parseUniformName,
  getUniformSetter,
  checkUniformValues
} from './uniforms';

// WebGL2
export {default as VertexArray} from './vertex-array';
