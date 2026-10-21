// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPURigidBodyWorld,
  makeConvexHullGeometry,
  makeTriangleMeshGeometry
} from '../../src/gpu-physics';

it('rolls back failed steps and suppresses contact events across queued encodings', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    broadPhase: 'hierarchical-grid',
    maximumPairs: 1,
    eventCapacity: 32,
    gravity: [0, 0, -10],
    bodies: Array.from({length: 6}, (_, index) => ({
      position: [index * 0.1, 0, 0] as [number, number, number],
      shape: {type: 'sphere' as const, radius: 1}
    }))
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const before = await world.readState();
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 3; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await world.readState()).toEqual(before);
    expect((await world.readSimulationDiagnostics()).incompleteSteps).toBeGreaterThan(0);
    expect((await world.readContactEvents()).events).toEqual([]);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('casts a sphere against a box corner without treating its expanded AABB as the surface', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    enableQueries: true,
    bodies: [{position: [0, 0, 0], shape: {type: 'box', halfExtents: [1, 1, 1]}}]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  try {
    const miss = await world.castSphere({
      origin: [-3, 1.8, 1.8],
      direction: [1, 0, 0],
      maximumDistance: 6,
      radius: 1
    });
    expect(miss.complete).toBe(true);
    expect(miss.hits).toEqual([]);
    const hit = await world.castSphere({
      origin: [-3, 1.6, 1],
      direction: [1, 0, 0],
      maximumDistance: 6,
      radius: 1
    });
    expect(hit.complete).toBe(true);
    expect(hit.hits[0].distance).toBeCloseTo(1.2, 3);
  } finally {
    world.destroy();
  }
});

it('queries tapered primitives and one-sided finite planes', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    enableQueries: true,
    bodies: [
      {mode: 'static', position: [0, 0, 0], shape: {type: 'plane', sizeX: 4, sizeZ: 4}},
      {position: [5, 0, 0], shape: {type: 'capsule', radiusBottom: 1, radiusTop: 0.5, height: 2}},
      {position: [10, 0, 0], shape: {type: 'cylinder', radiusBottom: 1, radiusTop: 0.5, height: 2}}
    ]
  });
  world.addToGraph(new GPUCommandGraph(device));
  try {
    expect(
      (await world.raycast({origin: [0, 2, 0], direction: [0, -1, 0], maximumDistance: 4})).hits[0]
        .distance
    ).toBeCloseTo(2, 4);
    expect(
      (await world.raycast({origin: [0, -2, 0], direction: [0, 1, 0], maximumDistance: 4})).hits
    ).toEqual([]);
    for (const collider of [1, 2]) {
      const result = await world.overlapSphere({
        center: [collider * 5, 0, 0],
        radius: 0.01,
        colliderIndices: [collider]
      });
      expect(result.complete).toBe(true);
      expect(result.hits).toHaveLength(1);
    }
  } finally {
    world.destroy();
  }
});

