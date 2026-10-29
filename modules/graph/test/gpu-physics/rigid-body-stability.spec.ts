// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {waitForSubmittedPhysicsWork} from './physics-test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, type GPURigidBodyWorldProps} from '../../src/gpu-physics';

async function runWorld(properties: GPURigidBodyWorldProps, steps: number) {
  const device = await getWebGPUTestDevice();
  if (!device) return null;
  const world = new GPURigidBodyWorld(properties);
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    for (let start = 0; start < steps; start += 20) {
      const encoder = device.createCommandEncoder();
      for (let step = start; step < Math.min(start + 20, steps); step++)
        graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      await waitForSubmittedPhysicsWork(device);
    }
    const diagnostics = await world.readSimulationDiagnostics();
    expect(diagnostics).toMatchObject({steps, complete: true, incompleteSteps: 0});
    return await world.readState();
  } finally {
    graph.destroy();
    world.destroy();
  }
}

it.for([
  'ordered',
  'parallel'
] as const)('solves coupled anisotropic tangential response in one %s iteration', async (solver, context) => {
  const state = await runWorld(
    {
      solver,
      broadPhase: 'hierarchical-grid',
      iterations: 1,
      gravity: [0, 0, -9.81],
      sleepAfter: 0,
      bodies: [
        {
          position: [0, 0, -0.5],
          mass: 0,
          shape: {type: 'box', halfExtents: [10, 10, 0.5]},
          friction: 100,
          restitution: 0
        },
        {
          position: [0, 0, 0.5],
          shape: {type: 'sphere', radius: 0.5},
          velocity: [1, 0.4, 0],
          mass: 1,
          inertiaDiagonal: [0.08, 0.6, 1],
          inertiaOrientation: [0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)],
          friction: 100,
          restitution: 0
        }
      ]
    },
    1
  );
  if (!state) return context.skip('WebGPU is unavailable');
  const body = state[1];
  // Initial contact is directly below the COM. Contact-point slip must vanish on both axes.
  expect(Math.abs(body.velocity[0] - 0.5 * body.angularVelocity[1])).toBeLessThan(0.0001);
  expect(Math.abs(body.velocity[1] + 0.5 * body.angularVelocity[0])).toBeLessThan(0.0001);
  expect(Math.abs(body.velocity[2])).toBeLessThan(0.0001);
});

it.for(['ordered', 'parallel'] as const)(
  'keeps a body stationary inside the static friction cone with %s solving',
  async (solver, context) => {
    const material = {staticFriction: 0.8, dynamicFriction: 0.1, restitution: 0};
    const state = await runWorld(
      {
        solver,
        broadPhase: 'hierarchical-grid',
        iterations: 32,
        gravity: [3, 0, -9.81],
        sleepAfter: 0,
        bodies: [
          {
            position: [0, 0, -0.5],
            mass: 0,
            colliders: [{shape: {type: 'box', halfExtents: [10, 10, 0.5]}, material}]
          },
          {
            position: [0, 0, 0.5],
            colliders: [{shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]}, material}]
          }
        ]
      },
      240
    );
    if (!state) return context.skip('WebGPU is unavailable');
    expect(Math.abs(state[1].position[0])).toBeLessThan(0.03);
    expect(Math.abs(state[1].velocity[0])).toBeLessThan(0.03);
    expect(state[1].position[2]).toBeGreaterThan(0.48);
  },
  120000
);

it.for(['ordered', 'parallel'] as const)(
  'carries resting bodies on a kinematic support with %s solving',
  async (solver, context) => {
    const state = await runWorld(
      {
        solver,
        broadPhase: 'hierarchical-grid',
        iterations: 32,
        gravity: [0, 0, -9.81],
        bodies: [
          {
            position: [0, 0, -0.5],
            mode: 'kinematic',
            velocity: [0.5, 0, 0],
            shape: {type: 'box', halfExtents: [5, 5, 0.5]},
            friction: 1,
            restitution: 0
          },
          {
            position: [0, 0, 0.5],
            shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]},
            friction: 1,
            restitution: 0
          }
        ]
      },
      240
    );
    if (!state) return context.skip('WebGPU is unavailable');
    expect(state[0].position[0]).toBeCloseTo(1, 4);
    expect(state[1].position[0]).toBeGreaterThan(0.9);
    expect(state[1].position[0]).toBeLessThan(1.05);
    expect(state[1].velocity[0]).toBeCloseTo(0.5, 2);
    expect(state[1].sleeping).toBe(false);
  },
  120000
);

it.for(['ordered', 'parallel'] as const)(
  'bounds eight-box stack drift and penetration with %s solving',
  async (solver, context) => {
    const state = await runWorld(
      {
        solver,
        broadPhase: 'hierarchical-grid',
        iterations: 64,
        gravity: [0, 0, -9.81],
        bodies: [
          {
            position: [0, 0, -0.5],
            mass: 0,
            shape: {type: 'box', halfExtents: [10, 10, 0.5]},
            friction: 0.8,
            restitution: 0
          },
          ...Array.from({length: 8}, (_, level) => ({
            position: [0, 0, 0.5 + level] as [number, number, number],
            mass: 1,
            shape: {type: 'box' as const, halfExtents: [0.5, 0.5, 0.5] as const},
            restitution: 0,
            friction: 0.8
          }))
        ]
      },
      600
    );
    if (!state) return context.skip('WebGPU is unavailable');
    for (let index = 1; index < state.length; index++) {
      expect(Math.hypot(state[index].position[0], state[index].position[1])).toBeLessThan(0.1);
      expect(Math.abs(state[index].position[2] - (index - 0.5))).toBeLessThan(0.12);
      expect(Math.hypot(...state[index].velocity)).toBeLessThan(0.1);
    }
  },
  120000
);

it.for([
  'ordered',
  'parallel'
] as const)('does not double friction response with one free rotational axis in %s solving', async (solver, context) => {
  const states = await runWorld(
    {
      solver,
      iterations: 1,
      gravity: [0, 0, 0],
      sleepAfter: 0,
      bodies: [
        {
          position: [0, 0, -0.5],
          mass: 0,
          shape: {type: 'box', halfExtents: [5, 5, 0.5]},
          friction: 1000,
          restitution: 0
        },
        {
          position: [0, 0, 0.49],
          mode: 'dynamic',
          mass: 0,
          shape: {type: 'sphere', radius: 0.5},
          centerOfMass: [0.2, 0, 0],
          inertiaDiagonal: [1, 0, 0],
          inertiaOrientation: [0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)],
          friction: 1000,
          restitution: 0
        }
      ]
    },
    1
  );
  if (!states) return context.skip('WebGPU is unavailable');
  // Penetration bias excites the only free rotation. Sticking friction must
  // cancel it once, although both tangent coordinates contain that same DOF.
  expect(Math.hypot(...states[1].angularVelocity)).toBeLessThan(0.0001);
});
