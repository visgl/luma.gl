// WEBGL BUILT-IN TYPES
import WebGL from 'gl-constants';

// Extracts constants from WebGL prototype
function getWebGLConstants() {
  const constants = {};
  const WebGLContext =
    glob.WebGL2RenderingContext || WebGLRenderingContext;
  for (const key in WebGLContext.prototype) {
    if (typeof WebGLContext[key] !== 'function') {
      constants[key] = WebGLContext[key];
    }
  }
  Object.freeze(constants);
  return constants;
}

// const WebGL = getWebGLConstants();

export default WebGL;
