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

class UndefinedWebGL2RenderingContext {}

// Ensure that WebGL2RenderingContext is defined even in non-WebGL2
// environments so that apps can test their gl contexts with
// if (gl instanceof WebGL2RenderingContext) { ... }

const WebGL2RenderingContext =
  glob.WebGL2RenderingContext || UndefinedWebGL2RenderingContext;

export {
  WebGL2RenderingContext,
  WebGLRenderingContext,
  WebGLBuffer,
  WebGLFramebuffer,
  WebGLRenderbuffer
};
