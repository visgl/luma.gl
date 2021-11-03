// luma.gl Base WebGL wrapper library
// Provides simple class/function wrappers around the low level webgl objects
// These classes are intentionally close to the WebGL API
// but make it easier to use.
// Higher level abstractions can be built on these classes

// Initialize any global state
export {lumaStats} from './init';

// UTILS
export {requestAnimationFrame, cancelAnimationFrame} from './webgl-utils/request-animation-frame';

// WebGL Functions
export {cloneTextureFrom} from './webgl-utils/texture-utils';
export {getKeyValue, getKey} from './webgl-utils/constants-to-keys';
export {getContextInfo, getGLContextInfo, getContextLimits} from './features/limits';
export {FEATURES} from './features/webgl-features-table';
export {hasFeature, hasFeatures, getFeatures} from './features/features';
export {default as canCompileGLGSExtension} from './features/check-glsl-extension';

// WebGL Helper Classes
export {default as Accessor} from './classes/accessor';

// WebGL1 classes
export type {WebGLBufferProps as BufferProps} from './classes/buffer';
export {default as Buffer} from './classes/buffer';
export {default as Texture2D, Texture2DProps} from './classes/texture-2d';
export {default as TextureCube, TextureCubeProps} from './classes/texture-cube';

export {Shader, VertexShader, FragmentShader, ShaderProps} from './classes/shader';
export {default as Program, ProgramProps} from './classes/program';
export {default as Framebuffer, FramebufferProps} from './classes/framebuffer';
export {default as Renderbuffer, RenderbufferProps} from './classes/renderbuffer';

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
export {default as Query, QueryProps} from './classes/query';
export {default as Texture3D, Texture3DProps} from './classes/texture-3d';
export {default as TransformFeedback, TransformFeedbackProps} from './classes/transform-feedback';
export {default as VertexArrayObject, VertexArrayObjectProps} from './classes/vertex-array-object';
export {default as VertexArray, VertexArrayProps} from './classes/vertex-array';
export {default as UniformBufferLayout} from './classes/uniform-buffer-layout';

// experimental WebGL exports

export {setPathPrefix, loadFile, loadImage} from './utils/load-file';

// UTILS
export {log} from '@luma.gl/gltools';
export {default as assert} from './utils/assert';
export {uid, isObjectEmpty} from './utils/utils';

// INTERNAL
export {parseUniformName, getUniformSetter} from './classes/uniforms';
export {getDebugTableForUniforms} from './debug/debug-uniforms';
export {getDebugTableForVertexArray} from './debug/debug-vertex-array';
export {getDebugTableForProgramConfiguration} from './debug/debug-program-configuration';

// REMOVED in v8.6
// getShaderInfo,
// getShaderName
// getShaderVersion
