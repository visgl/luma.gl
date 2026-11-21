// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {expect, it} from 'vitest';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPURigidBodyTerrainStream,
  GPURigidBodyWorld,
  makeRigidBodyTerrainFetchProvider,
  type GPURigidBodyTerrainTile
} from '../../src/gpu-physics';

it('publishes versioned mixed-resolution provider tiles into the same GPU graph', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    enableQueries: true,
    bodies: [
      {mass: 0, position: [0, 0, 0], shape: {type: 'height-field', field: {width: 3, height: 3}}},
      {mass: 0, position: [0, 0, 0], shape: {type: 'height-field', field: {width: 5, height: 5}}}
    ]
  });
  world.addToGraph(new GPUCommandGraph(device));
  const provider = new Map<string, GPURigidBodyTerrainTile>([
    [
      'coarse',
      {
        position: [0, 0, 0],
        field: {
          width: 3,
          height: 3,
          rowStep: [0, 2],
          columnStep: [2, 0],
          heights: new Float32Array([0, 0, 0, 0.5, 0.5, 0.5, 1, 1, 1])
        }
      }
    ],
    [
      'fine',
      {
        position: [4, 0, 0],
        field: {
          width: 5,
          height: 5,
          heights: Float32Array.from({length: 25}, (_, index) => Math.floor(index / 5) / 4 + 0.2)
        }
      }
    ],
    [
      'fine-raised',
      {
        position: [4, 0, 0],
        field: {
          width: 5,
          height: 5,
          heights: Float32Array.from({length: 25}, (_, index) => Math.floor(index / 5) / 4 + 0.4)
        }
      }
    ]
  ]);
  const stream = new GPURigidBodyTerrainStream(world, {
    provider: makeRigidBodyTerrainFetchProvider({
      getTileUrl: key => {
        const tile = provider.get(key)!;
        const payload = {...tile, field: {...tile.field, heights: Array.from(tile.field.heights!)}};
        return `data:application/json,${encodeURIComponent(JSON.stringify(payload))}`;
      },
      decode: async response => {
        const {position, field} = await response.json();
        return {position, field: {...field, heights: Float32Array.from(field.heights)}};
      }
    })
  });
  /** Cast straight down on a specific resident slot near or on a shared edge. */
  const sample = (collider: number, east: number, north: number) =>
    world.raycast({
      origin: [east, north, 5],
      direction: [0, 0, -1],
      maximumDistance: 8,
      colliderIndices: [collider]
    });
  try {
    const tiles = [
      {collider: 0, key: 'coarse'},
      {collider: 1, key: 'fine'}
    ];
    const seams = [
      {first: 0, firstEdge: 'last-column', second: 1, secondEdge: 'first-column'}
    ] as const;
    const bytes = world.getCapacityInfo().ownedBufferBytes;
    await stream.prepare({tiles, seams});
    expect((await sample(0, 4, 1)).hits).toEqual([]);
    expect(stream.apply()).toBe(true);

    for (const north of [0.5, 1, 1.5, 2.75, 3.5]) {
      const coarse = await sample(0, 4, north);
      const fine = await sample(1, 4, north);
      expect(coarse.complete && fine.complete).toBe(true);
      expect(coarse.hits[0].point[2]).toBeCloseTo(north / 4, 5);
      expect(fine.hits[0].point[2]).toBeCloseTo(coarse.hits[0].point[2], 5);
    }
    expect((await sample(1, 5.5, 2)).hits[0].point[2]).toBeCloseTo(0.7, 5);
    await stream.prepare({tiles: [tiles[0], {collider: 1, key: 'fine-raised'}], seams});
    expect(stream.apply()).toBe(true);
    expect((await sample(1, 5.5, 2)).hits[0].point[2]).toBeCloseTo(0.9, 5);
    expect((await sample(1, 4, 2)).hits[0].point[2]).toBeCloseTo(0.5, 5);
    expect(world.getCapacityInfo().ownedBufferBytes).toBe(bytes);
    stream.clear();
    expect((await sample(1, 5.5, 2)).hits).toEqual([]);
  } finally {
    world.destroy();
  }
}, 120000);
