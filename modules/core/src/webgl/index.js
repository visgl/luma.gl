// luma.gl Base WebGL wrapper library
// Provides simple class/function wrappers around the low level webgl objects
// These classes are intentionally close to the WebGL API
// but make it easier to use.
// Higher level abstractions can be built on these classes

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
} from './utils';

// Context
export {isWebGL, isWebGL2, createGLContext, destroyGLContext} from '../webgl-context/context';
export {withParameters, resetParameters} from '../webgl-context/context-state';
export {getContextInfo} from '../webgl-context/context-limits';

// WebGL Functions
export {clear} from './classes/clear';
export {
  readPixelsToArray,
  readPixelsToBuffer,
  copyToDataUrl,
  copyToImage,
  copyToTexture,
  blit
} from './classes/copy-and-blit';
export {parseUniformName, getUniformSetter} from './classes/uniforms';

export {default as Accessor} from './classes/accessor';

// WebGL1 Classes
export {default as Buffer} from './classes/buffer';
export {Shader, VertexShader, FragmentShader} from './classes/shader';
export {default as Program} from './classes/program';
export {default as Framebuffer} from './classes/framebuffer';
export {default as Renderbuffer} from './classes/renderbuffer';
export {default as Texture2D} from './classes/texture-2d';
export {default as TextureCube} from './classes/texture-cube';

// WebGL2 Classes
export {default as VertexArray} from './classes/vertex-array';
export {default as TransformFeedback} from './classes/transform-feedback';
export {default as Query} from './classes/query';
