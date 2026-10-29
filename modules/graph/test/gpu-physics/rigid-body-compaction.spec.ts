// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, type GPURigidBody} from '../../src/gpu-physics';

it.for(['all-pairs', 'hierarchical-grid'] as const)(
  'matches the scan solver and clears/rebuilds contact queues with %s discovery',
  async (broadPhase, context) => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('WebGPU unavailable');
    const snapshots = [];
    for (const compactContacts of [false, true]) {
      const world = new GPURigidBodyWorld({
        solver: 'parallel',
        compactContacts,
        broadPhase,
        maximumPairs: 4096,
        gravity: [0, 0, 0],
        sleepAfter: 0,
        restitutionThreshold: 0,
        bodies: [
          {
            position: [-0.5, 0, 0],
            velocity: [2, 0, 0],
            shape: {type: 'sphere', radius: 0.5},
            restitution: 1,
            friction: 0
          },
          {position: [0.5, 0, 0], shape: {type: 'sphere', radius: 0.5}, restitution: 1, friction: 0}
        ]
      });
      const definition = new GPUCommandGraph(device);
      world.addToGraph(definition);
      const graph = await definition.compileAsync();
      const advance = async (steps: number) => {
        const encoder = device.createCommandEncoder();
        for (let step = 0; step < steps; step++) graph.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        expect((await world.readSimulationDiagnostics()).complete).toBe(true);
      };
      try {
        const initial = await world.captureState();
        await advance(1);
        const impact = await world.readState();
        const work = await world.readSolverWork();
        expect(work?.pairWorkgroups).toBe(compactContacts ? 1 : Math.ceil(world.maximumPairs / 64));
        if (compactContacts) expect(work?.activeContacts).toBe(1);
        await advance(8);
        if (compactContacts)
          expect(await world.readSolverWork()).toMatchObject({
            activeContacts: 0,
            pairWorkgroups: 0
          });
        world.restoreState(initial);
        await advance(1);
        expect(await world.readState()).toEqual(impact);
        snapshots.push(impact);
      } finally {
        graph.destroy();
        world.destroy();
      }
    }
    for (let body = 0; body < 2; body++) {
      for (let axis = 0; axis < 3; axis++) {
        expect(snapshots[0][body].position[axis]).toBeCloseTo(snapshots[1][body].position[axis], 5);
        expect(snapshots[0][body].velocity[axis]).toBeCloseTo(snapshots[1][body].velocity[axis], 5);
      }
    }
  },
  120000
);

it('compacts more than one workgroup of contacts without losing original manifold ownership', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const bodies: GPURigidBody[] = [];
  for (let pair = 0; pair < 80; pair++) {
    for (let endpoint = 0; endpoint < 2; endpoint++)
      bodies.push({
        position: [endpoint - 0.5, pair * 3, 0],
        velocity: [endpoint ? 0 : 2, 0, 0],
        shape: {type: 'sphere', radius: 0.5},
        mass: endpoint ? 2 : 1,
        restitution: 1,
        friction: 0
      });
  }
  const world = new GPURigidBodyWorld({
    bodies,
    solver: 'parallel',
    maximumPairs: 4096,
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
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
    expect(await world.readSolverWork()).toEqual({
      compacted: true,
      activeContacts: 80,
      awakeBodies: 160,
      awakeContacts: 80,
      bodyWorkgroups: 3,
      pairCapacity: 4096,
      pairWorkgroups: 2
    });
    for (let pair = 0; pair < 80; pair++) {
      expect(state[pair * 2].velocity[0]).toBeCloseTo(-2 / 3, 4);
      expect(state[pair * 2 + 1].velocity[0]).toBeCloseTo(4 / 3, 4);
    }
  } finally {
    graph.destroy();
    world.destroy();
  }
}, 120000);

it('omits sleeping islands from iterative work and restores the complete island on impulse', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    solver: 'parallel',
    gravity: [0, 0, 0],
    sleepAfter: 0.1,
    bodies: [0, 1].map(position => ({
      position: [position, 0, 0] as [number, number, number],
      shape: {type: 'sphere' as const, radius: 0.5}
    }))
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const advance = async (steps: number) => {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < steps; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return world.readState();
  };
  try {
    expect((await advance(60)).every(body => body.sleeping)).toBe(true);
    expect(await world.readSolverWork()).toMatchObject({
      activeContacts: 1,
      awakeContacts: 0,
      awakeBodies: 0,
      pairWorkgroups: 0,
      bodyWorkgroups: 0
    });
    world.applyImpulse(0, [1, 0, 0]);
    const state = await advance(1);
    expect(state.every(body => !body.sleeping)).toBe(true);
    expect(await world.readSolverWork()).toMatchObject({
      awakeContacts: 1,
      awakeBodies: 2,
      pairWorkgroups: 1,
      bodyWorkgroups: 1
    });
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});
