// WEBGL BUILT-IN TYPES
// Convenience: enable app to "import" built-in WebGL types unknown to eslint
/* global window */
const glob = typeof window !== 'undefined' ? window : require('gl/wrap');
const {WebGLRenderingContext, WebGLBuffer} = glob;
export {WebGLRenderingContext, WebGLBuffer};
