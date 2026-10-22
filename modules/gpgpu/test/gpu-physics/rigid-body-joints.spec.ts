// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, type GPURigidBodyJoint} from '../../src/gpu-physics';

it.for([
  'distance',
  'fixed',
  'hinge',
  'slider'
] as const)('constrains a gravity-loaded %s with complete diagnostics', async (kind, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const joint: GPURigidBodyJoint =
    kind === 'distance'
      ? {type: kind, first: 0, second: 1, distance: 2}
      : {
          type: kind,
          first: 0,
          second: 1,
          secondFrame: {position: [0, 0, 2]},
          ...(kind === 'slider' ? {limits: [-0.5, 0.5] as const} : {})
        };
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    iterations: 32,
    joints: [joint],
    gravity: [0, 0, -10],
    bodies: [
      {position: [0, 0, 3], mass: 0, shape: {type: 'box', halfExtents: [0.1, 0.1, 0.1]}},
      {position: [0, 0, 1], shape: {type: 'box', halfExtents: [0.3, 0.3, 0.3]}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 180; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const state = (await world.readState())[1];
    expect(state.position[2]).toBeCloseTo(kind === 'slider' ? 0.5 : 1, 2);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
    expect(Math.abs(state.velocity[2])).toBeLessThan(0.05);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('restores caches and diagnostics to reproduce a joint trajectory', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    failurePolicy: 'rollback',
    gravity: [0, 0, 0],
    joints: [
      {
        type: 'hinge',
        first: 0,
        second: 1,
        limits: [-0.4, 0.4],
        motor: {velocity: 2, maximumForce: 0.5}
      }
    ],
    bodies: [
      {position: [0, 0, 0], mass: 0, shape: {type: 'sphere', radius: 0.1}},
      {position: [0, 0, 0], shape: {type: 'box', halfExtents: [1, 0.2, 0.2]}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const advance = async () => {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 120; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return world.readState();
  };
  try {
    const capture = structuredClone(await world.captureState());
    const first = await advance();
    const diagnostics = await world.readSimulationDiagnostics();
    expect(2 * Math.atan2(first[1].orientation[2], first[1].orientation[3])).toBeCloseTo(0.4, 2);
    world.restoreState(capture);
    expect(await advance()).toEqual(first);
    expect(await world.readSimulationDiagnostics()).toEqual(diagnostics);
    const invalid = structuredClone(capture);
    invalid.buffers[0].data = new Uint8Array(4);
    expect(() => world.restoreState(invalid)).toThrow();
    expect(await world.readState()).toEqual(first);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it.for([
  1, 32
])('caps slider motor force independently of %s iterations', async (iterations, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    iterations,
    timeStep: 0.1,
    gravity: [0, 0, 0],
    joints: [{type: 'slider', first: 0, second: 1, motor: {velocity: 10, maximumForce: 0.3}}],
    bodies: [
      {position: [0, 0, 0], mass: 0, shape: {type: 'sphere', radius: 0.2}},
      {position: [0, 0, 0], mass: 1, shape: {type: 'sphere', radius: 0.2}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const state = (await world.readState())[1];
    expect(state.velocity[2]).toBeCloseTo(0.03, 6);
    expect(state.angularVelocity).toEqual([0, 0, 0]);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it.for([
  false,
  true
])('preserves explicit connected-body collision policy %s and event replay', async (collideConnected, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    eventCapacity: 16,
    gravity: [0, 0, 0],
    joints: [{type: 'distance', first: 0, second: 1, distance: 0.8, collideConnected}],
    bodies: [
      {position: [0, 0, 0], shape: {type: 'sphere', radius: 0.5}},
      {position: [0.8, 0, 0], shape: {type: 'sphere', radius: 0.5}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const advance = async () => {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return world.readContactEvents();
  };
  try {
    const capture = await world.captureState();
    const events = await advance();
    expect(events.events.length > 0).toBe(collideConnected);
    world.restoreState(capture);
    expect(await advance()).toEqual(events);
  } finally {
    graph.destroy();
    world.destroy();
  }
});
