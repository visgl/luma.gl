// Helper definitions for validation of webgl parameters

// For drawElements, size of indices
export const INDEX_TYPES = ['UNSIGNED_BYTE', 'UNSIGNED_SHORT'];
export const GL_INDEX_TYPES = gl => INDEX_TYPES.map(constant => gl[constant]);

export const DRAW_MODES = [
  'POINTS', 'LINE_STRIP', 'LINE_LOOP', 'LINES',
  'TRIANGLE_STRIP', 'TRIANGLE_FAN', 'TRIANGLES'
];
export const GL_DRAW_MODES = gl => DRAW_MODES.map(constant => gl[constant]);

export function isTypedArray(value) {
  return value.BYTES_PER_ELEMENT;
}
