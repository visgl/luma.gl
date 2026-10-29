// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils/device';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, type GPURigidBody} from '../../src/gpu-physics';

it('solves sparse contacts with parallel pair and body ownership while conserving impact momentum', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU is unavailable');
  const bodies: GPURigidBody[] = [
    {
      shape: {type: 'sphere', radius: 0.5},
      position: [-0.5, 0, 0],
      velocity: [2, 0, 0],
      mass: 1,
      restitution: 1,
      friction: 0
    },
    {
      shape: {type: 'sphere', radius: 0.5},
      position: [0.5, 0, 0],
      mass: 2,
      restitution: 1,
      friction: 0
    }
  ];
  const world = new GPURigidBodyWorld({
    bodies,
    solver: 'parallel',
    broadPhase: 'hierarchical-grid',
    gravity: [0, 0, 0],
    sleepAfter: 0
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const state = await world.readState();
    expect(state[0].velocity[0] + 2 * state[1].velocity[0]).toBeCloseTo(2, 4);
    expect(state[0].velocity[0]).toBeLessThan(0);
    expect(state[1].velocity[0]).toBeGreaterThan(1);
    expect(state.every(body => body.position.every(Number.isFinite))).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('sleeps and wakes connected parallel contact islands without joining bodies through a static floor', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU is unavailable');
  const box = {type: 'box' as const, halfExtents: [0.5, 0.5, 0.5] as const};
  const world = new GPURigidBodyWorld({
    solver: 'parallel',
    broadPhase: 'hierarchical-grid',
    iterations: 32,
    gravity: [0, -9.81, 0],
    bodies: [
      {
        shape: {type: 'box', halfExtents: [10, 0.5, 10]},
        position: [0, -0.5, 0],
        mass: 0,
        restitution: 0
      },
      {shape: box, position: [0, 0.5, 0], restitution: 0},
      {shape: box, position: [0, 1.5, 0], restitution: 0},
      {shape: box, position: [5, 0.5, 0], velocity: [0.1, 0, 0], friction: 0, restitution: 0}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const advance = async (steps: number) => {
    for (let start = 0; start < steps; start += 10) {
      const encoder = device.createCommandEncoder();
      for (let index = 0; index < Math.min(10, steps - start); index++)
        graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      await world.readState();
    }
    return world.readState();
  };
  try {
    const settled = await advance(240);
    expect(settled[1].position[1]).toBeCloseTo(0.5, 1);
    expect(settled[2].position[1]).toBeCloseTo(1.5, 1);
    expect(settled[1].sleeping).toBe(true);
    expect(settled[2].sleeping).toBe(true);
    expect(settled[3].sleeping).toBe(false);
    world.applyImpulse(2, [1, 0, 0], settled[2].position);
    const awake = await advance(1);
    expect(awake[1].sleeping).toBe(false);
    expect(awake[2].sleeping).toBe(false);
    const supported = await advance(120);
    expect(supported[1].position[1]).toBeGreaterThan(0.35);
    expect(supported[2].position[1]).toBeGreaterThan(0.35);
    expect((await world.readCollisionDiagnostics()).droppedManifolds).toBe(0);
    // External impulses conservatively wake all components; the next steps must settle independently.
    expect(awake[3].position[0]).toBeCloseTo(settled[3].position[0] + 0.1 / 120, 3);
  } finally {
    graph.destroy();
    world.destroy();
  }
}, 120000);

it('conserves energy and momentum across 80 independent parallel impacts beyond the reference body limit', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU is unavailable');
  const bodies: GPURigidBody[] = [];
  for (let index = 0; index < 80; index++) {
    bodies.push({
      shape: {type: 'sphere', radius: 0.5},
      position: [-0.5, index * 3, 0],
      velocity: [2, 0, 0],
      mass: 1,
      restitution: 1,
      friction: 0
    });
    bodies.push({
      shape: {type: 'sphere', radius: 0.5},
      position: [0.5, index * 3, 0],
      mass: 2,
      restitution: 1,
      friction: 0
    });
  }
  const world = new GPURigidBodyWorld({
    bodies,
    solver: 'parallel',
    broadPhase: 'hierarchical-grid',
    gravity: [0, 0, 0],
    sleepAfter: 0
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const state = await world.readState();
    for (let index = 0; index < 80; index++) {
      const first = state[index * 2].velocity[0];
      const second = state[index * 2 + 1].velocity[0];
      expect(first).toBeCloseTo(-2 / 3, 3);
      expect(second).toBeCloseTo(4 / 3, 3);
      expect(first + 2 * second).toBeCloseTo(2, 4);
      expect(0.5 * first * first + second * second).toBeCloseTo(2, 3);
    }
    const diagnostics = await world.readCollisionDiagnostics();
    expect(diagnostics.broadPhase?.pairCount).toBe(80);
    expect(diagnostics.broadPhase?.droppedPairs).toBe(0);
    expect(diagnostics.broadPhase?.incompleteQueries).toBe(0);
    expect(diagnostics.droppedManifolds).toBe(0);
    expect(diagnostics.incompleteIslandUnions).toBe(0);
  } finally {
    graph.destroy();
    world.destroy();
  }
}, 120000);
