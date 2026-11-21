// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {expect, it} from 'vitest';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPUPhysicsEnsemble,
  GPURigidBodyWorld,
  type GPUPhysicsEnsembleProps,
  type GPURigidBodyHeightField,
  type GPURigidBodyTerrainWindow
} from '../../src/gpu-physics';

const coarse = {width: 3, height: 3};
const fine = {width: 5, height: 5};

/** Cover the same four-meter square at either resolution. */
function makeField(dimensions: typeof coarse, height: number): GPURigidBodyHeightField {
  const step = 4 / (dimensions.width - 1);
  return {
    ...dimensions,
    columnStep: [step, 0],
    rowStep: [0, step],
    heights: new Float32Array(dimensions.width * dimensions.height).fill(height)
  };
}

const props: GPUPhysicsEnsembleProps = {
  template: {
    enableQueries: true,
    gravity: [0, 0, -9.81],
    bodies: [
      {position: [0, 0, 0], mass: 0, shape: {type: 'height-field', field: coarse}},
      {position: [0, 0, 0], mass: 0, shape: {type: 'height-field', field: fine}},
      {position: [1, 1, 0.5], shape: {type: 'sphere', radius: 0.5}, restitution: 0}
    ]
  },
  instances: 4,
  terrainSlots: [0, 1],
  maximumPairs: 128,
  maximumResidentBytes: 32 * 1024 * 1024
};

function readHeight(world: GPURigidBodyWorld, collider: number, east: number, north = 1.25) {
  return world
    .raycast({
      origin: [east, north, 8],
      direction: [0, 0, -1],
      maximumDistance: 12,
      colliderIndices: [collider]
    })
    .then(result => result.hits[0]?.point[2]);
}

it('shares stitched pages until a changed seam needs its own copy and restores exact leases', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    ...props,
    terrainAtlas: [
      {...coarse, pages: 2},
      {...fine, pages: 2}
    ]
  });
  const streamer = ensemble.createTerrainStreamer({
    provider: {
      async loadTile(key) {
        return key === 'fine'
          ? {position: [4, 0, 0], field: makeField(fine, 0)}
          : {position: [0, 0, 0], field: makeField(coarse, key === 'raised' ? 1 : 0)};
      }
    }
  });
  const window = (key: string): GPURigidBodyTerrainWindow => ({
    tiles: [
      {collider: 0, key},
      {collider: 1, key: 'fine'}
    ],
    seams: [{first: 0, firstEdge: 'last-column', second: 1, secondEdge: 'first-column'}]
  });
  const world = ensemble.world;
  const checkpoint = world.createGPUCheckpoint({includeRollbackScratch: false});
  let recovered: GPURigidBodyWorld | undefined;
  try {
    const initialBytes = ensemble.getStats().residentBytes;
    const all = [0, 1, 2, 3];
    await Promise.all(all.map(instance => streamer.prepare(instance, window('base'))));
    expect(await readHeight(world, 0, 1)).toBeUndefined();
    expect(streamer.applyMany(all)).toBe(4);
    const initialAtlas = ensemble.getStats().terrainAtlas!;
    expect(initialAtlas).toMatchObject({residentSlots: 8, residentPages: 2, capacityPages: 4});
    expect(initialAtlas.reservedBytes * 2).toBe(initialAtlas.privateSlotBytes);
    checkpoint.save();

    await streamer.prepare(2, window('raised'));
    expect(streamer.apply(2)).toBe(true);
    expect(ensemble.getStats().terrainAtlas).toMatchObject({residentSlots: 8, residentPages: 4});
    expect(await readHeight(world, ensemble.getColliderIndex(2, 0), 1)).toBeCloseTo(1, 5);
    expect(await readHeight(world, ensemble.getColliderIndex(2, 1), 4.25)).toBeCloseTo(0.75, 5);
    expect(await readHeight(world, ensemble.getColliderIndex(1, 1), 4.25)).toBeCloseTo(0, 5);
    const encoder = device.createCommandEncoder();
    ensemble.encode(encoder, 2);
    device.submit(encoder.finish());
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);

    world.shiftOrigin([8, 0, 0]);
    await ensemble.reset(2);
    expect(await readHeight(world, ensemble.getColliderIndex(2, 1), -3.75)).toBeCloseTo(0.75, 5);
    const capture = await world.captureState({includeRollbackScratch: false});
    const privateWorld = new GPURigidBodyWorld({...capture.props, ensembleTerrainAtlas: undefined});
    const physicalSaving =
      privateWorld.getCapacityInfo().ownedBufferBytes - ensemble.getStats().worldBufferBytes;
    expect(physicalSaving).toBeGreaterThan(0);
    expect(
      Math.abs(physicalSaving - (initialAtlas.privateSlotBytes - initialAtlas.reservedBytes))
    ).toBeLessThan(256);
    privateWorld.destroy();
    recovered = new GPURigidBodyWorld(capture.props);
    recovered.addToGraph(new GPUCommandGraph(device));
    recovered.restoreState(capture);
    expect(recovered.getTerrainAtlasStats()).toMatchObject({residentSlots: 8, residentPages: 4});
    expect(await readHeight(recovered, ensemble.getColliderIndex(2, 1), -3.75)).toBeCloseTo(
      0.75,
      5
    );
    recovered.setHeightFieldTiles([{collider: ensemble.getColliderIndex(2, 1), field: null}]);
    expect(recovered.getTerrainAtlasStats()).toMatchObject({residentSlots: 7, residentPages: 3});
    expect(await readHeight(recovered, ensemble.getColliderIndex(0, 1), -3.75)).toBeCloseTo(0, 5);

    checkpoint.restore();
    expect(ensemble.getStats().terrainAtlas).toEqual(initialAtlas);
    expect(await readHeight(world, ensemble.getColliderIndex(2, 1), 4.25)).toBeCloseTo(0, 5);
    // Re-lease the restored page using the world API; window bookkeeping belongs to the streamer.
    world.setHeightFieldTiles([{collider: 0, field: makeField(coarse, 0)}]);
    expect(ensemble.getStats().terrainAtlas).toEqual(initialAtlas);
    expect(ensemble.getStats().residentBytes).toBe(initialBytes);
  } finally {
    recovered?.destroy();
    checkpoint.destroy();
    ensemble.destroy();
  }
}, 120000);

