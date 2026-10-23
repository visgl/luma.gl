// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {
  GPURigidBodyWorld,
  type GPURigidBody,
  type GPURigidBodyWorldProps
} from '../../src/gpu-physics';

async function run(properties: GPURigidBodyWorldProps) {
  const device = await getWebGPUTestDevice();
  if (!device) return null;
  const world = new GPURigidBodyWorld({
    timeStep: 1 / 60,
    gravity: [0, 0, 0],
    sleepAfter: 0,
    contactSlop: 0,
    restitutionThreshold: 0,
    failurePolicy: 'rollback',
    ...properties
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const initial = await world.captureState();
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return {
      state: await world.readState(),
      work: await world.readContinuousWork(),
      diagnostics: await world.readSimulationDiagnostics(),
      initial,
      final: await world.captureState()
    };
  } finally {
    graph.destroy();
    world.destroy();
  }
}
const sphere = (position: number, velocity = 0): GPURigidBody => ({
  position: [position, 0, 0],
  velocity: [velocity, 0, 0],
  restitution: 1,
  friction: 0,
  shape: {type: 'sphere', radius: 0.5}
});

it.for([false, true])(
  'propagates an impact through an initially touching chain (reversed %s)',
  {timeout: 120000},
  async (reverse, context) => {
    const bodies = [sphere(-2, 240), sphere(0), sphere(1)];
    if (reverse) bodies.reverse();
    const result = await run({
      continuous: {mode: 'convex', bodies: [0, 1, 2], maximumImpacts: 8},
      bodies
    });
    if (!result) return context.skip('WebGPU unavailable');
    expect(result.diagnostics.complete).toBe(true);
    const state = reverse ? [...result.state].reverse() : result.state;
    expect(state.map(body => body.velocity[0])).toEqual(
      expect.arrayContaining([expect.closeTo(0, 2), expect.closeTo(0, 2), expect.closeTo(240, 2)])
    );
    expect(state[0].velocity[0]).toBeCloseTo(0, 2);
    expect(state[1].velocity[0]).toBeCloseTo(0, 2);
    expect(state[2].velocity[0]).toBeCloseTo(240, 2);
    expect(state[2].position[0]).toBeCloseTo(4, 2);
    expect(result.work!.impacts).toBe(2);
  }
);
it('resolves simultaneous opposing impacts with bounded deterministic revisits', {
  timeout: 120000
}, async context => {
  const result = await run({
    continuous: {mode: 'convex', bodies: [0, 1, 2], maximumImpacts: 8},
    bodies: [sphere(-2, 120), sphere(0), sphere(2, -120)]
  });
  if (!result) return context.skip('WebGPU unavailable');
  expect(result.diagnostics.complete).toBe(true);
  expect(result.state[0].velocity[0]).toBeCloseTo(-120, 2);
  expect(result.state[1].velocity[0]).toBeCloseTo(0, 2);
  expect(result.state[2].velocity[0]).toBeCloseTo(120, 2);
  expect(result.state.reduce((sum, body) => sum + body.velocity[0] ** 2, 0)).toBeCloseTo(28800, 0);
  expect(result.work!.impacts).toBe(3);
});
it('rechecks a separating initial touch after a wall rebound in the same step', {
  timeout: 120000
}, async context => {
  const result = await run({
    continuous: {mode: 'convex', bodies: [0], maximumImpacts: 8},
    bodies: [
      sphere(0, 300),
      ...[-0.6, 2.6].map(position => ({
        mode: 'static' as const,
        position: [position, 0, 0] as const,
        restitution: 1,
        friction: 0,
        shape: {type: 'box' as const, halfExtents: [0.1, 2, 2] as const}
      }))
    ]
  });
  if (!result) return context.skip('WebGPU unavailable');
  expect(result.diagnostics.complete).toBe(true);
  expect(result.work!.impacts).toBe(2);
  expect(result.state[0].velocity[0]).toBeCloseTo(300, 1);
  expect(result.state[0].position[0]).toBeCloseTo(1, 2);
});
it.for([0, 1, 2])(
  'spatially prunes sparse swept bounds on axis %s',
  {timeout: 120000},
  async (coordinate, context) => {
    const bodies: GPURigidBody[] = Array.from({length: 65}, (_, index) => {
      const position: [number, number, number] = [0, 0, 0];
      position[coordinate] = index * 10;
      return {...sphere(0), position};
    });
    const result = await run({
      broadPhase: 'hierarchical-grid',
      maximumPairs: 128,
      continuous: {mode: 'convex', bodies: bodies.map((_, index) => index), maximumCandidates: 1},
      bodies
    });
    if (!result) return context.skip('WebGPU unavailable');
    expect(result.diagnostics.complete).toBe(true);
    expect(result.work).toMatchObject({
      peakSpatialTests: 0,
      peakCandidates: 0,
      impacts: 0,
      rounds: 1
    });
    expect(result.state.map(body => body.position)).toEqual(bodies.map(body => body.position));
  }
);
it('rejects an exhausted simultaneous-impact budget without publishing a partial chain', {
  timeout: 120000
}, async context => {
  const result = await run({
    continuous: {mode: 'convex', bodies: [0, 1, 2], maximumImpacts: 1},
    bodies: [sphere(-2, 240), sphere(0), sphere(1)]
  });
  if (!result) return context.skip('WebGPU unavailable');
  expect(result.diagnostics.complete).toBe(false);
  for (const name of [
    'positions',
    'orientations',
    'velocities',
    'angular-velocities',
    'manifolds'
  ]) {
    const before = result.initial.buffers.find(buffer => buffer.name === name);
    const after = result.final.buffers.find(buffer => buffer.name === name);
    expect(before, name).toBeDefined();
    expect(after!.data, name).toEqual(before!.data);
  }
});

it('retains a reachable pair among padded sparse bounds without duplicate candidates', {
  timeout: 120000
}, async context => {
  const bodies: GPURigidBody[] = [
    sphere(-2, 240),
    sphere(2, -120),
    ...Array.from({length: 63}, (_, index) => ({
      ...sphere(0),
      position: [10 + index * 5, 0, 0] as const
    }))
  ];
  const result = await run({
    broadPhase: 'hierarchical-grid',
    maximumPairs: 128,
    continuous: {mode: 'convex', bodies: [0, 1], maximumCandidates: 1},
    bodies
  });
  if (!result) return context.skip('WebGPU unavailable');
  expect(result.diagnostics.complete).toBe(true);
  expect(result.work).toMatchObject({peakCandidates: 1, impacts: 1, incomplete: false});
  expect(result.work!.peakSpatialTests).toBeLessThan(65);
  expect(result.state[0].velocity[0]).toBeCloseTo(-120, 2);
  expect(result.state[1].velocity[0]).toBeCloseTo(240, 2);
});
