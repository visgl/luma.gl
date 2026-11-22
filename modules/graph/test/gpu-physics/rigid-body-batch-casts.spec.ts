// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {expect, it} from 'vitest';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPURigidBodyWorld,
  makeTriangleMeshGeometry,
  type GPURigidBody,
  type GPURigidBodyBatchCast
} from '../../src/gpu-physics';

/** A non-unit direction checks that distances are in world units. */
const forward = {origin: [0, 0, 0], direction: [2, 0, 0], maximumDistance: 12} as const;

it('matches scalar casts across several lane strides, with deterministic ties and shared filtering', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  /** Two coincident spheres fall on different workgroup lanes. */
  const bodies: GPURigidBody[] = Array.from({length: 131}, (_, index) => ({
    mass: 0,
    position: [index === 2 || index === 65 ? 3 : 30, 0, 0],
    shape: {type: 'sphere', radius: 1}
  }));
  bodies[129] = {
    mass: 0,
    position: [7, 0, 0],
    orientation: [0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)],
    shape: {type: 'box', halfExtents: [1, 1, 1]}
  };
  bodies[130] = {
    mass: 0,
    position: [0, 4, 0],
    shape: {type: 'capsule', radiusBottom: 0.5, radiusTop: 0.75, height: 1}
  };
  /** Reuse eight GPU command slots for both full and selected batches. */
  const world = new GPURigidBodyWorld({
    bodies,
    enableQueries: true,
    queryBatchCapacity: 8,
    queryBatchIndex: true
  });
  world.addToGraph(new GPUCommandGraph(device));
  /** Ordered commands include hits, misses, casts, and an excluded body. */
  const commands: GPURigidBodyBatchCast[] = [
    forward,
    {...forward, excludeBody: 2},
    {...forward, radius: 0.5},
    {...forward, direction: [-1, 0, 0]},
    {...forward, origin: [-4, 4, 0]},
    {...forward, origin: [3, 0, 0], maximumDistance: 0}
  ];
  try {
    /** Equal-distance ties resolve to the smaller global collider index. */
    const result = await world.castBatch(commands);
    expect(result).toEqual(await world.castBatch(commands, {strategy: 'scan'}));
    expect(result[0]).toMatchObject({totalHits: 3, complete: true});
    expect(result[0].hits[0]).toMatchObject({collider: 2, distance: 2});
    expect(result[1].hits[0].collider).toBe(65);
    for (const [index, command] of commands.entries()) {
      const scalar =
        command.radius === undefined
          ? await world.raycast(command)
          : await world.castSphere({...command, radius: command.radius});
      expect(result[index]).toEqual(scalar);
    }
    /** Duplicate indices in shared selection should not double-count intersections. */
    const selected = [65, 129, 65, 2];
    expect((await world.castBatch([forward], {colliderIndices: selected}))[0]).toEqual(
      await world.raycast({...forward, colliderIndices: selected})
    );
    expect(await world.castBatch([forward], {colliderIndices: []})).toEqual([
      {hits: [], totalHits: 0, truncated: false, complete: true}
    ]);
    expect(await world.castBatch([commands[4]], {colliderIndices: [130]})).toEqual(
      await world.castBatch([commands[4]], {colliderIndices: [130], strategy: 'scan'})
    );
    expect(await world.castBatch([])).toEqual([]);
    expect(world.getCapacityInfo().buffers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({name: 'query-batch-commands', byteLength: 8 * 48}),
        expect.objectContaining({name: 'query-batch-results', byteLength: 8 * 64})
      ])
    );
  } finally {
    world.destroy();
  }
}, 120000);

it('isolates incomplete mesh traversal and queries the most recent submitted poses', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  /** A surface whose root overlaps one ray but cannot visit triangles within one work item. */
  const geometry = makeTriangleMeshGeometry(
    [5, -2, -2, 5, 2, -2, 5, 2, 2, 5, -2, 2],
    [0, 1, 2, 0, 2, 3]
  );
  /** Mix an analytic hit with a farther incomplete mesh and an unrelated ray. */
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    timeStep: 0.125,
    enableQueries: true,
    queryBatchCapacity: 4,
    queryBatchIndex: true,
    maximumMeshTraversalTestsPerPair: 1,
    bodies: [
      {position: [2, 0, 0], velocity: [4, 0, 0], shape: {type: 'sphere', radius: 0.25}},
      {position: [0, 0, 0], mass: 0, shape: {type: 'triangle-mesh', geometry}}
    ]
  });
  /** Use the normal simulation graph to publish a new body position ahead of the batch. */
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    /** Warm the index at the initial pose before submitting a step. */
    const initial = await world.castBatch([forward]);
    expect(initial[0].hits[0].distance).toBeCloseTo(1.75, 5);
    /** Queue the step without a host fence or pose readback. */
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const result = await world.castBatch([
      forward,
      {...forward, origin: [0, 6, 0]},
      {...forward, maximumDistance: 3}
    ]);
    expect(result[0]).toMatchObject({complete: false, totalHits: 1});
    expect(result[0].hits[0].distance).toBeCloseTo(2.25, 5);
    expect(result[1]).toMatchObject({complete: true, totalHits: 0});
    expect(result[2]).toMatchObject({complete: true, totalHits: 1});
    expect((await world.castBatch([forward], {colliderIndices: [0]}))[0].complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
}, 120000);

