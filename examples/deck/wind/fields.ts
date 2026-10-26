// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {ScientificVectorFieldInput} from '@luma.gl/graph/experimental/simulation';

export const WIND_BOUNDS = [-180, -75, 180, 75] as const;

/** Synthetic angular winds in degrees per illustrative second, not forecast measurements. */
export function makeWindField(): ScientificVectorFieldInput {
  const width = 192;
  const height = 96;
  const eastward = new Float32Array(width * height);
  const northward = new Float32Array(width * height);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const horizontal = column / (width - 1);
      const vertical = row / (height - 1);
      const longitude = horizontal * Math.PI * 2;
      const latitude = (vertical - 0.5) * Math.PI;
      const envelope = Math.cos(latitude) ** 2;
      const index = row * width + column;
      eastward[index] =
        360 * envelope * (0.012 + 0.018 * Math.sin(latitude * 4 + 0.4 * Math.sin(longitude * 3)));
      northward[index] = 150 * envelope * 0.012 * Math.cos(longitude * 3) * Math.cos(latitude * 2);
      for (const [centerLongitude, centerLatitude, spin] of [
        [0.35, 0.68, 1],
        [0.62, 0.32, -1],
        [0.8, 0.7, 1]
      ]) {
        const horizontalDistance = ((horizontal - centerLongitude + 1.5) % 1) - 0.5;
        const verticalDistance = vertical - centerLatitude;
        const strength =
          spin * Math.exp(-(horizontalDistance ** 2 + verticalDistance ** 2) / 0.008);
        eastward[index] -= 360 * verticalDistance * strength;
        northward[index] += 150 * horizontalDistance * strength;
      }
    }
  }
  return {
    dimensions: ['y', 'x'],
    shape: [height, width],
    eastward,
    northward,
    valid: new Uint8Array(width * height).fill(1)
  };
}
