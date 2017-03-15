/* eslint-disable no-shadow */
import {glMatrix} from 'gl-matrix';

// TODO - remove
glMatrix.debug = true;
glMatrix.printRowMajor = true;

export {glMatrix};

export function configure(options) {
  if ('epsilon' in options) {
    glMatrix.EPSILON = options.epsilon;
  }

  if ('debug' in options) {
    glMatrix.debug = options.debug;
  }
}

export function formatValue(value, precision = glMatrix.precision || 4) {
  return parseFloat(value.toPrecision(precision));
}

// Returns true if value is either an array or a typed array
// Note: does not return true for ArrayBuffers and DataViews
export function isArray(value) {
  return Array.isArray(value) || (ArrayBuffer.isView(value) && value.length !== undefined);
}

// If the array has a clone function, calls it, otherwise returns a copy
export function clone(array) {
  return array.clone ? array.clone() : new Array(array);
}

// If the argument value is an array, applies the func element wise,
// otherwise applies func to the argument value
function map(value, func) {
  if (isArray(value)) {
    const result = clone(value);
    for (let i = 0; i < result.length; ++i) {
      result[i] = func(result[i], i, result);
    }
    return result;
  }
  return func(value);
}

//
// GLSL math function equivalents
// Works on both single values and vectors
//

export function radians(degrees) {
  return map(degrees, degrees => degrees / 180 * Math.PI);
}

// GLSL equivalent: Works on single values and vectors
export function degrees(radians) {
  return map(radians, radians => radians * 180 / Math.PI);
}

// GLSL equivalent: Works on single values and vectors
export function sin(radians) {
  return map(radians, angle => Math.sin(angle));
}

// GLSL equivalent: Works on single values and vectors
export function cos(radians) {
  return map(radians, angle => Math.cos(angle));
}

// GLSL equivalent: Works on single values and vectors
export function tan(radians) {
  return map(radians, angle => Math.tan(angle));
}

// GLSL equivalent: Works on single values and vectors
export function asin(radians) {
  return map(radians, angle => Math.asin(angle));
}

// GLSL equivalent: Works on single values and vectors
export function acos(radians) {
  return map(radians, angle => Math.acos(angle));
}

// GLSL equivalent: Works on single values and vectors
export function atan(radians) {
  return map(radians, angle => Math.atan(angle));
}

// TODO - glsl equivalent
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function equals(a, b) {
  return Math.abs(a - b) <=
    glMatrix.EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
}
