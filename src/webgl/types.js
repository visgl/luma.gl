// Helper definitions for validation of webgl parameters
/* eslint-disable no-inline-comments, max-len */

// TODO - remove
export {isTypedArray, makeTypedArray} from '../utils';

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

// TARGET TYPES

export const TARGETS = [
  'ARRAY_BUFFER', // vertex attributes (e.g. vertex/texture coords or color)
  'ELEMENT_ARRAY_BUFFER', // Buffer used for element indices.
  // For WebGL 2 contexts
  'COPY_READ_BUFFER', // Buffer for copying from one buffer object to another
  'COPY_WRITE_BUFFER', // Buffer for copying from one buffer object to another
  'TRANSFORM_FEEDBACK_BUFFER', // Buffer for transform feedback operations
  'UNIFORM_BUFFER', // Buffer used for storing uniform blocks
  'PIXEL_PACK_BUFFER', // Buffer used for pixel transfer operations
  'PIXEL_UNPACK_BUFFER' // Buffer used for pixel transfer operations
];

export const GL_TARGETS =
  gl => TARGETS.map(constant => gl[constant]).filter(constant => constant);

// USAGE TYPES

export const BUFFER_USAGE = [
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
];

export const GL_BUFFER_USAGE =
  gl => BUFFER_USAGE.map(constant => gl[constant]).filter(constant => constant);
