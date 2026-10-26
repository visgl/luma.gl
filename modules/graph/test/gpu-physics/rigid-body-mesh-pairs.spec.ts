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
  type GPURigidBody,
  type GPURigidBodyWorldProps
} from '../../src/gpu-physics';

const cube = makeConvexHullGeometry(
  Array.from({length: 8}, (_, corner) => [
    corner & 1 ? 0.5 : -0.5,
    corner & 2 ? 0.5 : -0.5,
    corner & 4 ? 0.5 : -0.5
  ]).flat()
);
const floor = makeTriangleMeshGeometry(
  [-5, -5, 0, 5, -5, 0, 5, 5, 0, -5, 5, 0],
  [0, 1, 2, 0, 2, 3]
);
async function simulate(properties: GPURigidBodyWorldProps, steps: number) {
  const device = await getWebGPUTestDevice();
  if (!device) return null;
  const world = new GPURigidBodyWorld(properties);
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    for (let start = 0; start < steps; start += 20) {
      const encoder = device.createCommandEncoder();
      for (let step = start; step < Math.min(steps, start + 20); step++)
        graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      await world.readSimulationDiagnostics();
    }
    return {
      states: await world.readState(),
      diagnostics: await world.readSimulationDiagnostics(),
      collision: await world.readCollisionDiagnostics()
    };
  } finally {
    graph.destroy();
    world.destroy();
  }
}
it.for([false, true])(
  'supports a falling triangle-mesh body on an original triangle surface with reversed IDs %s',
  async (reverse, context) => {
    const bodies: GPURigidBody[] = [
      {
        position: [0, 0, 0],
        mass: 0,
        shape: {type: 'triangle-mesh', geometry: floor},
        restitution: 0
      },
      {position: [0, 0, 1.5], shape: {type: 'triangle-mesh', geometry: cube}, restitution: 0}
    ];
    if (reverse) bodies.reverse();
    const result = await simulate(
      {bodies, solver: 'parallel', broadPhase: 'hierarchical-grid', iterations: 32},
      240
    );
    if (!result) return context.skip('WebGPU is unavailable');
    const state = result.states[reverse ? 0 : 1];
    expect(result.diagnostics).toMatchObject({complete: true, incompleteMeshQueries: 0});
    expect(state.position[2]).toBeGreaterThan(0.45);
    expect(state.position[2]).toBeLessThan(0.65);
    expect(Math.hypot(...state.velocity)).toBeLessThan(0.15);
  },
  120000
);
it('reports mesh traversal exhaustion rather than accepting an empty manifold', async context => {
  const result = await simulate(
    {
      maximumMeshTraversalTestsPerPair: 1,
      bodies: [
        {position: [0, 0, 0], mass: 0, shape: {type: 'triangle-mesh', geometry: floor}},
        {position: [0, 0, 0.49], shape: {type: 'triangle-mesh', geometry: cube}}
      ]
    },
    1
  );
  if (!result) return context.skip('WebGPU is unavailable');
  expect(result.diagnostics).toMatchObject({
    complete: false,
    incompleteSteps: 1,
    incompleteMeshQueries: 1
  });
  expect(result.collision.incompleteMeshQueries).toBe(1);
});

