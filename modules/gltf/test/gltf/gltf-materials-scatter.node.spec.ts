// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getSingleScatterAlbedo,
  getThinWallScatterWeights
} from '../../src/gltf/gltf-materials-scatter';

test('scatter albedo recovers exact absorption and remains finite near phase limits', () => {
  for (const anisotropy of [-0.999, 0, 0.999]) {
    expect(getSingleScatterAlbedo(0, anisotropy)).toBe(0);
    for (const albedo of [0.001, 0.25, 0.5, 1]) {
      const result = getSingleScatterAlbedo(albedo, anisotropy);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    }
  }
});

test('thin-wall scatter conserves the transmission budget across both hemispheres', () => {
  for (const strength of [0, 0.5, 1]) {
    for (const anisotropy of [-0.999, 0, 0.999]) {
      const weights = getThinWallScatterWeights(strength, 0.7, anisotropy);
      expect(
        weights.specularTransmission + weights.diffuseTransmission + weights.diffuseReflection
      ).toBeCloseTo(0.7);
    }
  }
  expect(getThinWallScatterWeights(0, 0.7, 0)).toEqual({
    specularTransmission: 0.7,
    diffuseTransmission: 0,
    diffuseReflection: 0
  });
});
