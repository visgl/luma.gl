// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPURigidBodyWorld,
  type GPURigidBodyShape
} from '../../src/gpu-physics/gpu-rigid-body-world';
import {
  makeConvexHullGeometry,
  makeTriangleMeshGeometry
} from '../../src/gpu-physics/rigid-body-mesh';

it.for(['ordered', 'parallel'] as const)(
  'solves convex hull and tapered primitive contacts against boxes and original triangles on GPU with %s',
  async (solver, context) => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('WebGPU is unavailable');
    const geometry = makeConvexHullGeometry(
      Array.from({length: 8}, (_, corner) => [
        corner & 1 ? 0.5 : -0.5,
        corner & 2 ? 0.5 : -0.5,
        corner & 4 ? 0.5 : -0.5
      ]).flat()
    );
    const shapes: GPURigidBodyShape[] = [
      {type: 'convex-hull', geometry},
      {type: 'capsule', height: 0.5, radiusBottom: 0.3, radiusTop: 0.2},
      {type: 'cylinder', height: 1, radiusBottom: 0.5, radiusTop: 0}
    ];
    for (const mesh of [false, true])
      for (const shape of shapes) {
        const world = new GPURigidBodyWorld({
          solver,
          broadPhase: 'hierarchical-grid',
          gravity: [0, -9.81, 0],
          timeStep: 1 / 120,
          sleepAfter: 0,
          bodies: [
            {
              position: [0, 0, 0],
              mass: 0,
              shape: mesh
                ? {
                    type: 'triangle-mesh',
                    geometry: makeTriangleMeshGeometry(
                      [-5, 0, -5, -5, 0, 5, 5, 0, 5, 5, 0, -5],
                      [0, 1, 2, 0, 2, 3]
                    )
                  }
                : {type: 'box', halfExtents: [5, 0.1, 5]}
            },
            {position: [0, 2, 0], mass: 1, shape, restitution: 0, friction: 0.6}
          ]
        });
        const definition = new GPUCommandGraph(device);
        world.addToGraph(definition);
        const graph = await definition.compileAsync();
        try {
          for (let step = 0; step < 240; step += 20) {
            const encoder = device.createCommandEncoder();
            for (let substep = 0; substep < 20; substep++)
              graph.encode(encoder, {parameters: undefined});
            device.submit(encoder.finish());
            await world.readState();
          }
          const state = (await world.readState())[1];
          expect(state.position.every(Number.isFinite)).toBe(true);
          expect(state.position[1]).toBeGreaterThan(-0.1);
          expect(state.position[1]).toBeLessThan(1.2);
          expect(Math.abs(state.velocity[1])).toBeLessThan(1);
        } finally {
          graph.destroy();
          world.destroy();
        }
      }
  },
  120000
);

