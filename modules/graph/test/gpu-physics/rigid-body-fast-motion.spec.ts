// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils/device';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPURigidBodyWorld,
  makeConvexHullGeometry,
  makeTriangleMeshGeometry,
  type GPURigidBodyShape
} from '../../src/gpu-physics';

const fixtures = [
  'box',
  'sphere',
  'capsule',
  'cylinder',
  'convex-hull',
  'triangle-mesh',
  'plane'
] as const;
function makeObstacle(
  type: (typeof fixtures)[number],
  scale: number
): {shape: GPURigidBodyShape; surface: number} {
  if (type === 'box')
    return {shape: {type, halfExtents: [0.03 * scale, scale, scale]}, surface: 0.03};
  if (type === 'sphere') return {shape: {type, radius: 0.25 * scale}, surface: 0.25};
  if (type === 'capsule' || type === 'cylinder')
    return {
      shape: {type, height: 2 * scale, radiusBottom: 0.25 * scale, radiusTop: 0.25 * scale},
      surface: 0.25
    };
  if (type === 'plane') return {shape: {type, doubleSided: true}, surface: 0};
  if (type === 'triangle-mesh')
    return {
      shape: {
        type,
        geometry: makeTriangleMeshGeometry(
          [0, -scale, -scale, 0, scale, -scale, 0, scale, scale, 0, -scale, scale],
          [0, 1, 2, 0, 2, 3]
        )
      },
      surface: 0
    };
  return {
    shape: {
      type,
      geometry: makeConvexHullGeometry(
        Array.from({length: 8}, (_, corner) =>
          [corner & 1 ? 0.03 : -0.03, corner & 2 ? 1 : -1, corner & 4 ? 1 : -1].map(
            value => value * scale
          )
        ).flat()
      )
    },
    surface: 0.03
  };
}

