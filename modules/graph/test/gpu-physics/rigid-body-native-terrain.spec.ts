// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {expect, it} from 'vitest';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPUPhysicsEnsemble,
  GPURigidBodyWorld,
  makeTriangleMeshGeometry,
  type GPURigidBodyHeightField
} from '../../src/gpu-physics';

/** Canonical small slope with the northeast triangle omitted. */
function makeSlope(): GPURigidBodyHeightField {
  return {
    width: 2,
    height: 2,
    heights: new Float32Array([0, 0.25, 0.5, 0]),
    validity: new Uint8Array([1, 1, 1, 0]),
    columnStep: [-1, 0.25],
    rowStep: [0, 1],
    diagonal: '10-01'
  };
}

it('matches triangle mesh rays and wheel-sized casts on a reflected height field with a hole', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    enableQueries: true,
    bodies: [
      {mass: 0, position: [0, 0, 0], shape: {type: 'height-field', field: makeSlope()}},
      {
        mass: 0,
        position: [0, 0, 0],
        shape: {
          type: 'triangle-mesh',
          geometry: makeTriangleMeshGeometry([0, 0, 0, -1, 0.25, 0.25, 0, 1, 0.5], [0, 2, 1])
        }
      }
    ]
  });
  world.addToGraph(new GPUCommandGraph(device));
  try {
    for (const radius of [0, 0.1]) {
      const query = {
        origin: [-0.2, 0.25, 2] as const,
        direction: [0, 0, -1] as const,
        maximumDistance: 4,
        radius
      };
      const native = await world.castSphere({...query, colliderIndices: [0]});
      const reference = await world.castSphere({...query, colliderIndices: [1]});
      expect(native.complete).toBe(true);
      expect(native.hits).toHaveLength(1);
      expect(native.hits[0].distance).toBeCloseTo(reference.hits[0].distance, 5);
      for (let axis = 0; axis < 3; axis++) {
        expect(native.hits[0].point[axis]).toBeCloseTo(reference.hits[0].point[axis], 5);
        expect(native.hits[0].normal[axis]).toBeCloseTo(reference.hits[0].normal[axis], 5);
      }
    }
    const gap = await world.raycast({
      origin: [-0.75, 0.95, 2],
      direction: [0, 0, -1],
      maximumDistance: 4
    });
    expect(gap.complete).toBe(true);
    expect(gap.hits).toEqual([]);
  } finally {
    world.destroy();
  }
}, 120000);

it('streams fixed slots atomically and restores terrain and body state after rebasing', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const field: GPURigidBodyHeightField = {
    width: 3,
    height: 3,
    heights: new Float32Array(9),
    columnStep: [2, 0],
    rowStep: [0, 2]
  };
  const world = new GPURigidBodyWorld({
    enableQueries: true,
    broadPhase: 'hierarchical-grid',
    solver: 'parallel',
    failurePolicy: 'rollback',
    gravity: [0, 0, -10],
    bodies: [
      {mass: 0, position: [128, 0, 0], shape: {type: 'height-field', field}},
      {mass: 0, position: [132, 0, 0], shape: {type: 'height-field', field: {width: 3, height: 3}}},
      {mass: 1, position: [129, 1, 1.5], shape: {type: 'sphere', radius: 0.25}}
    ]
  });
  const commands = new GPUCommandGraph(device);
  world.addToGraph(commands);
  const graph = await commands.compileAsync();
  const checkpoint = world.createGPUCheckpoint({includeRollbackScratch: false});
  /** Query terrain alone in the current local simulation frame. */
  const sample = (east: number) =>
    world.raycast({
      origin: [east, 1, 3],
      direction: [0, 0, -1],
      maximumDistance: 5,
      excludeBody: 2
    });
  try {
    expect((await sample(129)).hits[0].point[2]).toBe(0);
    expect((await sample(133)).hits).toEqual([]);
    expect(
      (await world.overlapSphere({center: [132, 0, 0], radius: 0, colliderIndices: [1]})).hits
    ).toEqual([]);
    const bytes = world.getCapacityInfo().ownedBufferBytes;
    world.shiftOrigin([128, 0, 0]);
    const capture = await world.captureState({includeRollbackScratch: false});
    checkpoint.save();

    expect(() =>
      world.setHeightFieldTiles([
        {collider: 0, field: null},
        {collider: 1, field: {width: 4, height: 3}}
      ])
    ).toThrow('Height-field slot dimensions are fixed');
    expect((await sample(1)).hits[0].collider).toBe(0);

    const raised = {...field, heights: new Float32Array(9).fill(0.5)};
    world.setHeightFieldTiles([
      {collider: 0, field: null},
      {collider: 1, field: raised, position: [-4, 0, 0]}
    ]);
    expect(world.getCapacityInfo().ownedBufferBytes).toBe(bytes);
    expect((await sample(5)).hits).toEqual([]);
    const replacement = await sample(1);
    expect(replacement.hits[0].collider).toBe(1);
    expect(replacement.hits[0].point[2]).toBeCloseTo(0.5, 5);
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 150; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
    expect((await world.readState())[2].position[2]).toBeCloseTo(0.75, 2);
    expect(() => world.setBodyParameters(1, {mode: 'dynamic'})).toThrow(
      'Height fields require static bodies'
    );

    checkpoint.restore();
    expect((await sample(1)).hits[0].collider).toBe(0);
    expect((await sample(1)).hits[0].point[2]).toBe(0);
    world.setHeightFieldTiles([{collider: 0, field: raised}]);
    world.restoreState(capture);
    expect((await sample(1)).hits[0].point[2]).toBe(0);
  } finally {
    checkpoint.destroy();
    graph.destroy();
    world.destroy();
  }
}, 120000);

it('shares immutable height fields between ensemble instances and retains them on reset', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    instances: 2,
    maximumPairs: 16,
    maximumResidentBytes: 16 * 1024 * 1024,
    template: {
      enableQueries: true,
      bodies: [{mass: 0, position: [0, 0, 0], shape: {type: 'height-field', field: makeSlope()}}]
    }
  });
  try {
    expect(() => ensemble.world.setHeightFieldTiles([{collider: 0, field: null}])).toThrow(
      'Invalid writable height-field slot'
    );
    await ensemble.reset(1);
    const result = await ensemble.world.raycast({
      origin: [-0.2, 0.25, 2],
      direction: [0, 0, -1],
      maximumDistance: 4,
      colliderIndices: [1]
    });
    expect(result.hits[0].collider).toBe(1);
    expect(result.hits[0].point[2]).toBeCloseTo(0.15, 5);
  } finally {
    ensemble.destroy();
  }
}, 120000);