it('preserves a nonconvex wheel opening and responds only around its unlocked inertia axis', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU is unavailable');
  const positions: number[] = [],
    indices: number[] = [];
  const segments = 24,
    sides = 8;
  for (let segment = 0; segment < segments; segment++) {
    const angle = (segment * 2 * Math.PI) / segments;
    for (let side = 0; side < sides; side++) {
      const crossAngle = (side * 2 * Math.PI) / sides;
      const radius = 1 + 0.2 * Math.cos(crossAngle);
      positions.push(
        radius * Math.cos(angle),
        0.2 * Math.sin(crossAngle),
        radius * Math.sin(angle)
      );
      const first = segment * sides + side;
      const second = ((segment + 1) % segments) * sides + side;
      const third = ((segment + 1) % segments) * sides + ((side + 1) % sides);
      const fourth = segment * sides + ((side + 1) % sides);
      indices.push(first, second, third, first, third, fourth);
    }
  }
  const world = new GPURigidBodyWorld({
    gravity: [0, -9.81, 0],
    timeStep: 1 / 120,
    bodies: [
      {
        position: [0, 0, 0],
        mode: 'dynamic',
        mass: 0,
        inertiaDiagonal: [0, 1, 0],
        gravityFactor: 0,
        shape: {type: 'triangle-mesh', geometry: makeTriangleMeshGeometry(positions, indices)}
      },
      {position: [0, 1, 0], mass: 1, shape: {type: 'sphere', radius: 0.1}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    world.applyImpulse(0, [0, 0, 1], [1, 0, 0]);
    for (let step = 0; step < 120; step += 20) {
      const encoder = device.createCommandEncoder();
      for (let substep = 0; substep < 20; substep++) graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      await world.readState();
    }
    const [wheel, sphere] = await world.readState();
    expect(wheel.position).toEqual([0, 0, 0]);
    expect(Math.abs(wheel.angularVelocity[1])).toBeGreaterThan(0.5);
    expect(Math.abs(wheel.angularVelocity[0]) + Math.abs(wheel.angularVelocity[2])).toBeLessThan(
      1e-5
    );
    expect(sphere.position[1]).toBeLessThan(-3);
    expect(await world.readCollisionDiagnostics()).toMatchObject({
      unresolvedQueries: 0,
      droppedTriangleQueries: 0
    });
  } finally {
    graph.destroy();
    world.destroy();
  }
}, 120000);

it('rejects a separated rotating mesh before a large box can cover its local BVH', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU is unavailable');
  const geometry = makeConvexHullGeometry(
    Array.from({length: 8}, (_, corner) => [
      corner & 1 ? 0.5 : -0.5,
      corner & 2 ? 0.5 : -0.5,
      corner & 4 ? 0.5 : -0.5
    ]).flat()
  );
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    bodies: [
      {position: [0, 0, 0], mass: 0, shape: {type: 'box', halfExtents: [5, 0.1, 5]}},
      {
        position: [0, 2, 0],
        mode: 'dynamic',
        mass: 0,
        angularVelocity: [0, 0, 3],
        inertiaDiagonal: [1, 1, 1],
        shape: {type: 'triangle-mesh', geometry}
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    for (let step = 0; step < 120; step += 10) {
      const encoder = device.createCommandEncoder();
      for (let substep = 0; substep < 10; substep++) graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      await world.readState();
      expect(await world.readCollisionDiagnostics()).toMatchObject({
        triangleQueries: 0,
        unresolvedQueries: 0,
        droppedTriangleQueries: 0
      });
    }
  } finally {
    graph.destroy();
    world.destroy();
  }
}, 120000);

it('preserves explicit mesh pose edits without hidden fixed-center anchors', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU is unavailable');
  const geometry = makeTriangleMeshGeometry([-1, 0, -1, 1, 0, -1, 0, 0, 1], [0, 1, 2]);
  const world = new GPURigidBodyWorld({
    bodies: [
      {position: [0, 0, 0], mass: 0, shape: {type: 'triangle-mesh', geometry}},
      {
        position: [0, 5, 0],
        mode: 'dynamic',
        mass: 0,
        gravityFactor: 0,
        inertiaDiagonal: [0, 1, 0],
        shape: {type: 'triangle-mesh', geometry}
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    world.positions!.write(new Float32Array([0, 5, 0, 0, 0, 0, 0, 0]));
    world.orientations!.write(new Float32Array([Math.SQRT1_2, 0, 0, Math.SQRT1_2]));
    world.velocities!.write(new Float32Array([0, -1, 0, 0]), 16);
    world.wake();
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const [fixed, rotating] = await world.readState();
    expect(fixed.position).toEqual([0, 5, 0]);
    expect(fixed.orientation[0]).toBeCloseTo(Math.SQRT1_2);
    expect(fixed.orientation[3]).toBeCloseTo(Math.SQRT1_2);
    expect(rotating.position[1]).toBeCloseTo(-1 / 120);
    expect(rotating.velocity).toEqual([0, -1, 0]);
    expect(await world.readCollisionDiagnostics()).toMatchObject({
      triangleQueries: 0,
      unresolvedQueries: 0
    });
  } finally {
    graph.destroy();
    world.destroy();
  }
}, 120000);
