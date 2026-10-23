// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPURigidBodyWorld,
  makeConvexHullGeometry,
  type GPURigidBody,
  type GPURigidBodyWorldProps
} from '../../src/gpu-physics';

async function run(properties: GPURigidBodyWorldProps, steps = 1) {
  const device = await getWebGPUTestDevice();
  if (!device) return null;
  const world = new GPURigidBodyWorld({timeStep: 1 / 60, ...properties});
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const initial = await world.captureState();
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < steps; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return {
      work: await world.readContinuousWork(),
      state: await world.readState(),
      diagnostics: await world.readSimulationDiagnostics(),
      initial,
      final: await world.captureState()
    };
  } finally {
    graph.destroy();
    world.destroy();
  }
}

it.for([
  'ordered',
  'parallel'
] as const)('resolves a moving box pair with conserved momentum and energy (%s)', async (solver, context) => {
  const result = await run({
    solver,
    gravity: [0, 0, 0],
    sleepAfter: 0,
    contactSlop: 0,
    restitutionThreshold: 0,
    failurePolicy: 'rollback',
    continuous: {mode: 'convex', bodies: [0, 1]},
    bodies: [
      {
        position: [-2, 0, 0],
        velocity: [240, 0, 0],
        shape: {type: 'box', halfExtents: [0.25, 0.3, 0.3]},
        restitution: 1,
        friction: 0
      },
      {
        position: [2, 0, 0],
        velocity: [-120, 0, 0],
        shape: {type: 'box', halfExtents: [0.25, 0.3, 0.3]},
        restitution: 1,
        friction: 0
      }
    ]
  });
  if (!result) return context.skip('WebGPU unavailable');
  expect(result.diagnostics).toMatchObject({complete: true});
  expect(result.work).toMatchObject({
    peakCandidates: 1,
    peakCandidateWorkgroups: 1,
    impacts: 1,
    incomplete: false
  });
  expect(result.state[0].velocity[0]).toBeCloseTo(-120, 2);
  expect(result.state[1].velocity[0]).toBeCloseTo(240, 2);
  expect(result.state[0].position[0]).toBeCloseTo(-0.5, 3);
  expect(result.state[1].position[0]).toBeCloseTo(2.5, 3);
  expect(result.state[0].velocity[0] + result.state[1].velocity[0]).toBeCloseTo(120, 3);
});

it('rebounds from a translating kinematic convex obstacle in its moving frame', async context => {
  const result = await run({
    gravity: [0, 0, 0],
    sleepAfter: 0,
    restitutionThreshold: 0,
    failurePolicy: 'rollback',
    continuous: {mode: 'convex', bodies: [0]},
    bodies: [
      {
        position: [-2, 0, 0],
        velocity: [240, 0, 0],
        shape: {type: 'sphere', radius: 0.25},
        restitution: 1,
        friction: 0
      },
      {
        mode: 'kinematic',
        position: [1, 0, 0],
        velocity: [-60, 0, 0],
        shape: {type: 'box', halfExtents: [0.1, 1, 1]},
        restitution: 1,
        friction: 0
      }
    ]
  });
  if (!result) return context.skip('WebGPU unavailable');
  expect(result.diagnostics).toMatchObject({complete: true});
  expect(result.state[0].velocity[0]).toBeCloseTo(-360, 1);
  expect(result.state[0].position[0]).toBeCloseTo(-2.7, 2);
  expect(result.state[1].position[0]).toBeCloseTo(0, 4);
});

it('rejects a saturated swept queue without publishing any body state', async context => {
  const result = await run({
    gravity: [0, 0, 0],
    failurePolicy: 'rollback',
    continuous: {mode: 'convex', bodies: [0], maximumCandidates: 1},
    bodies: [
      {
        position: [-2, 0, 0],
        velocity: [240, 0, 0],
        shape: {type: 'box', halfExtents: [0.2, 0.2, 0.2]}
      },
      ...[0, 1].map(horizontal => ({
        mode: 'static' as const,
        position: [horizontal, 0, 0] as const,
        shape: {type: 'box' as const, halfExtents: [0.03, 1, 1] as const}
      }))
    ]
  });
  if (!result) return context.skip('WebGPU unavailable');
  expect(result.diagnostics.complete).toBe(false);
  expect(result.diagnostics.incompleteContinuousBodies).toBeGreaterThan(0);
  for (const initial of result.initial.buffers.filter(buffer =>
    ['positions', 'orientations', 'velocities', 'angular-velocities', 'manifolds'].includes(
      buffer.name
    )
  ))
    expect(result.final.buffers.find(buffer => buffer.name === initial.name)!.data).toEqual(
      initial.data
    );
});

