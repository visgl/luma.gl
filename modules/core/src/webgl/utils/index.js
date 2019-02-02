// Exports WebGL API constants and types, plus some basic type checks
export {
  Image,
  WebGLRenderingContext,
  WebGL2RenderingContext,
  WebGLProgram,
  WebGLShader,
  WebGLBuffer,
  WebGLFramebuffer,
  WebGLRenderbuffer,
  WebGLTexture,
  WebGLUniformLocation,
  WebGLActiveInfo,
  WebGLShaderPrecisionFormat,
  webGLTypesAvailable
} from './webgl-types';

export {isWebGL, isWebGL2, assertWebGLContext, assertWebGL2Context} from './webgl-checks';

export {requestAnimationFrame, cancelAnimationFrame} from './request-animation-frame';

export {default as formatGLSLCompilerError, parseGLSLCompilerError} from './format-glsl-error';
export {default as getShaderName} from './get-shader-name';

export {
  getGLTypeFromTypedArray,
  getTypedArrayFromGLType,
  flipRows,
  scalePixels
} from './typed-array-utils';

export {getKeyValue, getKey, getKeyType} from './constants-to-keys';

export {getShaderVersion} from './shader-utils';

export {cloneTextureFrom} from './texture-utils';