it.for(fixtures)(
  'qualifies fast sphere rebounds against static %s across scale, rotation and timestep',
  async (type, context) => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('WebGPU unavailable');
    for (const scale of [0.01, 1, 100])
      for (const timeStep of [1 / 60, 1 / 120]) {
        const angle = 0.37,
          cosine = Math.cos(angle),
          sine = Math.sin(angle);
        const {shape, surface} = makeObstacle(type, scale);
        const obstacleAngle = angle + (type === 'plane' ? -Math.PI / 2 : 0);
        const world = new GPURigidBodyWorld({
          failurePolicy: 'rollback',
          continuous: {bodies: [0]},
          timeStep,
          gravity: [0, 0, 0],
          sleepAfter: 0,
          restitutionThreshold: 0,
          maximumPairs: 8,
          bodies: [
            {
              position: [-1.5 * scale * cosine, -1.5 * scale * sine, 0],
              velocity: [240 * scale * cosine, 240 * scale * sine, 0],
              angularVelocity: [0, 0, 11],
              shape: {type: 'sphere', radius: 0.2 * scale},
              restitution: 1,
              friction: 0
            },
            {
              mode: 'static',
              position: [0, 0, 0],
              orientation: [0, 0, Math.sin(obstacleAngle / 2), Math.cos(obstacleAngle / 2)],
              shape,
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
          graph.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          const diagnostics = await world.readSimulationDiagnostics();
          expect(
            diagnostics,
            `${type} scale ${scale} timestep ${timeStep}: ${JSON.stringify(diagnostics)}`
          ).toMatchObject({complete: true});
          const [state] = await world.readState();
          const expected = 1.5 - 2 * (surface + 0.2) - 240 * timeStep;
          expect(
            Math.abs((state.position[0] * cosine + state.position[1] * sine) / scale - expected)
          ).toBeLessThan(0.003);
          expect(
            Math.abs((state.velocity[0] * cosine + state.velocity[1] * sine) / scale + 240)
          ).toBeLessThan(0.05);
          expect(Math.hypot(...state.velocity) / scale).toBeCloseTo(240, 1);
          expect(state.angularVelocity[2]).toBeCloseTo(11, 4);
        } finally {
          graph.destroy();
          world.destroy();
        }
      }
  },
  120000
);

it('preserves a mesh opening for swept spheres and catches its rim from either side', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const positions: number[] = [],
    indices: number[] = [];
  for (const [minimumY, maximumY, minimumZ, maximumZ] of [
    [-2, -0.5, -2, 2],
    [0.5, 2, -2, 2],
    [-0.5, 0.5, -2, -0.5],
    [-0.5, 0.5, 0.5, 2]
  ]) {
    const base = positions.length / 3;
    positions.push(
      0,
      minimumY,
      minimumZ,
      0,
      maximumY,
      minimumZ,
      0,
      maximumY,
      maximumZ,
      0,
      minimumY,
      maximumZ
    );
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  for (const side of [-1, 1])
    for (const height of [0, 0.8]) {
      const world = new GPURigidBodyWorld({
        failurePolicy: 'rollback',
        continuous: {bodies: [0]},
        timeStep: 1 / 60,
        gravity: [0, 0, 0],
        restitutionThreshold: 0,
        maximumPairs: 8,
        bodies: [
          {
            position: [-1.5 * side, height, 0],
            velocity: [240 * side, 0, 0],
            shape: {type: 'sphere', radius: 0.2},
            restitution: 1
          },
          {
            mode: 'static',
            position: [0, 0, 0],
            shape: {type: 'triangle-mesh', geometry: makeTriangleMeshGeometry(positions, indices)},
            restitution: 1
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
        expect((await world.readSimulationDiagnostics()).complete).toBe(true);
        const [state] = await world.readState();
        expect(state.velocity[0] * side).toBeCloseTo(height ? -240 : 240, 1);
        expect(state.position[0] * side).toBeCloseTo(height ? -2.9 : 2.5, 2);
      } finally {
        graph.destroy();
        world.destroy();
      }
    }
}, 120000);

it.for(['ordered', 'parallel'] as const)(
  'qualifies repeated CCD rebounds and transactional exhaustion with %s',
  async (solver, context) => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('WebGPU unavailable');
    for (const maximumImpacts of [1, 8]) {
      const world = new GPURigidBodyWorld({
        solver,
        failurePolicy: 'rollback',
        continuous: {bodies: [0], maximumImpacts},
        timeStep: 1 / 60,
        gravity: [0, 0, 0],
        sleepAfter: 0,
        restitutionThreshold: 0,
        maximumPairs: 8,
        bodies: [
          {
            position: [0, 0, 0],
            velocity: [600, 0, 0],
            shape: {type: 'sphere', radius: 0.1},
            restitution: 1,
            friction: 0
          },
          ...[-1, 1].map(horizontal => ({
            mode: 'static' as const,
            position: [horizontal, 0, 0] as const,
            shape: {type: 'box' as const, halfExtents: [0.05, 1, 1] as const},
            restitution: 1,
            friction: 0
          }))
        ]
      });
      const definition = new GPUCommandGraph(device);
      world.addToGraph(definition);
      const graph = await definition.compileAsync();
      try {
        const before = await world.readState();
        for (let tick = 1; tick <= 12; tick++) {
          const encoder = device.createCommandEncoder();
          graph.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          const diagnostics = await world.readSimulationDiagnostics();
          const states = await world.readState();
          if (maximumImpacts === 1) {
            expect(diagnostics.complete).toBe(false);
            expect(diagnostics.incompleteContinuousBodies).toBeGreaterThan(0);
            expect(states).toEqual(before);
          } else {
            const phase = ((600 * tick) / 60 + 0.85) % 3.4;
            const expected = 0.85 - Math.abs(phase - 1.7);
            expect(diagnostics.complete).toBe(true);
            expect(Math.abs(states[0].position[0] - expected)).toBeLessThan(0.005);
            expect(states[0].velocity[0]).toBeCloseTo(phase < 1.7 ? 600 : -600, 1);
          }
        }
      } finally {
        graph.destroy();
        world.destroy();
      }
    }
  },
  120000
);

it('rejects a CCD step when initial mesh distance traversal is incomplete', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    maximumMeshTraversalTestsPerPair: 1,
    continuous: {bodies: [0]},
    gravity: [0, 0, 0],
    timeStep: 1 / 60,
    bodies: [
      {position: [-1.5, 0, 0], velocity: [240, 0, 0], shape: {type: 'sphere', radius: 0.2}},
      {
        mode: 'static',
        position: [0, 0, 0],
        shape: {
          type: 'triangle-mesh',
          geometry: makeTriangleMeshGeometry([0, -1, -1, 0, 1, -1, 0, 0, 1], [0, 1, 2])
        }
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
    expect((await world.readSimulationDiagnostics()).incompleteContinuousBodies).toBe(1);
    expect(await world.readState()).toEqual(before);
  } finally {
    graph.destroy();
    world.destroy();
  }
}, 120000);

it('retains other walls in one mesh after a separating rebound', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const positions: number[] = [],
    indices: number[] = [];
  for (const horizontal of [-1, 1]) {
    const base = positions.length / 3;
    positions.push(
      horizontal,
      -100,
      -100,
      horizontal,
      100,
      -100,
      horizontal,
      100,
      100,
      horizontal,
      -100,
      100
    );
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    continuous: {bodies: [0], maximumImpacts: 8},
    gravity: [0, 0, 0],
    sleepAfter: 0,
    timeStep: 1 / 60,
    restitutionThreshold: 0,
    bodies: [
      {
        position: [0, 0, 0],
        velocity: [600, 0, 0],
        shape: {type: 'sphere', radius: 0.1},
        restitution: 1,
        friction: 0
      },
      {
        mode: 'static',
        position: [0, 0, 0],
        shape: {type: 'triangle-mesh', geometry: makeTriangleMeshGeometry(positions, indices)},
        restitution: 1,
        friction: 0
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    for (let tick = 1; tick <= 12; tick++) {
      const encoder = device.createCommandEncoder();
      graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      expect((await world.readSimulationDiagnostics()).complete).toBe(true);
      const [state] = await world.readState();
      const phase = (10 * tick + 0.9) % 3.6;
      expect(Math.abs(state.position[0] - (0.9 - Math.abs(phase - 1.8)))).toBeLessThan(0.005);
      expect(state.velocity[0]).toBeCloseTo(phase < 1.8 ? 600 : -600, 1);
    }
  } finally {
    graph.destroy();
    world.destroy();
  }
}, 120000);
