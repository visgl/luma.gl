// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {expect, it} from 'vitest';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  getRigidBodyTerrainTileBounds,
  GPURigidBodyTerrainSelector,
  GPURigidBodyTerrainStream,
  GPURigidBodyWorld,
  type GPURigidBody
} from '../../src/gpu-physics';

it('moves a GPU collision window and chooses a coarser LOD when the footprint grows', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const bounds = [0, 0, 64, 64] as const;
  const bodies: GPURigidBody[] = Array.from({length: 8}, () => ({
    mass: 0,
    position: [0, 0, 0],
    shape: {type: 'height-field', field: {width: 5, height: 5}}
  }));
  const world = new GPURigidBodyWorld({enableQueries: true, bodies});
  world.addToGraph(new GPUCommandGraph(device));
  const selector = new GPURigidBodyTerrainSelector({
    bounds,
    slots: bodies.map((_, index) => index),
    maximumLevel: 4
  });
  const stream = new GPURigidBodyTerrainStream(world, {
    provider: {
      async loadTile(key) {
        const [level, column, row] = key.split('/').map(Number);
        const [west, south, east, north] = getRigidBodyTerrainTileBounds(bounds, {
          level,
          column,
          row
        });
        const columnSpacing = (east - west) / 4;
        const rowSpacing = (north - south) / 4;
        const heights = Float32Array.from(
          {length: 25},
          (_, index) =>
            (west + (index % 5) * columnSpacing + south + Math.floor(index / 5) * rowSpacing) / 16
        );
        return {
          position: [west, south, 0],
          field: {
            width: 5,
            height: 5,
            heights,
            columnStep: [columnSpacing, 0],
            rowStep: [0, rowSpacing]
          }
        };
      }
    }
  });
  /** Downward ray for the currently active window. */
  const sample = (east: number, north: number) =>
    world.raycast({
      origin: [east, north, 12],
      direction: [0, 0, -1],
      maximumDistance: 20
    });
  try {
    const before = world.getCapacityInfo().ownedBufferBytes;
    const first = selector.select({position: [10, 10], radius: 5});
    expect(Math.max(...first.tiles.map(tile => tile.address.level))).toBe(4);
    expect(await stream.prepare(first)).toBe(true);
    stream.apply();
    expect((await sample(10, 10)).hits[0].point[2]).toBeCloseTo(1.25, 5);
    const wide = selector.select({position: [50, 50]});
    expect(Math.max(...wide.tiles.map(tile => tile.address.level))).toBeLessThan(4);
    expect(await stream.prepare(wide)).toBe(true);
    expect((await sample(50, 50)).hits).toEqual([]);
    stream.apply();
    expect((await sample(50, 50)).hits[0].point[2]).toBeCloseTo(6.25, 5);
    expect((await sample(10, 10)).hits[0].point[2]).toBeCloseTo(1.25, 5);
    const last = selector.select({position: [50, 50], radius: 5});
    await stream.prepare(last);
    stream.apply();
    expect((await sample(10, 10)).hits).toEqual([]);
    expect((await sample(50, 50)).hits[0].point[2]).toBeCloseTo(6.25, 5);
    expect(world.getCapacityInfo().ownedBufferBytes).toBe(before);
  } finally {
    world.destroy();
  }
}, 120000);
