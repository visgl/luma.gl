// WEBGL BUILT-IN TYPES

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

// const WebGL = getWebGLConstants();
const WebGL2RenderingContext = getWebGL2RenderingContext();
const Image = getImage();

export {
  WebGL2RenderingContext,
  WebGLRenderingContext,
  WebGLBuffer,
  WebGLFramebuffer,
  WebGLRenderbuffer,
  Image
};

// Convenience
export {default as WebGL} from './webgl-constants';
