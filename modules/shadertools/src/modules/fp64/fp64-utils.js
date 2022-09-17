/** @typedef {import('./fp64-utils')} types */

/**
 * Calculate WebGL 64 bit float
 * @type {types['fp64ify']}
 */
export function fp64ify(a, out = [], startIndex = 0) {
  const hiPart = Math.fround(a);
  const loPart = a - hiPart;
  out[startIndex] = hiPart;
  out[startIndex + 1] = loPart;
  return out;
}

/** @type {types['fp64LowPart']} */
export function fp64LowPart(a) {
  return a - Math.fround(a);
}

/**
 * Calculate WebGL 64 bit matrix (transposed "Float64Array")
 * @type {types['fp64ifyMatrix4']}
 * */
export function fp64ifyMatrix4(matrix) {
  // Transpose the projection matrix to column major for GLSL.
  const matrixFP64 = new Float32Array(32);
  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      const index = i * 4 + j;
      fp64ify(matrix[j * 4 + i], matrixFP64, index * 2);
    }
  }
  return matrixFP64;
}
