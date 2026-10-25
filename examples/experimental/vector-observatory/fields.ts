// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {ScientificVectorFieldInput} from '@luma.gl/experimental';

/** Reproducible analytic benchmarks, not observational ocean or weather data. */
export function makeField(name: string, time = 0): ScientificVectorFieldInput {
  const size = 256;
  const eastward = new Float32Array(size * size);
  const northward = new Float32Array(size * size);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const horizontal = column / (size - 1);
      const vertical = row / (size - 1);
      const index = row * size + column;
      if (name === 'jet') {
        const center = 0.5 + 0.16 * Math.sin(horizontal * Math.PI * 4);
        const distance = (vertical - center) * 10;
        eastward[index] = 0.14 / Math.cosh(distance) ** 2;
        northward[index] = eastward[index] * 0.64 * Math.PI * Math.cos(horizontal * Math.PI * 4);
      } else if (name === 'vortex') {
        for (const center of [0.32, 0.68]) {
          const horizontalDistance = horizontal - center;
          const verticalDistance = vertical - 0.5;
          const strength =
            ((center < 0.5 ? 1 : -1) * 0.012) /
            (horizontalDistance ** 2 + verticalDistance ** 2 + 0.015);
          eastward[index] -= verticalDistance * strength;
          northward[index] += horizontalDistance * strength;
        }
      } else {
        const oscillation = 0.25 * Math.sin((2 * Math.PI * time) / 10);
        const coordinate = 2 * horizontal;
        const warped = oscillation * coordinate ** 2 + (1 - 2 * oscillation) * coordinate;
        const derivative = 2 * oscillation * coordinate + 1 - 2 * oscillation;
        eastward[index] = -0.13 * Math.sin(Math.PI * warped) * Math.cos(Math.PI * vertical);
        northward[index] =
          0.26 * Math.cos(Math.PI * warped) * Math.sin(Math.PI * vertical) * derivative;
      }
    }
  }
  return {
    dimensions: ['y', 'x'],
    shape: [size, size],
    eastward,
    northward,
    valid: new Uint8Array(size * size).fill(1)
  };
}
