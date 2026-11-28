// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {StaggeredVectorFieldInput} from '@luma.gl/graph/experimental-simulation';

/** Manufacture a closed gyre from vertex streamfunction differences, preserving cell flux balance. */
export function makeStaggeredGyre(): StaggeredVectorFieldInput {
  const size = 32;
  const eastward = new Float32Array(size * (size + 1));
  const northward = new Float32Array((size + 1) * size);
  /** Zero boundary streamfunction makes exterior normal face velocities zero. */
  function streamfunction(column: number, row: number): number {
    if (column === 0 || row === 0 || column === size || row === size) return 0;
    return Math.sin((column * Math.PI) / size) * Math.sin((row * Math.PI) / size) * 0.06;
  }
  for (let row = 0; row <= size; row++) {
    for (let column = 0; column <= size; column++) {
      if (row < size)
        eastward[row * (size + 1) + column] =
          -size * (streamfunction(column, row + 1) - streamfunction(column, row));
      if (column < size)
        northward[row * size + column] =
          size * (streamfunction(column + 1, row) - streamfunction(column, row));
    }
  }
  return {
    layout: 'c-grid',
    shape: [size, size],
    eastward,
    northward,
    eastwardValid: new Uint8Array(eastward.length).fill(1),
    northwardValid: new Uint8Array(northward.length).fill(1)
  };
}
