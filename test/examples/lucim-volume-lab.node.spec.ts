// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  VOLUME_LAB_DIMENSIONS,
  makeVolumeLabDataset
} from '../../examples/experimental/lucim-volume-lab/volume-lab-data';

describe('LuCIM Volume Lab synthetic fixture', () => {
  test('creates deterministic CT-like density, physical metadata, and independent validity', () => {
    const first = makeVolumeLabDataset();
    const second = makeVolumeLabDataset();
    const [width, height, depth] = VOLUME_LAB_DIMENSIONS;

    expect(first.metadata.width).toBe(width);
    expect(first.metadata.height).toBe(height);
    expect(first.metadata.depth).toBe(depth);
    expect(first.metadata.spacing).toEqual([0.82, 0.82, 1.35]);
    expect(first.values).toEqual(second.values);
    expect(first.validity).toEqual(second.validity);
    expect(first.values).toHaveLength(width * height * depth);
    expect(first.validVoxelCount + first.missingVoxelCount).toBe(first.values.length);
    expect(first.missingVoxelCount).toBeGreaterThan(0);
    const [minimumDensity, maximumDensity] = first.values.reduce(
      ([minimum, maximum], value) => [Math.min(minimum, value), Math.max(maximum, value)],
      [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]
    );
    expect(minimumDensity).toBeLessThanOrEqual(-1000);
    expect(maximumDensity).toBeGreaterThan(1100);

    const centerIndex = getIndex(
      Math.floor(width / 2),
      Math.floor(height / 2),
      Math.floor(depth / 2),
      width,
      height
    );
    expect(first.validity[centerIndex]).toBe(1);
    expect(first.values[centerIndex]).toBeGreaterThan(-50);
    expect(first.values[centerIndex]).toBeLessThan(80);
  });
});

function getIndex(x: number, y: number, z: number, width: number, height: number): number {
  return (z * height + y) * width + x;
}
