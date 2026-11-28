// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {WebMercatorViewport} from '@deck.gl/core';
import {GPUH3MapPointSource} from '@deck.gl-community/gpu-layers';
import {NullDevice} from '@luma.gl/core/test-utils';
import {GPUVector} from '@luma.gl/graph/gpu-data';
import type {ProjectionBounds} from '@luma.gl/graph/gpu-project';
import {expect, it} from 'vitest';

it('maps a region next to the antimeridian into the canonical Deck world', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const cells = new GPUVector({type: 'data', name: 'empty', format: 'uint32x2', data: []});
  const source = new GPUH3MapPointSource(device, {cells, bounds: [179.75, 69.9, 180, 70.1]});
  try {
    const point = [179.99, 70.01] as const;
    const expected = new WebMercatorViewport().projectPosition([...point, 0]);
    const projected = source.transform.projectPosition(point)!;
    expect(source.commonOrigin[0] + projected.common[0]).toBeCloseTo(expected[0], 9);
    expect(source.commonOrigin[1] + projected.common[1]).toBeCloseTo(expected[1], 9);
    expect(source.transform.projectPosition([-179.99, 70.01])).toBeNull();
    expect(source.positions.length).toBe(0);
    source.updateChunks();
  } finally {
    source.destroy();
    cells.destroy();
    device.destroy();
  }
});

it('rejects wrapping, polar, and unordered H3 map bounds', () => {
  const device = new NullDevice({});
  const cells = new GPUVector({type: 'data', name: 'empty', format: 'uint32x2', data: []});
  const invalidBounds: ProjectionBounds[] = [
    [170, -10, -170, 10],
    [-190, -10, -170, 10],
    [-10, -90, 10, 10],
    [-10, 10, 10, 10]
  ];
  try {
    for (const bounds of invalidBounds) {
      expect(() => new GPUH3MapPointSource(device, {cells, bounds})).toThrow(/Web Mercator world/);
    }
  } finally {
    cells.destroy();
    device.destroy();
  }
});
