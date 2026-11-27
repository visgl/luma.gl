// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {SphericalVectorFieldInput} from '@luma.gl/graph/experimental-simulation';

/** Smooth global rotation with an evolving axis, in illustrative unit-sphere seconds. */
export function makeSphericalField(time: number): SphericalVectorFieldInput {
  const width = 129;
  const height = 65;
  const velocity = new Float32Array(width * height * 3);
  const axis = [0.12 * Math.sin(time * 0.08), 0.22, 0.08 * Math.cos(time * 0.08)];
  for (let row = 0; row < height; row++) {
    const latitude = -Math.PI / 2 + (row / (height - 1)) * Math.PI;
    for (let column = 0; column < width; column++) {
      const longitude = -Math.PI + (column / (width - 1)) * 2 * Math.PI;
      const horizontal = Math.cos(latitude) * Math.cos(longitude);
      const vertical = Math.cos(latitude) * Math.sin(longitude);
      const polar = Math.sin(latitude);
      velocity.set(
        [
          axis[1] * polar - axis[2] * vertical,
          axis[2] * horizontal - axis[0] * polar,
          axis[0] * vertical - axis[1] * horizontal
        ],
        (row * width + column) * 3
      );
    }
  }
  return {shape: [height, width], velocity};
}

/** Equal-area stable particle release, including neither duplicated pole nor longitude seam. */
export function makeSphericalPositions(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index++) {
    const polar = 1 - (2 * (index + 0.5)) / count;
    const longitude = index * Math.PI * (3 - Math.sqrt(5));
    const radius = Math.sqrt(1 - polar * polar);
    positions.set([radius * Math.cos(longitude), radius * Math.sin(longitude), polar], index * 3);
  }
  return positions;
}
