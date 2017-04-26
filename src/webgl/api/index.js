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
  formatGLSLCompilerError,
  getShaderName
} from './webgl-format-shader-error';

// TODO - avoid importing GL as it is a big file
export {GL, glGet, glKey} from '../gl-constants';
export {default as default} from '../gl-constants';
