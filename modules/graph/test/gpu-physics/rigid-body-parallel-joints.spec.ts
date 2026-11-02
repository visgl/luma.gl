// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld} from '../../src/gpu-physics';

it.each([
  'all-pairs',
  'hierarchical-grid'
] as const)('supports and releases an isolated parallel pendulum with %s discovery', async (broadPhase, context) => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    bodies: [
      {position: [0, 0, 4], mass: 0, shape: {type: 'sphere', radius: 0.1}},
      {position: [0, 0, 1.5], shape: {type: 'sphere', radius: 0.4}}
    ],
    joints: [{type: 'distance', first: 0, second: 1, distance: 2.5}],
    solver: 'parallel',
    broadPhase,
    maximumPairs: 16,
    timeStep: 1 / 60,
    iterations: 8,
    gravity: [0, 0, -9.81],
    failurePolicy: 'rollback'
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const simulate = async (steps: number) => {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < steps; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return world.readState();
  };
  try {
    // No contacts exist: a zero-sized contact queue must not suppress joint work.
    const supported = await simulate(180);
    expect(supported[1].position[2]).toBeCloseTo(1.5, 3);
    expect(Math.abs(supported[1].velocity[2])).toBeLessThan(0.01);
    expect(supported[1].sleeping).toBe(true);

    // A live toggle must wake the sleeping body and discard the old support impulse.
    world.setJointEnabled(0, false);
    const released = await simulate(30);
    expect(released[1].position[2]).toBeLessThan(0.5);
    expect(released[1].velocity[2]).toBeLessThan(-4);

    world.setJointEnabled(0, true);
    const restored = await simulate(120);
    expect(restored[1].position[2]).toBeCloseTo(1.5, 2);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});
