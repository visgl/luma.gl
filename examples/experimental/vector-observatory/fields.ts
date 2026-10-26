// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {ScientificVectorFieldInput} from '@luma.gl/graph/experimental/simulation';

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
      if (name === 'weather') {
        // Illustrative normalized flow: evolving zonal winds and drifting storm systems.
        const longitude = horizontal * Math.PI * 2;
        const latitude = (vertical - 0.5) * Math.PI;
        const wave = longitude * 3 - time * 0.12;
        const jetLatitude = latitude + 0.12 * Math.sin(wave);
        const envelope = Math.cos(latitude) ** 2;
        eastward[index] = envelope * (0.035 + 0.055 * Math.sin(jetLatitude * 5));
        // Cross-equatorial meanders avoid an artificial latitude-zero transport barrier.
        northward[index] = envelope * 0.012 * Math.cos(wave) * Math.cos(latitude * 2);
        // Angular circulation stays finite at high latitudes: projected speed naturally
        // shrinks with the circumference, without leaving an artificial empty polar cap.
        const polarWeight = Math.min(1, Math.max(0, (Math.abs(latitude) - 0.7) / 0.65));
        const polarEnvelope = polarWeight * polarWeight * (3 - 2 * polarWeight);
        const hemisphere = latitude >= 0 ? 1 : -1;
        const polarWave = longitude * 3 - hemisphere * time * 0.18;
        eastward[index] += hemisphere * polarEnvelope * (0.06 + 0.018 * Math.cos(polarWave));
        northward[index] += polarEnvelope * Math.cos(latitude) * 0.012 * Math.sin(polarWave);
        for (const [centerLongitude, centerLatitude, spin] of [
          [0.22, 0.68, 1],
          [0.57, 0.3, -1],
          [0.78, 0.72, 1],
          [0.4, 0.4, -1]
        ]) {
          const center = centerLongitude + 0.025 * Math.sin(time * 0.09 + centerLongitude * 8);
          const horizontalDistance = ((horizontal - center + 1.5) % 1) - 0.5;
          const verticalDistance = vertical - centerLatitude - 0.025 * Math.sin(time * 0.11);
          const strength =
            spin * 1.7 * Math.exp(-(horizontalDistance ** 2 + verticalDistance ** 2) / 0.006);
          eastward[index] -= verticalDistance * strength * envelope;
          northward[index] += horizontalDistance * strength * envelope;
        }
      } else if (name === 'jet') {
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
