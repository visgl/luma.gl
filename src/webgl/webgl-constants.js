// WEBGL BUILT-IN TYPES
import GL from 'gl-constants';
import assert from 'assert';

export {GL};
export default GL;

// Resolve a WebGL enumeration name (returns itself if already a number)
export function glGet(name) {
  // assertWebGLContext(gl);
  let value = name;
  if (typeof name === 'string') {
    value = GL[name];
    assert(value !== undefined, `Accessing GL.${name}`);
  }
  return value;
}

export function glKey(value) {
  for (const key in GL) {
    if (GL[key] === value) {
      return `GL.${key}`;
    }
  }
  return String(value);
}

// Extract constants from WebGL prototype
// function getWebGLConstants() {
//   const constants = {};
//   const WebGLContext =
//     glob.WebGL2RenderingContext || WebGLRenderingContext;
//   for (const key in WebGLContext.prototype) {
//     if (typeof WebGLContext[key] !== 'function') {
//       constants[key] = WebGLContext[key];
//     }
//   }
//   Object.freeze(constants);
//   return constants;
// }

// const GL = getWebGLConstants();