it.for(['box', 'sphere', 'capsule', 'cylinder', 'convex-hull'] as const)(
  'qualifies translating %s against a thin wall across scale',
  async (type, context) => {
    for (const scale of [0.01, 1, 100]) {
      const shape =
        type === 'box'
          ? {type, halfExtents: [0.25 * scale, 0.3 * scale, 0.3 * scale] as const}
          : type === 'sphere'
            ? {type, radius: 0.25 * scale}
            : type === 'convex-hull'
              ? {
                  type,
                  geometry: makeConvexHullGeometry(
                    Array.from({length: 8}, (_, corner) =>
                      [
                        corner & 1 ? 0.25 : -0.25,
                        corner & 2 ? 0.3 : -0.3,
                        corner & 4 ? 0.3 : -0.3
                      ].map(value => value * scale)
                    ).flat()
                  )
                }
              : {type, height: 0.6 * scale, radiusBottom: 0.25 * scale, radiusTop: 0.25 * scale};
      const result = await run({
        gravity: [0, 0, 0],
        sleepAfter: 0,
        restitutionThreshold: 0,
        contactSlop: 0,
        failurePolicy: 'rollback',
        continuous: {mode: 'convex', bodies: [0]},
        bodies: [
          {
            position: [-2 * scale, 0, 0],
            velocity: [240 * scale, 0, 0],
            shape,
            restitution: 1,
            friction: 0
          },
          {
            mode: 'static',
            position: [0, 0, 0],
            shape: {type: 'box', halfExtents: [0.03 * scale, scale, scale]},
            restitution: 1,
            friction: 0
          }
        ]
      });
      if (!result) return context.skip('WebGPU unavailable');
      expect(result.diagnostics, `${type} at ${scale}`).toMatchObject({complete: true});
      expect(result.state[0].velocity[0] / scale).toBeCloseTo(-240, 0);
      expect(result.state[0].position[0] / scale).toBeCloseTo(-2.56, 2);
    }
  },
  120000
);

it('detects a rotating gate crossing a stationary sphere between samples', async context => {
  const result = await run({
    gravity: [0, 0, 0],
    sleepAfter: 0,
    restitutionThreshold: 0,
    failurePolicy: 'rollback',
    continuous: {mode: 'convex', bodies: [0], maximumImpacts: 8},
    bodies: [
      {position: [0, 0, 1.2], shape: {type: 'sphere', radius: 0.15}, friction: 0, restitution: 0.5},
      {
        mode: 'kinematic',
        position: [0, 0, 0],
        angularVelocity: [0, 120, 0],
        shape: {type: 'box', halfExtents: [2, 0.15, 0.05]},
        friction: 0,
        restitution: 0.5
      }
    ]
  });
  if (!result) return context.skip('WebGPU unavailable');
  if (!result.diagnostics.complete)
    console.log(
      'ROTATING DEBUG',
      result.work,
      Array.from(
        new Float32Array(
          result.final.buffers.find(buffer => buffer.name === 'continuous-work')!.data.buffer
        )
      ),
      Array.from(
        new Uint32Array(
          result.final.buffers.find(buffer => buffer.name === 'continuous-work')!.data.buffer
        )
      )
    );
  expect(result.diagnostics).toMatchObject({complete: true});
  expect(Math.hypot(...result.state[0].velocity)).toBeGreaterThan(50);
  expect(result.state[1].orientation[1]).toBeCloseTo(Math.sin(1), 4);
});

it('rejects impact exhaustion and keeps later steps latched', async context => {
  const result = await run(
    {
      gravity: [0, 0, 0],
      sleepAfter: 0,
      restitutionThreshold: 0,
      failurePolicy: 'rollback',
      continuous: {mode: 'convex', bodies: [0], maximumImpacts: 1},
      bodies: [
        {
          position: [0, 0, 0],
          velocity: [600, 0, 0],
          shape: {type: 'box', halfExtents: [0.2, 0.2, 0.2]},
          friction: 0,
          restitution: 1
        },
        ...[-1, 1].map(horizontal => ({
          mode: 'static' as const,
          position: [horizontal, 0, 0] as const,
          shape: {type: 'box' as const, halfExtents: [0.03, 1, 1] as const},
          friction: 0,
          restitution: 1
        }))
      ]
    },
    2
  );
  if (!result) return context.skip('WebGPU unavailable');
  expect(result.diagnostics.complete).toBe(false);
  expect(result.state[0].position).toEqual([0, 0, 0]);
  expect(result.state[0].velocity).toEqual([600, 0, 0]);
});

