import assert from '../utils/assert';
import log from '../utils/log';

// Resolve a WebGL enumeration name (returns itself if already a number)
export function getKeyValue(gl, name) {
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
  const value = gl[name];
  assert(value !== undefined, `Accessing undefined constant GL.${name}`);
  return value;
}

export function getKey(gl, value) {
  value = Number(value);
  for (const key in gl) {
    if (gl[key] === value) {
      return `GL.${key}`;
    }
  }
  return String(value);
}

export function getKeyType(gl, value) {
  assert(value !== undefined, 'undefined key');
  value = Number(value);
  for (const key in gl) {
    if (gl[key] === value) {
      return `GL.${key}`;
    }
  }
  return String(value);
}

// Public methods

// Resolve a WebGL enumeration name (returns itself if already a number)
// TODO - unify with methods above
export function glGet(gl, name) {
  if (!name) {
    log.removed('glGet(name)', 'glGet(gl, name)', '6.0')();
  }
  return getKeyValue(gl, name);
}

export function glKey(gl, value) {
  if (value === undefined) {
    log.removed('glKey(value)', 'glKey(gl, value)', '6.0')();
  }
  return getKey(gl, value);
}

export function glKeyType(gl, value) {
  if (value === undefined) {
    log.removed('glKeyType(value)', 'glKeyType(gl, value)', '6.0')();
  }
  return getKeyType(gl, value);
}
