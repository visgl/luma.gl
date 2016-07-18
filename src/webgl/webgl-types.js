// WEBGL BUILT-IN TYPES
// Enables app to "import" built-in WebGL types unknown to eslint
// Provides a hook for application to preimport headless gl

const ERR_WEBGL_MISSING = `
WebGL API is missing. To run luma.gl under Node.js,
please install headless-gl and import 'luma.gl/headless' instead of 'luma.gl'.
`;

/* global window */
import {global, lumaGlobals} from '../utils';

const {
  WebGLRenderingContext,
  WebGLProgram,
  WebGLShader,
  WebGLBuffer,
  WebGLFramebuffer,
  WebGLRenderbuffer,
  WebGLTexture,
  WebGLUniformLocation,
  WebGLActiveInfo,
  WebGLShaderPrecisionFormat
} = lumaGlobals.headlessTypes || global;

const allWebGLTypesAvailable =
  WebGLRenderingContext &&
  WebGLProgram &&
  WebGLShader &&
  WebGLBuffer &&
  WebGLFramebuffer &&
  WebGLRenderbuffer &&
  WebGLTexture &&
  WebGLUniformLocation &&
  WebGLActiveInfo &&
  WebGLShaderPrecisionFormat;

if (!allWebGLTypesAvailable) {
  throw new Error(ERR_WEBGL_MISSING);
}

// Ensures that WebGL2RenderingContext is defined in non-WebGL2 environments
// so that apps can test their gl contexts with instanceof
// E.g. if (gl instanceof WebGL2RenderingContext) { ... }
function getWebGL2RenderingContext() {
  class WebGL2RenderingContextNotSupported {}
  return global.WebGL2RenderingContext || WebGL2RenderingContextNotSupported;
}

function getImage() {
  class ImageNotSupported {}
  return global.Image || ImageNotSupported;
}

// const WebGL = getWebGLConstants();
const WebGL2RenderingContext = getWebGL2RenderingContext();
const Image = getImage();

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

  WebGL2RenderingContext
};

// Convenience
export {default as WebGL, default as GL} from './webgl-constants';
