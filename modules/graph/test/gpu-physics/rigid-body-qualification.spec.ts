// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPURigidBodyWorld,
  makeConvexHullGeometry,
  makeTriangleMeshGeometry,
  type GPURigidBodyShape,
  type GPURigidBodyWorldProps
} from '../../src/gpu-physics';

it('qualifies rotated box ray distances against an independent slab reference', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const angle = 0.71;
  const cosine = Math.cos(angle),
    sine = Math.sin(angle);
  const world = new GPURigidBodyWorld({
    enableQueries: true,
    bodies: [
      {
        mode: 'static',
        position: [2, -1, 0.5],
        orientation: [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)],
        shape: {type: 'box', halfExtents: [1.3, 0.7, 0.4]}
      }
    ]
  });
  world.addToGraph(new GPUCommandGraph(device));
  try {
    // Deliberately include misses, edges and non-central hits; reference is local-space slabs.
    for (const lateral of [-1.8, -1.1, -0.6, 0, 0.6, 1.1, 1.8]) {
      const localOrigin = [-4 * cosine + lateral * sine, 4 * sine + lateral * cosine, 0.1];
      const localDirection = [cosine, -sine, 0];
      let near = 0,
        far = 8;
      for (let axis = 0; axis < 2; axis++) {
        const extent = [1.3, 0.7][axis];
        const first = (-extent - localOrigin[axis]) / localDirection[axis];
        const second = (extent - localOrigin[axis]) / localDirection[axis];
        near = Math.max(near, Math.min(first, second));
        far = Math.min(far, Math.max(first, second));
      }
      const result = await world.raycast({
        origin: [-2, -1 + lateral, 0.6],
        direction: [1, 0, 0],
        maximumDistance: 8
      });
      expect(result.complete).toBe(true);
      if (near > far) expect(result.hits).toHaveLength(0);
      else expect(result.hits[0].distance).toBeCloseTo(near, 4);
    }
  } finally {
    world.destroy();
  }
});

