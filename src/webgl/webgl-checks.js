// Helper definitions for validation of webgl parameters
/* eslint-disable no-inline-comments, max-len */
import {WebGL, WebGLRenderingContext} from './webgl-types';
import assert from 'assert';

const ERR_CONTEXT = 'Invalid WebGLRenderingContext';

export function assertWebGLRenderingContext(gl) {
  // Need to handle debug context
  assert(gl instanceof WebGLRenderingContext || gl.FLOAT !== 0, ERR_CONTEXT);
}

// INDEX TYPES

// TODO - move to glGet
export function glKey(value) {
  for (const key in WebGL) {
    if (WebGL[key] === value) {
      return key;
    }
  }
  return String(value);
}

// For drawElements, size of indices
export const GL_INDEX_TYPES = [
  'UNSIGNED_BYTE', 'UNSIGNED_SHORT', 'UNSIGNED_INT'
]
.map(constant => WebGL[constant]);

export function isIndexType(type) {
  return GL_INDEX_TYPES.indexOf(type) !== -1;
}

export function assertIndexType(glType, source) {
  assert(isIndexType(glType), `Bad index type gl.${glKey(glType)} ${source}`);
}

// DRAW MODES

export const GL_DRAW_MODES = [
  'POINTS', 'LINE_STRIP', 'LINE_LOOP', 'LINES',
  'TRIANGLE_STRIP', 'TRIANGLE_FAN', 'TRIANGLES'
]
.map(constant => WebGL[constant]);

export function isDrawMode(glMode) {
  return GL_DRAW_MODES.indexOf(glMode) !== -1;
}

export function assertDrawMode(glType, source) {
  assert(isDrawMode(glType), `Bad draw mode gl.${glKey(glType)} ${source}`);
}

// TARGET TYPES

export const GL_TARGETS = [
  'ARRAY_BUFFER', // vertex attributes (e.g. vertex/texture coords or color)
  'ELEMENT_ARRAY_BUFFER', // Buffer used for element indices.
  // For WebGL 2 contexts
  'COPY_READ_BUFFER', // Buffer for copying from one buffer object to another
  'COPY_WRITE_BUFFER', // Buffer for copying from one buffer object to another
  'TRANSFORM_FEEDBACK_BUFFER', // Buffer for transform feedback operations
  'UNIFORM_BUFFER', // Buffer used for storing uniform blocks
  'PIXEL_PACK_BUFFER', // Buffer used for pixel transfer operations
  'PIXEL_UNPACK_BUFFER' // Buffer used for pixel transfer operations
]
.map(constant => WebGL[constant]).filter(constant => constant);

// USAGE TYPES

export const GL_BUFFER_USAGE = [
  'STATIC_DRAW', // Buffer used often and not change often. Contents are written to the buffer, but not read.
  'DYNAMIC_DRAW', // Buffer used often and change often. Contents are written to the buffer, but not read.
  'STREAM_DRAW', // Buffer not used often. Contents are written to the buffer, but not read.
  // For WebGL 2 contexts
  'STATIC_READ', // Buffer used often and not change often. Contents are read from the buffer, but not written.
  'DYNAMIC_READ', // Buffer used often and change often. Contents are read from the buffer, but not written.
  'STREAM_READ', // Contents of the buffer are likely to not be used often. Contents are read from the buffer, but not written.
  'STATIC_COPY', // Buffer used often and not change often. Contents are neither written or read by the user.
  'DYNAMIC_COPY', // Buffer used often and change often. Contents are neither written or read by the user.
  'STREAM_COPY' // Buffer used often and not change often. Contents are neither written or read by the user.
]
.map(constant => WebGL[constant]).filter(constant => constant);

export function glTypeFromArray(array) {
  // Sorted in some order of likelihood to reduce amount of comparisons
  if (array instanceof Float32Array) {
    return WebGL.FLOAT;
  } else if (array instanceof Uint16Array) {
    return WebGL.UNSIGNED_SHORT;
  } else if (array instanceof Uint32Array) {
    return WebGL.UNSIGNED_INT;
  } else if (array instanceof Uint8Array) {
    return WebGL.UNSIGNED_BYTE;
  } else if (array instanceof Uint8ClampedArray) {
    return WebGL.UNSIGNED_BYTE;
  } else if (array instanceof Int8Array) {
    return WebGL.BYTE;
  } else if (array instanceof Int16Array) {
    return WebGL.SHORT;
  } else if (array instanceof Int32Array) {
    return WebGL.INT;
  }
  throw new Error('Failed to deduce WebGL type from array');
}

export function assertArrayTypeMatch(array, type, source) {
  assert(type === glTypeFromArray(array),
    `${array.constructor.name || 'Array'} ` +
    `does not match element type gl.${glKey(type)} ${source}`);
}

/* eslint-disable complexity */
export function glArrayFromType(glType, clamped = false) {
  // Sorted in some order of likelihood to reduce amount of comparisons
  switch (glType) {
  case WebGL.FLOAT:
    return Float32Array;
  case WebGL.UNSIGNED_SHORT:
  case WebGL.UNSIGNED_SHORT_5_6_5:
  case WebGL.UNSIGNED_SHORT_4_4_4_4:
  case WebGL.UNSIGNED_SHORT_5_5_5_1:
    return Uint16Array;
  case WebGL.UNSIGNED_INT:
  // case WebGL.UNSIGNED_INT_2_10_10_10_REV:
  // case WebGL.UNSIGNED_INT_10F_11F_11F_REV:
  // case WebGL.UNSIGNED_INT_5_9_9_9_REV:
  // case WebGL.UNSIGNED_INT_24_8:
    return Uint32Array;
  case WebGL.UNSIGNED_BYTE:
    return clamped ? Uint8ClampedArray : Uint8Array;
  case WebGL.BYTE:
    return Int8Array;
  case WebGL.SHORT:
    return Int16Array;
  case WebGL.INT:
    return Int32Array;


  default:
    throw new Error('Failed to deduce type from array');
  }
}
/* eslint-enable complexity */

