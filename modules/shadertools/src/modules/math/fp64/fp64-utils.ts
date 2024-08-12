// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumericArray} from '@math.gl/types';

/**
 * Calculate WebGL 64 bit float
 * @param a  - the input float number
 * @param out - the output array. If not supplied, a new array is created.
 * @param startIndex - the index in the output array to fill from. Default 0.
 * @returns - the fp64 representation of the input number
 */
export function fp64ify(a: number, out: NumericArray = [], startIndex: number = 0): NumericArray {
  const hiPart = Math.fround(a);
  const loPart = a - hiPart;
  out[startIndex] = hiPart;
  out[startIndex + 1] = loPart;
  return out;
}

/**
 * Calculate the low part of a WebGL 64 bit float
 * @param a the input float number
 * @returns the lower 32 bit of the number
 */
export function fp64LowPart(a: number): number {
  return a - Math.fround(a);
}

/**
 * Calculate WebGL 64 bit matrix (transposed "Float64Array")
 * @param matrix  the input matrix
 * @returns the fp64 representation of the input matrix
 */
export function fp64ifyMatrix4(matrix: NumericArray): Float32Array {
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
