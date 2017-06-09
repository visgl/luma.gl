// WEBGL BUILT-IN CONSTANTS
import GL from './api/constants';
import assert from 'assert';

export {GL};
export default GL;

// Resolve a WebGL enumeration name (returns itself if already a number)
export function glGet(name) {
  // If not a string, return (assume number)
  if (typeof name !== 'string') {
    return name;
  }

  // If string converts to number, return number
  const number = Number(name);
  if (!isNaN(number)) {
    return number;
  }

  // Look up string, after removing any 'GL.' or 'gl.' prefix
  name = name.replace(/^.*\./, '');
  const value = GL[name];
  assert(value !== undefined, `Accessing undefined constant GL.${name}`);
  return value;
}

export function glKey(value) {
  value = Number(value);
  for (const key in GL) {
    if (GL[key] === value) {
      return `GL.${key}`;
    }
  }
  return String(value);
}

export function glKeyType(value) {
  assert(value !== undefined, 'undefined key');
  value = Number(value);
  for (const key in GL) {
    if (GL[key] === value) {
      return `GL.${key}`;
    }
  }
  return String(value);
}
