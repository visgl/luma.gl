export function fp64ify(a, array = [], startIndex = 0) {
  const hiPart = Math.fround(a);
  const loPart = a - Math.fround(a);
  array[startIndex] = hiPart;
  array[startIndex + 1] = loPart;
  return array;
}

export function fp64LowPart(a) {
  return a - Math.fround(a);
}

// calculate WebGL 64 bit matrix (transposed "Float64Array")
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
