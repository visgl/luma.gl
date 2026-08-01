// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  LIGHTSTORM_INSTANCE_WORD_COUNT,
  makeLightstormCity
} from '../../examples/showcase/lightstorm-megacity/lightstorm-data';

describe('Lightstorm Megacity data', () => {
  test('creates deterministic, conservatively bounded city records', () => {
    const instanceCount = 4096;
    const firstCity = makeLightstormCity(instanceCount);
    const secondCity = makeLightstormCity(instanceCount);

    expect(firstCity.instances).toEqual(secondCity.instances);
    expect(firstCity.instances.length).toBe(instanceCount * LIGHTSTORM_INSTANCE_WORD_COUNT);
    expect(firstCity.towerCount + firstCity.transitCount).toBe(instanceCount);
    expect(firstCity.towerCount).toBeGreaterThan(firstCity.transitCount);
    expect(firstCity.transitCount).toBeGreaterThan(0);

    for (let instanceIndex = 0; instanceIndex < instanceCount; instanceIndex++) {
      const wordOffset = instanceIndex * LIGHTSTORM_INSTANCE_WORD_COUNT;
      const radius = firstCity.instances[wordOffset + 3];
      const halfWidth = firstCity.instances[wordOffset + 4];
      const halfHeight = firstCity.instances[wordOffset + 5];
      const halfDepth = firstCity.instances[wordOffset + 6];
      const instanceKind = firstCity.instances[wordOffset + 11];
      expect(Number.isFinite(radius)).toBe(true);
      expect(radius).toBeGreaterThanOrEqual(Math.hypot(halfWidth, halfHeight, halfDepth) - 1e-5);
      expect(instanceKind === 0 || instanceKind === 1).toBe(true);
    }
  });
});