it('preserves unrelated discrete poses and rotation when no swept impact occurs', async context => {
  const properties: GPURigidBodyWorldProps = {
    gravity: [0, 0, -10],
    sleepAfter: 0,
    bodies: [
      {
        position: [-20, 0, 3],
        velocity: [1, 0, 0],
        angularVelocity: [2, 3, 4],
        shape: {type: 'box', halfExtents: [0.3, 0.4, 0.6]}
      },
      {mode: 'static', position: [5, 0, -0.5], shape: {type: 'box', halfExtents: [2, 2, 0.5]}},
      {position: [5, 0, 0.5], shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]}}
    ]
  };
  const discrete = await run(properties, 8);
  if (!discrete) return context.skip('WebGPU unavailable');
  const continuous = await run(
    {...properties, failurePolicy: 'rollback', continuous: {mode: 'convex', bodies: [0]}},
    8
  );
  expect(continuous!.diagnostics.complete).toBe(true);
  expect(continuous!.state).toEqual(discrete.state);
  expect(continuous!.work).toMatchObject({
    peakCandidates: 0,
    peakCandidateWorkgroups: 0,
    impacts: 0,
    incomplete: false
  });
});

it('applies swept Coulomb friction with angular response without adding impact energy', async context => {
  const result = await run({
    gravity: [0, 0, 0],
    sleepAfter: 0,
    restitutionThreshold: 0,
    failurePolicy: 'rollback',
    continuous: {mode: 'convex', bodies: [0]},
    bodies: [
      {
        position: [-2, 0, 0],
        velocity: [240, 30, 0],
        shape: {type: 'sphere', radius: 0.25},
        friction: 1,
        restitution: 1
      },
      {
        mode: 'static',
        position: [0, 0, 0],
        shape: {type: 'box', halfExtents: [0.1, 2, 2]},
        friction: 1,
        restitution: 1
      }
    ]
  });
  if (!result) return context.skip('WebGPU unavailable');
  expect(result.diagnostics.complete).toBe(true);
  const state = result.state[0];
  expect(state.velocity[0]).toBeCloseTo(-240, 1);
  expect(state.velocity[1]).toBeLessThan(29);
  expect(Math.abs(state.angularVelocity[2])).toBeGreaterThan(1);
  const energy =
    0.5 * state.velocity.reduce((sum, value) => sum + value * value, 0) +
    0.5 * 0.025 * state.angularVelocity.reduce((sum, value) => sum + value * value, 0);
  expect(energy).toBeLessThanOrEqual(0.5 * (240 ** 2 + 30 ** 2) + 0.1);
});

it.for([
  false,
  true
])('preserves free-box rebound trajectories against offset thin walls (reversed %s)', async (reverse, context) => {
  const bodies: GPURigidBody[] = [
    {
      position: [0, 0, 4.2],
      velocity: [120, 0, 0],
      shape: {type: 'box', halfExtents: [0.35, 0.3, 0.35]},
      friction: 0,
      restitution: 1
    },
    ...[-6, 6].map(horizontal => ({
      mode: 'static' as const,
      position: [horizontal, 0, 4] as const,
      shape: {type: 'box' as const, halfExtents: [0.05, 2, 5] as const},
      friction: 0,
      restitution: 1
    }))
  ];
  if (reverse) bodies.reverse();
  const selected = reverse ? 2 : 0;
  const result = await run(
    {
      gravity: [0, 0, 0],
      sleepAfter: 0,
      restitutionThreshold: 0,
      contactSlop: 0,
      failurePolicy: 'rollback',
      continuous: {mode: 'convex', bodies: [selected]},
      bodies
    },
    30
  );
  if (!result) return context.skip('WebGPU unavailable');
  expect(
    result.diagnostics,
    JSON.stringify({work: result.work, state: result.state[selected]})
  ).toMatchObject({steps: 30, complete: true});
  // Independent folded trajectory in [-5.6,5.6], with 60 units travelled.
  const limit = 5.6,
    unfolded = (limit + 60) % (4 * limit);
  const expected = (unfolded <= 2 * limit ? unfolded : 4 * limit - unfolded) - limit;
  expect(result.state[selected].position[0]).toBeCloseTo(expected, 2);
  expect(Math.abs(result.state[selected].velocity[0])).toBeCloseTo(120, 2);
  expect(Math.hypot(...result.state[selected].angularVelocity)).toBeLessThan(0.001);
});
