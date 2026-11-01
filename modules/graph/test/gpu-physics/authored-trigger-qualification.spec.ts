// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPURigidBodyWorld,
  makeConvexHullGeometry,
  makeTriangleMeshGeometry,
  type GPURigidBodyShape
} from '../../src/gpu-physics';

const hull = makeConvexHullGeometry(
  Array.from({length: 8}, (_, index) => [
    index & 1 ? 1 : -1,
    index & 2 ? 1 : -1,
    index & 4 ? 1 : -1
  ]).flat()
);
const shapes: GPURigidBodyShape[] = [
  {type: 'sphere', radius: 1},
  {type: 'box', halfExtents: [1, 1, 1]},
  {type: 'capsule', height: 1, radiusBottom: 0.5, radiusTop: 0.3},
  {type: 'cylinder', height: 1, radiusBottom: 0.5, radiusTop: 0.3},
  {type: 'plane', sizeX: 2, sizeZ: 2, doubleSided: true},
  {type: 'convex-hull', geometry: hull},
  {
    type: 'triangle-mesh',
    geometry: makeTriangleMeshGeometry([-2, 0, -2, 0, 0, 2, 2, 0, -2], [0, 1, 2])
  }
];
for (const shape of shapes)
  it(`qualifies ${shape.type} trigger geometry with filtered independent target transitions`, async context => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('WebGPU unavailable');
    const world = new GPURigidBodyWorld({
      gravity: [0, 0, 0],
      timeStep: 0.05,
      failurePolicy: 'rollback',
      triggers: [{colliders: [0], targets: [1, 2], perCollider: true, excludedPairs: [[0, 2]]}],
      bodies: [
        {mode: 'static', position: [0, 0, 0], colliders: [{isTrigger: true, shape}]},
        {
          position: [0, -3, 0],
          velocity: [0, 6, 0],
          colliders: [
            {shape: {type: 'sphere', radius: 0.2}},
            {position: [0.5, 0, 0], shape: {type: 'sphere', radius: 0.2}}
          ]
        }
      ]
    });
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync();
    try {
      const encoder = device.createCommandEncoder();
      for (let step = 0; step < 20; step++) graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      expect((await world.readSimulationDiagnostics()).complete).toBe(true);
      const events = await world.readTriggerEvents();
      expect(events.dropped).toBe(0);
      expect(events.events.map(event => [event.phase, event.collider, event.body])).toEqual([
        ['enter', 1, 1],
        ['exit', 1, 1]
      ]);
      expect(events.events[1].step).toBeGreaterThan(events.events[0].step);
      expect((await world.readState())[1].position[1]).toBeCloseTo(3, 4);
      expect((await world.readTriggerEvents()).events).toEqual([]);
    } finally {
      graph.destroy();
      world.destroy();
    }
  });

it('reports trigger ring loss instead of silently treating a partial history as complete', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    timeStep: 0.1,
    failurePolicy: 'rollback',
    triggerEventCapacity: 1,
    triggers: [{colliders: [0], targets: [1], swept: true}],
    bodies: [
      {
        mode: 'static',
        position: [0, 0, 0],
        colliders: [{isTrigger: true, shape: {type: 'sphere', radius: 1}}]
      },
      {position: [-5, 0, 0], velocity: [100, 0, 0], shape: {type: 'sphere', radius: 0.2}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const batch = await world.readTriggerEvents();
    expect(batch.dropped).toBe(1);
    expect(batch.events).toHaveLength(1);
  } finally {
    graph.destroy();
    world.destroy();
  }
});