it.for([
  'ordered',
  'parallel'
] as const)('qualifies unequal-mass elastic momentum and energy with %s solving', async (solver, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    solver,
    gravity: [0, 0, 0],
    timeStep: 1 / 240,
    iterations: 32,
    sleepAfter: 0,
    restitutionThreshold: 0,
    penetrationRecoveryFraction: 0,
    bodies: [
      {
        position: [-0.51, 0, 0],
        velocity: [2, 0, 0],
        mass: 1,
        shape: {type: 'sphere', radius: 0.5},
        restitution: 1,
        friction: 0
      },
      {
        position: [0.51, 0, 0],
        mass: 3,
        shape: {type: 'sphere', radius: 0.5},
        restitution: 1,
        friction: 0
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 24; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const state = await world.readState();
    const first = state[0].velocity[0],
      second = state[1].velocity[0];
    expect(first).toBeCloseTo(-1, 2);
    expect(second).toBeCloseTo(1, 2);
    expect(first + 3 * second).toBeCloseTo(2, 3);
    expect((first * first + 3 * second * second) / 2).toBeCloseTo(2, 2);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('qualifies fixed-step convergence against ballistic motion', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const errors: number[] = [];
  for (const steps of [30, 60, 120]) {
    const props: GPURigidBodyWorldProps = {
      timeStep: 1 / steps,
      gravity: [0, 0, -10],
      sleepAfter: 0,
      bodies: [{position: [0, 0, 20], velocity: [1, 0, 0], shape: {type: 'sphere', radius: 0.5}}]
    };
    const world = new GPURigidBodyWorld(props);
    const definition = new GPUCommandGraph(device);
    world.addToGraph(definition);
    const graph = await definition.compileAsync();
    try {
      const encoder = device.createCommandEncoder();
      for (let step = 0; step < steps; step++) graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      const [state] = await world.readState();
      expect(state.position[0]).toBeCloseTo(1, 4);
      expect(state.velocity[2]).toBeCloseTo(-10, 3);
      errors.push(Math.abs(state.position[2] - 15));
      expect((await world.readSimulationDiagnostics()).complete).toBe(true);
    } finally {
      graph.destroy();
      world.destroy();
    }
  }
  expect(errors[0]).toBeLessThan(0.18);
  expect(errors[1]).toBeLessThan(errors[0] * 0.55);
  expect(errors[2]).toBeLessThan(errors[1] * 0.55);
});

it.for([
  1 / 30,
  1 / 60
])('qualifies swept impact position against analytic restitution at timestep %s', async (timeStep, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    timeStep,
    gravity: [0, 0, 0],
    failurePolicy: 'rollback',
    continuous: {bodies: [0]},
    restitutionThreshold: 0,
    sleepAfter: 0,
    bodies: [
      {
        position: [-3, 0, 0],
        velocity: [240, 0, 0],
        shape: {type: 'sphere', radius: 0.3},
        restitution: 0.8,
        friction: 0
      },
      {
        mode: 'static',
        position: [0, 0, 0],
        shape: {type: 'box', halfExtents: [0.05, 2, 2]},
        restitution: 0.8,
        friction: 0
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
    const [state] = await world.readState();
    expect(state.velocity[0]).toBeCloseTo(-192, 2);
    expect(state.position[0]).toBeCloseTo(-0.35 - 0.8 * (240 * timeStep - 2.65), 2);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('qualifies sphere query scale and grazing misses analytically', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  for (const radius of [0.01, 1, 100]) {
    const world = new GPURigidBodyWorld({
      enableQueries: true,
      bodies: [{mode: 'static', position: [0, 0, 0], shape: {type: 'sphere', radius}}]
    });
    world.addToGraph(new GPUCommandGraph(device));
    try {
      for (const fraction of [0, 0.5, 0.99, 1.01]) {
        const result = await world.raycast({
          origin: [-3 * radius, fraction * radius, 0],
          direction: [1, 0, 0],
          maximumDistance: 6 * radius
        });
        expect(result.complete).toBe(true);
        if (fraction > 1) expect(result.hits).toHaveLength(0);
        else {
          const expected = radius * (3 - Math.sqrt(1 - fraction * fraction));
          expect(Math.abs(result.hits[0].distance - expected) / radius).toBeLessThan(0.0001);
        }
      }
    } finally {
      world.destroy();
    }
  }
});

it('qualifies extended shape surfaces against primitive and triangle references', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const cube = makeConvexHullGeometry(
    Array.from({length: 8}, (_, corner) => [
      corner & 1 ? 1 : -1,
      corner & 2 ? 1 : -1,
      corner & 4 ? 1 : -1
    ]).flat()
  );
  const fixtures: {shape: GPURigidBodyShape; height: number; distance: number}[] = [
    {shape: {type: 'convex-hull', geometry: cube}, height: 0.2, distance: 2},
    {
      shape: {type: 'cylinder', height: 2, radiusBottom: 1, radiusTop: 0.5},
      height: 0,
      distance: 2.25
    },
    {
      shape: {type: 'capsule', height: 2, radiusBottom: 0.5, radiusTop: 0.5},
      height: 1.3,
      distance: 2.6
    },
    {
      shape: {
        type: 'triangle-mesh',
        geometry: makeTriangleMeshGeometry([0, -1, -1, 0, 1, -1, 0, 0, 1], [0, 1, 2])
      },
      height: 0,
      distance: 3
    }
  ];
  for (const fixture of fixtures) {
    const world = new GPURigidBodyWorld({
      enableQueries: true,
      bodies: [{mode: 'static', position: [0, 0, 0], shape: fixture.shape}]
    });
    world.addToGraph(new GPUCommandGraph(device));
    try {
      const result = await world.raycast({
        origin: [-3, fixture.height, 0],
        direction: [1, 0, 0],
        maximumDistance: 6
      });
      expect(result.complete, fixture.shape.type).toBe(true);
      expect(result.hits).toHaveLength(1);
      expect(result.hits[0].distance).toBeCloseTo(fixture.distance, 3);
      const miss = await world.raycast({
        origin: [-3, 2, 0],
        direction: [1, 0, 0],
        maximumDistance: 6
      });
      expect(miss.complete).toBe(true);
      expect(miss.hits).toHaveLength(0);
    } finally {
      world.destroy();
    }
  }
}, 120000);