it.for([
  'ordered',
  'parallel'
] as const)('stops fast spheres at thin static obstacles with %s solving', async (solver, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    solver,
    failurePolicy: 'rollback',
    continuous: {bodies: [0]},
    gravity: [0, 0, 0],
    timeStep: 0.1,
    sleepAfter: 0,
    bodies: [
      {
        position: [-5, 0, 0],
        velocity: [100, 0, 0],
        restitution: 1,
        shape: {type: 'sphere', radius: 0.5}
      },
      {
        mode: 'static',
        position: [0, 0, 0],
        restitution: 1,
        shape: {type: 'box', halfExtents: [0.05, 2, 2]}
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const states = await world.readState();
    expect(states[0].position[0]).toBeLessThan(-0.5);
    expect(states[0].velocity[0]).toBeCloseTo(-100, 2);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('rejects a complete step when the CCD impact budget is exhausted', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    continuous: {bodies: [0], maximumImpacts: 1},
    gravity: [0, 0, 0],
    timeStep: 0.1,
    bodies: [
      {
        position: [0, 0, 0],
        velocity: [100, 0, 0],
        restitution: 1,
        shape: {type: 'sphere', radius: 0.1}
      },
      {
        mode: 'static',
        position: [1, 0, 0],
        restitution: 1,
        shape: {type: 'box', halfExtents: [0.05, 2, 2]}
      },
      {
        mode: 'static',
        position: [-1, 0, 0],
        restitution: 1,
        shape: {type: 'box', halfExtents: [0.05, 2, 2]}
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const before = await world.readState();
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await world.readState()).toEqual(before);
    expect((await world.readSimulationDiagnostics()).incompleteContinuousBodies).toBe(1);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('records swept sensor entry and exit between snapshots without physical response', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    gravity: [0, 0, 0],
    timeStep: 0.1,
    triggers: [{colliders: [0], targets: [1], swept: true}],
    bodies: [
      {
        mode: 'static',
        position: [0, 0, 0],
        colliders: [{shape: {type: 'sphere', radius: 1}, isTrigger: true}]
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
    expect(batch.events.map(event => event.phase)).toEqual(['enter', 'exit']);
    expect(batch.events.every(event => event.swept && event.body === 1)).toBe(true);
    expect((await world.readState())[1].position[0]).toBeCloseTo(5, 3);
    expect((await world.readTriggerEvents()).events).toEqual([]);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('unions compound sensors and keeps transitions across several unobserved steps', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    gravity: [0, 0, 0],
    timeStep: 0.1,
    sleepAfter: 0,
    triggers: [{colliders: [0, 1], targets: [2]}],
    bodies: [
      {
        mode: 'static',
        position: [0, 0, 0],
        colliders: [
          {shape: {type: 'sphere', radius: 1}, isTrigger: true},
          {shape: {type: 'sphere', radius: 1}, position: [1, 0, 0], isTrigger: true}
        ]
      },
      {position: [-2, 0, 0], velocity: [10, 0, 0], shape: {type: 'sphere', radius: 0.2}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 6; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const batch = await world.readTriggerEvents();
    expect(batch.events.map(event => event.phase)).toEqual(['enter', 'exit']);
    expect(batch.events[1].step).toBeGreaterThan(batch.events[0].step);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('rebuilds from accepted poses with a larger capacity after failure', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    broadPhase: 'hierarchical-grid',
    maximumPairs: 1,
    bodies: Array.from({length: 4}, (_, index) => ({
      position: [index * 0.1, 0, 0] as [number, number, number],
      shape: {type: 'sphere' as const, radius: 0.5}
    }))
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect((await world.readSimulationDiagnostics()).complete).toBe(false);
    const recovered = new GPURigidBodyWorld(await world.getRecoveryProps({maximumPairs: 64}));
    const recoveryDefinition = new GPUCommandGraph(device);
    recovered.addToGraph(recoveryDefinition);
    const recoveryGraph = await recoveryDefinition.compileAsync();
    try {
      const encoder = device.createCommandEncoder();
      recoveryGraph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      expect((await recovered.readSimulationDiagnostics()).complete).toBe(true);
      expect(
        (await recovered.readState()).every(body => body.position.every(Number.isFinite))
      ).toBe(true);
    } finally {
      recoveryGraph.destroy();
      recovered.destroy();
    }
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('rejects nonfinite integration results before publishing them', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    gravity: [0, 0, 0],
    timeStep: 2,
    bodies: [{position: [3e38, 0, 0], velocity: [3e38, 0, 0], shape: {type: 'sphere', radius: 1}}]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const before = await world.readState();
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await world.readState()).toEqual(before);
    expect((await world.readSimulationDiagnostics()).invalidBodyStates).toBe(1);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('queries original mesh surfaces and solid convex interiors with explicit traversal exhaustion', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const mesh = makeTriangleMeshGeometry([0, -2, -2, 0, 2, -2, 0, 0, 2], [0, 1, 2]);
  const hull = makeConvexHullGeometry(
    Array.from({length: 8}, (_, corner) => [
      corner & 1 ? 1 : -1,
      corner & 2 ? 1 : -1,
      corner & 4 ? 1 : -1
    ]).flat()
  );
  for (const budget of [1, 65536]) {
    const world = new GPURigidBodyWorld({
      enableQueries: true,
      maximumMeshTraversalTestsPerPair: budget,
      bodies: [
        {mode: 'static', position: [0, 0, 0], shape: {type: 'triangle-mesh', geometry: mesh}},
        {position: [5, 0, 0], shape: {type: 'convex-hull', geometry: hull}}
      ]
    });
    world.addToGraph(new GPUCommandGraph(device));
    try {
      const ray = await world.raycast({
        origin: [-3, 0, 0],
        direction: [1, 0, 0],
        maximumDistance: 4,
        colliderIndices: [0]
      });
      if (budget === 1) {
        expect(ray.complete).toBe(false);
      } else {
        expect(ray.complete).toBe(true);
        expect(ray.hits[0].distance).toBeCloseTo(3, 4);
        const inside = await world.overlapSphere({
          center: [5, 0, 0],
          radius: 0.1,
          colliderIndices: [1]
        });
        expect(inside.complete).toBe(true);
        expect(inside.hits).toHaveLength(1);
        expect(inside.hits[0].normal).toEqual([0,0,0]);
        const miss = await world.raycast({
          origin: [-3, 3, 0],
          direction: [1, 0, 0],
          maximumDistance: 4,
          colliderIndices: [0]
        });
        expect(miss.complete).toBe(true);
        expect(miss.hits).toEqual([]);
      }
    } finally {
      world.destroy();
    }
  }
});
