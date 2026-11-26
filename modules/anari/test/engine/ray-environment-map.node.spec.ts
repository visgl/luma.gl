// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  getEnvironmentMapDistribution,
  RAY_LIGHT_FLOAT_COUNT
} from '../../src/engine/ray-tracing-environment-map';

it('weights directional environment texels by luminance and their solid angle', () => {
  const width = 4;
  const height = 4;
  const data = new Float32Array(width * height * 3).fill(1);
  data[width * 3] = 100;
  const distribution = getEnvironmentMapDistribution({width, height, data});
  let probability = 0;
  for (let row = 0; row < height; row++) {
    const solidAngle =
      ((2 * Math.PI) / width) *
      (Math.cos((Math.PI * row) / height) - Math.cos((Math.PI * (row + 1)) / height));
    for (let column = 0; column < width; column++) {
      const offset = (row * width + column) * RAY_LIGHT_FLOAT_COUNT;
      probability += distribution[offset + 3] * solidAngle;
      expect(distribution[offset + 4]).toBeCloseTo(probability, 6);
    }
  }
  expect(probability).toBeCloseTo(1, 6);
  expect(distribution[width * RAY_LIGHT_FLOAT_COUNT + 3]).toBeGreaterThan(distribution[3] * 20);
});

it('uses a uniform solid-angle PDF for a black environment', () => {
  const distribution = getEnvironmentMapDistribution({
    width: 2,
    height: 4,
    data: new Float32Array(24)
  });
  for (let offset = 0; offset < distribution.length; offset += RAY_LIGHT_FLOAT_COUNT) {
    expect(distribution[offset + 3]).toBeCloseTo(1 / (4 * Math.PI), 6);
  }
});
