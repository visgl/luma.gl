// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {expect, it} from 'vitest';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPUPhysicsEnsemble,
  GPURigidBodyWorld,
  type GPURigidBodyTerrainTile,
  type GPURigidBodyWorldProps
} from '../../src/gpu-physics';

/** Nine samples cover an eight-meter square around the world origin. */
function makeTile(
  height: number,
  position: GPURigidBodyTerrainTile['position'] = [-4, -4, 0]
): GPURigidBodyTerrainTile {
  return {
    position,
    field: {
      width: 3,
      height: 3,
      columnStep: [4, 0],
      rowStep: [0, 4],
      heights: new Float32Array(9).fill(height)
    }
  };
}

const template: GPURigidBodyWorldProps = {
  gravity: [0, 0, -9.81],
  enableQueries: true,
  sleepAfter: 0.04,
  bodies: [
    {position: [0.25, 0.5, 0.5], restitution: 0, shape: {type: 'sphere', radius: 0.5}},
    {position: [0, 0, 0], mass: 0, shape: {type: 'height-field', field: {width: 3, height: 3}}},
    {position: [0, 0, 0], mass: 0, shape: {type: 'height-field', field: {width: 3, height: 3}}},
    {position: [0, 0, 0], mass: 0, shape: {type: 'height-field', field: makeTile(3).field}}
  ]
};

it('streams independent fused windows and preserves their atlas addresses across an origin shift and reset', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template: {
      ...template,
      bodies: [...template.bodies.slice(0, 3), {...template.bodies[3], position: [20, 0, 0]}]
    },
    instances: 4,
    terrainSlots: [1, 2],
    maximumPairs: 128,
    maximumResidentBytes: 32 * 1024 * 1024
  });
  const requests: string[] = [];
  const streamer = ensemble.createTerrainStreamer({
    maximumConcurrentLoads: 1,
    provider: {
      async loadTile(key) {
        requests.push(key);
        if (key === 'east') return makeTile(0, [4, -4, 0]);
        return makeTile(key === 'high' ? 2 : 0);
      }
    }
  });
  const tick = (steps: number) => {
    const encoder = device.createCommandEncoder();
    ensemble.encode(encoder, steps);
    device.submit(encoder.finish());
  };
  const cast = (instance: number, collider = 1, east = 0.25) =>
    ensemble.world.raycast({
      origin: [east, 0.5, 10],
      direction: [0, 0, -1],
      maximumDistance: 20,
      colliderIndices: [ensemble.getColliderIndex(instance, collider)]
    });
  try {
    const stats = ensemble.getStats();
    const base = {tiles: [{collider: 1, key: 'floor'}]};
    await Promise.all(Array.from({length: 4}, (_, instance) => streamer.prepare(instance, base)));
    expect(requests).toEqual(['floor']);
    expect((await cast(0)).hits).toEqual([]);
    for (let instance = 0; instance < 4; instance++) expect(streamer.apply(instance)).toBe(true);
    tick(12);
    const states = await ensemble.world.readState();
    for (let instance = 0; instance < 4; instance++)
      expect(states[ensemble.getBodyIndex(instance, 0)].sleeping).toBe(true);

    await streamer.prepare(2, {
      tiles: [
        {collider: 1, key: 'high'},
        {collider: 2, key: 'east'}
      ],
      seams: [{first: 1, firstEdge: 'last-column', second: 2, secondEdge: 'first-column'}]
    });
    streamer.apply(2);
    expect((await cast(1)).hits[0].point[2]).toBeCloseTo(0, 5);
    expect((await cast(2)).hits[0].point[2]).toBeCloseTo(2, 5);
    expect((await cast(2, 2, 4)).hits[0].point[2]).toBeCloseTo(2, 5);
    tick(1);
    expect((await ensemble.readStatus()).instances.map(instance => instance.active)).toEqual([
      false,
      false,
      true,
      false
    ]);
    expect((await ensemble.world.readState())[ensemble.getBodyIndex(1, 0)]).toEqual(states[4]);

    ensemble.world.shiftOrigin([8, 0, 0]);
    await ensemble.reset(2);
    expect((await cast(2, 1, -7.75)).hits[0].point[2]).toBeCloseTo(2, 5);
    expect((await cast(2, 2, -4)).hits[0].point[2]).toBeCloseTo(2, 5);
    expect((await cast(2, 3, 12.25)).hits[0].point[2]).toBeCloseTo(3, 5);
    expect((await cast(1, 1, -7.75)).hits[0].point[2]).toBeCloseTo(0, 5);
    expect(streamer.getResidentTileCount(2)).toBe(2);
    expect(streamer.getTile(2, 1)?.field.heights?.[0]).toBe(2);
    expect(ensemble.getStats()).toEqual(stats);

    ensemble.setActive(2, false);
    streamer.clear(2);
    tick(1);
    expect((await ensemble.readStatus()).instances[2].active).toBe(false);
    expect((await cast(2, 1, -7.75)).hits).toEqual([]);
    ensemble.setActive(2, true);
    tick(1);
    expect((await ensemble.readStatus()).instances[2].active).toBe(true);
    expect((await cast(1, 1, -7.75)).hits[0].point[2]).toBeCloseTo(0, 5);
    expect((await ensemble.world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    ensemble.destroy();
  }
}, 120000);

