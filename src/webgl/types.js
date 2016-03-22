// Helper definitions for validation of webgl parameters
import assert from 'assert';

// INDEX TYPES

// For drawElements, size of indices
export const INDEX_TYPES = ['UNSIGNED_BYTE', 'UNSIGNED_SHORT'];
export const GL_INDEX_TYPES = gl => INDEX_TYPES.map(constant => gl[constant]);

export function isIndexType(type) {
  return INDEX_TYPES.indexOf(type) !== -1;
}
export function isGLIndexType(glType) {
  return GL_INDEX_TYPES.indexOf(glType) !== -1;
}

// DRAW MODES

export const DRAW_MODES = [
  'POINTS', 'LINE_STRIP', 'LINE_LOOP', 'LINES',
  'TRIANGLE_STRIP', 'TRIANGLE_FAN', 'TRIANGLES'
];
export const GL_DRAW_MODES = gl => DRAW_MODES.map(constant => gl[constant]);

export function isDrawMode(mode) {
  return DRAW_MODES.indexOf(mode) !== -1;
}
export function isGLDrawMode(glMode) {
  return GL_DRAW_MODES.indexOf(glMode) !== -1;
}

// TYPED ARRAYS

export function isTypedArray(value) {
  return value.BYTES_PER_ELEMENT;
}

export function makeTypedArray(ArrayType, sourceArray) {
  assert(Array.isArray(sourceArray));
  const array = new ArrayType(sourceArray.length);
  for (let i = 0; i < sourceArray.length; ++i) {
    array[i] = sourceArray[i];
  }
  return array;
}
