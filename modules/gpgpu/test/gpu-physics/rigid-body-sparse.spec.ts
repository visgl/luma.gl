// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core/gpu-command-graph';
import {GPURigidBodyWorld, type GPURigidBody} from '../../src/gpu-physics/gpu-rigid-body-world';

it('matches the rigid-body oracle with sparse discovery and persistent cache slots', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const bodies: GPURigidBody[] = [
    {position: [0, 0, 0], mass: 0, shape: {type: 'box', halfExtents: [10, 0.1, 10]}},
    {position: [-2, 1, 0], mass: 1, shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]}},
    {position: [2, 1, 0], mass: 1, shape: {type: 'sphere', radius: 0.5}}
  ];
  const results = [];
  for (const broadPhase of ['all-pairs', 'hierarchical-grid'] as const) {
    const world = new GPURigidBodyWorld({bodies, broadPhase, gravity: [0, -9.81, 0]});
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync();
    try {
      for (let step = 0; step < 120; step += 10) {
        const encoder = device.createCommandEncoder();
        for (let substep = 0; substep < 10; substep++)
          graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        await world.readState();
      }
      results.push(await world.readState());
      const diagnostics = await world.readCollisionDiagnostics();
      expect(
        diagnostics.droppedManifolds +
          diagnostics.droppedTriangleQueries +
          diagnostics.unresolvedQueries
      ).toBe(0);
      if (broadPhase === 'hierarchical-grid')
        expect(diagnostics.broadPhase).toMatchObject({
          droppedPairs: 0,
          incompleteQueries: 0,
          invalidBounds: 0
        });
    } finally {
      graph.destroy();
      world.destroy();
    }
  }
  for (let body = 0; body < bodies.length; body++) {
    for (let axis = 0; axis < 3; axis++)
      expect(results[1][body].position[axis]).toBeCloseTo(results[0][body].position[axis], 2);
  }
}, 120000);

it('uses sparse storage beyond the reference cap, including a large floor with a high collider ID', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const bodies: GPURigidBody[] = Array.from({length: 200}, (_, index) => ({
    position: [index * 3 - 300, 0.59, 0],
    mass: 1,
    shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]}
  }));
  bodies.push({position: [0, 0, 0], mass: 0, shape: {type: 'box', halfExtents: [400, 0.1, 5]}});
  const world = new GPURigidBodyWorld({bodies, gravity: [0, -9.81, 0]});
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    expect(world.broadPhase).toBe('hierarchical-grid');
    expect(world.maximumPairs).toBeLessThan(bodies.length * bodies.length);
    for (let step = 0; step < 4; step++) {
      const encoder = device.createCommandEncoder();
      graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      await world.readState();
    }
    const diagnostics = await world.readCollisionDiagnostics();
    expect(diagnostics.droppedManifolds).toBe(0);
    expect(diagnostics.broadPhase).toMatchObject({
      pairCount: 200,
      droppedPairs: 0,
      invalidBounds: 0,
      incompleteQueries: 0
    });
    expect((await world.readState()).every(state => state.position.every(Number.isFinite))).toBe(
      true
    );
  } finally {
    graph.destroy();
    world.destroy();
  }
}, 120000);
