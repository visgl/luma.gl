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

class DummyWebGL2RenderingContext {}

// Ensure that WebGL2RenderingContext is defined so that apps can test
// with instanceof
const WebGL2RenderingContext =
  glob.WebGL2RenderingContext || DummyWebGL2RenderingContext;

export {
  WebGL2RenderingContext,
  WebGLRenderingContext,
  WebGLBuffer,
  WebGLFramebuffer,
  WebGLRenderbuffer
};