it.each([
  false,
  true
])('validates geometry-free batches and shares the scalar staging lock (index enabled: %s)', async (queryBatchIndex, context) => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  /** Geometry-free worlds may only query the empty public selection. */
  const world = new GPURigidBodyWorld({
    bodies: [{position: [0, 0, 0], colliders: []}],
    enableQueries: true,
    queryBatchCapacity: 1,
    queryBatchIndex
  });
  world.addToGraph(new GPUCommandGraph(device));
  try {
    await expect(world.castBatch([forward, forward])).rejects.toThrow('exceeds capacity');
    await expect(world.castBatch([forward], {colliderIndices: [0]})).rejects.toThrow(
      'Invalid query collider'
    );
    await expect(world.castBatch([{...forward, direction: [0, 0, 0]}])).rejects.toThrow(
      'Invalid batched'
    );
    await expect(world.castBatch([{...forward, excludeBody: 1}])).rejects.toThrow(
      'Invalid batched'
    );
    if (!queryBatchIndex) {
      await expect(world.castBatch([forward], {strategy: 'indexed'})).rejects.toThrow(
        'index is disabled'
      );
    }
    /** Pending casts hold the shared selection buffer until the GPU readback settles. */
    const pending = world.castBatch([forward]);
    await expect(world.raycast(forward)).rejects.toThrow('busy');
    expect(await pending).toEqual([{hits: [], totalHits: 0, truncated: false, complete: true}]);
    expect((await world.raycast(forward)).hits).toEqual([]);
  } finally {
    world.destroy();
  }
});

it('keeps counts and nearest hits on diagonal, tangent and zero-length casts', async context => {
  /** Use the default core binding limit for the indexed narrow phase. */
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  /** Distribute primitive centers across an incomplete tree with several subtrees. */
  const bodies: GPURigidBody[] = Array.from({length: 35}, (_, index) => ({
    mass: 0,
    position: [index % 7, Math.floor(index / 7), 0],
    shape: {type: 'sphere', radius: 0.2}
  }));
  /** Test a collider whose local center differs from its parent center. */
  bodies.push({
    mass: 0,
    position: [6, 3, 0],
    orientation: [0, 0, Math.sin(Math.PI / 4), Math.cos(Math.PI / 4)],
    colliders: [{position: [2, 0, 0], shape: {type: 'box', halfExtents: [0.6, 0.2, 0.3]}}]
  });
  /** The fixture uses both windings and grazing sphere sweep tolerances. */
  const commands: GPURigidBodyBatchCast[] = [
    {origin: [-1, -1, 0], direction: [1, 1, 0], maximumDistance: 10},
    {origin: [7, 4.4, 0], direction: [-1, 0, 0], maximumDistance: 8, radius: 0.200001},
    {origin: [6, 5, 0], direction: [0, 0, 1], maximumDistance: 0},
    {origin: [3, -1, 0], direction: [0, 1, 0], maximumDistance: 20, radius: 0.1}
  ];
  /** A fixed reserved command count makes the result comparison direct. */
  const world = new GPURigidBodyWorld({
    bodies,
    enableQueries: true,
    queryBatchCapacity: commands.length,
    queryBatchIndex: true
  });
  world.addToGraph(new GPUCommandGraph(device));
  try {
    /** Direct and indexed traversal must report the same complete rows. */
    const results = await world.castBatch(commands, {strategy: 'indexed'});
    expect(results).toEqual(await world.castBatch(commands, {strategy: 'scan'}));
    expect(results.map(result => result.totalHits)).toEqual([5, 8, 1, 5]);
    world.setColliderTransform(35, [4, 0, 0], [0, 0, 0, 1]);
    world.setColliderShapes([{collider: 35, shape: {type: 'box', halfExtents: [1, 1, 1]}}]);
    /** The next refit reads queued shape and local pose changes without a simulation step. */
    const edited = await world.castBatch(commands);
    expect(edited).toEqual(await world.castBatch(commands, {strategy: 'scan'}));
    expect(edited[2].totalHits).toBe(0);
  } finally {
    world.destroy();
  }
}, 120000);
