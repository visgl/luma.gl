// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {StaggeredVectorFieldInput} from '@luma.gl/graph/experimental-simulation';

/** Manufacture a closed gyre from vertex streamfunction differences, preserving cell flux balance. */
export function makeStaggeredGyre(): StaggeredVectorFieldInput {
  /** Cell count on each axis of the unit square. */
  const size = 32;
  /** Normal velocities on vertical faces, including both exterior columns. */
  const eastward = new Float32Array(size * (size + 1));
  /** Normal velocities on horizontal faces, including both exterior rows. */
  const northward = new Float32Array((size + 1) * size);
  /** Zero boundary streamfunction makes exterior normal face velocities zero. */
  function evaluateStreamfunction(column: number, row: number): number {
    if (column === 0 || row === 0 || column === size || row === size) return 0;
    return Math.sin((column * Math.PI) / size) * Math.sin((row * Math.PI) / size) * 0.06;
  }
  /** Vertex-row cursor for constructing the two face arrays. */
  for (let row = 0; row <= size; row++) {
    /** Vertex-column cursor; each interior pair supplies a face flux difference. */
    for (let column = 0; column <= size; column++) {
      if (row < size)
        eastward[row * (size + 1) + column] =
          -size * (evaluateStreamfunction(column, row + 1) - evaluateStreamfunction(column, row));
      if (column < size)
        northward[row * size + column] =
          size * (evaluateStreamfunction(column + 1, row) - evaluateStreamfunction(column, row));
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