it('wakes old and new terrain footprints without changing a distant sleeping body', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    ...template,
    bodies: [
      template.bodies[0],
      {...template.bodies[0], position: [12.25, 0.5, 0.5]},
      {...template.bodies[0], position: [24.25, 0.5, 0.5]},
      template.bodies[1],
      {position: [12, 0, -0.5], mass: 0, shape: {type: 'box', halfExtents: [2, 2, 0.5]}},
      {position: [24, 0, -0.5], mass: 0, shape: {type: 'box', halfExtents: [2, 2, 0.5]}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    world.setHeightFieldTiles([{collider: 3, ...makeTile(0)}]);
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 14; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect((await world.readState()).slice(0, 3).map(body => body.sleeping)).toEqual([
      true,
      true,
      true
    ]);
    world.setHeightFieldTiles([{collider: 3, ...makeTile(0, [8, -4, 0])}]);
    expect((await world.readState()).slice(0, 3).map(body => body.sleeping)).toEqual([
      false,
      false,
      true
    ]);
  } finally {
    graph.destroy();
    world.destroy();
  }
}, 120000);

it.for(['all-pairs', 'hierarchical-grid'] as const)(
  'discards only edited terrain warm starts with %s discovery',
  async (broadPhase, context) => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('WebGPU unavailable');
    const world = new GPURigidBodyWorld({
      ...template,
      broadPhase,
      sleepAfter: 0,
      bodies: [
        template.bodies[0],
        {...template.bodies[0], position: [12.25, 0.5, 0.5]},
        template.bodies[1],
        template.bodies[2]
      ]
    });
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync();
    const step = (count: number) => {
      const encoder = device.createCommandEncoder();
      for (let index = 0; index < count; index++) graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
    };
    const matches = async () => {
      const {data} = (await world.captureState()).buffers.find(
        buffer => buffer.name === 'manifolds'
      )!;
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      const results = new Map<number, number>();
      for (let offset = 0; offset < view.byteLength; offset += 416) {
        if (view.getUint32(offset + 384, true) === 0) continue;
        const second =
          broadPhase === 'all-pairs' ? (offset / 416) % 4 : view.getUint32(offset + 392, true);
        results.set(second, view.getFloat32(offset + 36, true));
      }
      return results;
    };
    try {
      world.setHeightFieldTiles([
        {collider: 2, ...makeTile(0)},
        {collider: 3, ...makeTile(0, [8, -4, 0])}
      ]);
      step(3);
      const previous = await matches();
      expect(previous.get(2)).toBeGreaterThan(0);
      expect(previous.get(3)).toBeGreaterThan(0);
      // A new tile revision can leave the surface in the same place; geometric
      // matching alone would otherwise retain the old material/contact impulse.
      world.setHeightFieldTiles([{collider: 2, ...makeTile(0)}]);
      step(1);
      const revised = await matches();
      expect(revised.get(2)).toBe(0);
      expect(revised.get(3)).toBeGreaterThan(0);
    } finally {
      graph.destroy();
      world.destroy();
    }
  },
  120000
);

it('rejects oversized terrain reservations before creating the atlas', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  await expect(
    GPUPhysicsEnsemble.create(device, {
      template: {
        bodies: [
          {
            position: [0, 0, 0],
            mass: 0,
            shape: {type: 'height-field', field: {width: 129, height: 129}}
          }
        ]
      },
      instances: 4,
      terrainSlots: [0],
      maximumPairs: 64,
      maximumResidentBytes: 128 * 1024
    })
  ).rejects.toThrow('residency budget');
});
