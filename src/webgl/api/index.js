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
} from './types';

export {
  formatGLSLCompilerError,
  getShaderName
} from '../../webgl-utils';

// TODO - avoid importing GL as it is a big file
import GL from '../../webgl-utils/constants';
export {GL};
export default GL;
