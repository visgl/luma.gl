// WEBGL BUILT-IN TYPES
// Enables app to "import" built-in WebGL types unknown to eslint
// Provides a hook for application to preimport headless gl

/* global window */
import {global, lumaGlobals} from '../utils';

class DummyType {}

const {
  WebGLRenderingContext = DummyType,
  WebGLProgram = DummyType,
  WebGLShader = DummyType,
  WebGLBuffer = DummyType,
  WebGLFramebuffer = DummyType,
  WebGLRenderbuffer = DummyType,
  WebGLTexture = DummyType,
  WebGLUniformLocation = DummyType,
  WebGLActiveInfo = DummyType,
  WebGLShaderPrecisionFormat = DummyType
} = lumaGlobals.headlessTypes || global;

export const webGLTypesAvailable =
  WebGLRenderingContext !== DummyType &&
  WebGLProgram !== DummyType &&
  WebGLShader !== DummyType &&
  WebGLBuffer !== DummyType &&
  WebGLFramebuffer !== DummyType &&
  WebGLRenderbuffer !== DummyType &&
  WebGLTexture !== DummyType &&
  WebGLUniformLocation !== DummyType &&
  WebGLActiveInfo !== DummyType &&
  WebGLShaderPrecisionFormat !== DummyType;

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
