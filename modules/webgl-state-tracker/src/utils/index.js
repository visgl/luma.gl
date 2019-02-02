export {default as deepArrayEqual} from './deep-array-equal';

// Avoid bundling assert polyfill module
export function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'luma.gl: assertion failed.');
  }
}

// Returns true if given object is empty, false otherwise.
export function isObjectEmpty(object) {
  for (const key in object) {
    return false;
  }
  return true;
}

// Returns true if WebGL2 context (Heuristic)
export function isWebGL2(gl) {
  const GL_TEXTURE_BINDING_3D = 0x806a;
  return gl && gl.TEXTURE_BINDING_3D === GL_TEXTURE_BINDING_3D;
}
