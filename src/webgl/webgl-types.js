// WEBGL BUILT-IN TYPES
import WebGL from 'gl-constants';

// Convenience: enable app to "import" built-in WebGL types unknown to eslint
/* global window */
const glob = typeof window !== 'undefined' ? window : require('gl/wrap');
const {
  WebGLRenderingContext,
  WebGLBuffer,
  WebGLFramebuffer,
  WebGLRenderbuffer
} = glob;

// Ensures that WebGL2RenderingContext is defined in non-WebGL2 environments
// so that apps can test their gl contexts with instanceof
// E.g. if (gl instanceof WebGL2RenderingContext) { ... }
function getWebGL2RenderingContext() {
  class WebGL2RenderingContextNotSupported {}
  return glob.WebGL2RenderingContext || WebGL2RenderingContextNotSupported;
}

function getImage() {
  class ImageNotSupported {}
  return glob.Image || ImageNotSupported;
}

// Extracts constants from WebGL prototype
function getWebGLConstants() {
  const constants = {};
  const WebGLContext =
    glob.WebGL2RenderingContext || WebGLRenderingContext;
  console.error('***', WebGLRenderingContext.prototype);
  for (const key in WebGLContext.prototype) {
    if (typeof WebGLContext[key] !== 'function') {
      constants[key] = WebGLContext[key];
    }
  }
  Object.freeze(constants);
  return constants;
}

// const WebGL = getWebGLConstants();
const WebGL2RenderingContext = getWebGL2RenderingContext();
const Image = getImage();

export {
  WebGL,
  WebGL2RenderingContext,
  WebGLRenderingContext,
  WebGLBuffer,
  WebGLFramebuffer,
  WebGLRenderbuffer,
  Image
};