it('preserves shared pages on overflow and allows an atomic last-user handoff', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    ...props,
    instances: 2,
    terrainSlots: [0],
    terrainAtlas: [{...coarse, pages: 1}]
  });
  const streamer = ensemble.createTerrainStreamer({
    provider: {
      async loadTile(key) {
        return {
          position: [key === 'east' ? 8 : 0, 0, 0],
          field: makeField(coarse, key === 'raised' ? 1 : 0)
        };
      }
    }
  });
  const window = (key: string) => ({tiles: [{collider: 0, key}]});
  const height = (instance: number, east: number) =>
    readHeight(ensemble.world, ensemble.getColliderIndex(instance, 0), east);
  try {
    await streamer.prepare(0, window('west'));
    await streamer.prepare(1, window('east'));
    expect(streamer.applyMany([0, 1, 1])).toBe(2);
    expect(ensemble.getStats().terrainAtlas).toMatchObject({residentSlots: 2, residentPages: 1});
    expect(await height(0, 1)).toBe(0);
    expect(await height(1, 9)).toBe(0);
    await streamer.prepare(0, window('raised'));
    expect(() => streamer.apply(0)).toThrow('capacity exhausted');
    expect(await height(0, 1)).toBe(0);
    expect(await height(1, 9)).toBe(0);
    expect(streamer.getTile(0, 0)?.field.heights?.[0]).toBe(0);
    await streamer.prepare(1, window('raised'));
    expect(streamer.applyMany([0, 1])).toBe(2);
    expect(await height(0, 1)).toBeCloseTo(1, 5);
    expect(await height(1, 1)).toBeCloseTo(1, 5);
    streamer.clear(0);
    expect(ensemble.getStats().terrainAtlas).toMatchObject({residentSlots: 1, residentPages: 1});
    expect(await height(0, 1)).toBeUndefined();
    expect(await height(1, 1)).toBeCloseTo(1, 5);
    streamer.clear(1);
    expect(ensemble.getStats().terrainAtlas).toMatchObject({residentSlots: 0, residentPages: 0});
  } finally {
    ensemble.destroy();
  }
}, 120000);