it('preserves a nonconvex mesh opening while supporting a mesh body over its surface', async context => {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const [center, halfExtents] of [
    [
      [-1.5, 0, 0],
      [0.5, 2, 0.25]
    ],
    [
      [1.5, 0, 0],
      [0.5, 2, 0.25]
    ],
    [
      [0, -1.5, 0],
      [1, 0.5, 0.25]
    ],
    [
      [0, 1.5, 0],
      [1, 0.5, 0.25]
    ]
  ]) {
    const bar = makeConvexHullGeometry(
      Array.from({length: 8}, (_, corner) =>
        center.map((value, axis) => value + (corner & (1 << axis) ? 1 : -1) * halfExtents[axis])
      ).flat()
    );
    const offset = positions.length / 3;
    positions.push(...bar.positions);
    indices.push(...bar.indices.map(index => index + offset));
  }
  const frame = makeTriangleMeshGeometry(positions, indices);
  const smallCube = makeConvexHullGeometry(cube.positions.map(value => value * 0.5));
  const result = await simulate(
    {
      broadPhase: 'hierarchical-grid',
      solver: 'parallel',
      iterations: 32,
      bodies: [
        {
          position: [0, 0, 0],
          mass: 0,
          shape: {type: 'triangle-mesh', geometry: frame},
          restitution: 0
        },
        {
          position: [0, 0, 1.5],
          shape: {type: 'triangle-mesh', geometry: smallCube},
          restitution: 0
        },
        {
          position: [1.5, 0, 1.5],
          shape: {type: 'triangle-mesh', geometry: smallCube},
          restitution: 0
        }
      ]
    },
    180
  );
  if (!result) return context.skip('WebGPU is unavailable');
  expect(result.diagnostics.complete).toBe(true);
  expect(result.states[1].position[2]).toBeLessThan(-2);
  expect(result.states[2].position[2]).toBeGreaterThan(0.45);
  expect(result.states[2].position[2]).toBeLessThan(0.6);
});
it('exchanges momentum between two moving mesh bodies', async context => {
  const result = await simulate(
    {
      broadPhase: 'hierarchical-grid',
      gravity: [0, 0, 0],
      iterations: 32,
      sleepAfter: 0,
      bodies: [
        {
          position: [-1, 0, 0],
          velocity: [2, 0, 0],
          mass: 1,
          shape: {type: 'triangle-mesh', geometry: cube},
          restitution: 1,
          friction: 0
        },
        {
          position: [1, 0, 0],
          mass: 2,
          shape: {type: 'triangle-mesh', geometry: cube},
          restitution: 1,
          friction: 0
        }
      ]
    },
    120
  );
  if (!result) return context.skip('WebGPU is unavailable');
  expect(result.diagnostics.complete).toBe(true);
  expect(result.states[0].velocity[0]).toBeLessThan(-0.4);
  expect(result.states[1].velocity[0]).toBeGreaterThan(1.1);
  expect(result.states[0].velocity[0] + 2 * result.states[1].velocity[0]).toBeCloseTo(2, 3);
});

it.for([
  1, 3
])('bounds convex/mesh traversal without rejecting exact completion at budget %s', async (budget, context) => {
  const result = await simulate(
    {
      maximumMeshTraversalTestsPerPair: budget,
      gravity: [0, 0, 0],
      bodies: [
        {position: [0, 0, 0], mass: 0, shape: {type: 'triangle-mesh', geometry: floor}},
        {position: [0, 0, 0.49], shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]}}
      ]
    },
    1
  );
  if (!result) return context.skip('WebGPU is unavailable');
  expect(result.diagnostics.complete).toBe(budget === 3);
  expect(result.diagnostics.incompleteMeshQueries).toBe(budget === 1 ? 1 : 0);
});

it.for([
  false,
  true
])('supports tilted offset mesh contacts in either collider order %s', async (reverse, context) => {
  const angle = 0.3;
  const rotation: [number, number, number, number] = [
    0,
    Math.sin(angle / 2),
    0,
    Math.cos(angle / 2)
  ];
  const normal = [Math.sin(angle), 0, Math.cos(angle)];
  const offset: [number, number, number] = [0.3, 0.2, 0];
  const bodies: GPURigidBody[] = [
    {
      position: [0, 0, 0],
      mass: 0,
      colliders: [
        {
          position: offset,
          orientation: rotation,
          shape: {type: 'triangle-mesh', geometry: floor},
          material: {restitution: 0}
        }
      ]
    },
    {
      position: [offset[0] + normal[0] * 1.5, offset[1], normal[2] * 1.5],
      orientation: rotation,
      shape: {type: 'triangle-mesh', geometry: cube},
      restitution: 0
    }
  ];
  if (reverse) bodies.reverse();
  const result = await simulate(
    {
      bodies,
      gravity: [-9.81 * normal[0], 0, -9.81 * normal[2]],
      solver: 'parallel',
      iterations: 32
    },
    240
  );
  if (!result) return context.skip('WebGPU is unavailable');
  const state = result.states[reverse ? 0 : 1];
  const height = (state.position[0] - offset[0]) * normal[0] + state.position[2] * normal[2];
  expect(result.diagnostics.complete).toBe(true);
  expect(height).toBeGreaterThan(0.45);
  expect(height).toBeLessThan(0.65);
  expect(Math.hypot(...state.velocity)).toBeLessThan(0.15);
});
