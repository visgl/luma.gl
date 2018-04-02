export {createHeadlessContext} from './create-headless-context';

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
} from './webgl-types';

export {
  getPageLoadPromise,
  createCanvas,
  getCanvas,
  resizeCanvas,
  resizeDrawingBuffer
} from './create-canvas';

export {
  trackContextCreation,
  createContext
} from './create-context';

export {default as polyfillContext} from './polyfill-context';
export {default as trackContextState} from './track-context-state';

export {default as formatGLSLCompilerError, parseGLSLCompilerError} from './format-glsl-error';
export {default as getShaderName} from './get-shader-name';

// TODO - avoid uncondsitionally importing GL as it adds a lot to bundle size?
export {default as GL} from './constants';
