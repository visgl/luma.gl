// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld} from '../../src/gpu-physics';

async function readPersistentContacts(world: GPURigidBodyWorld) {
  const bytes = (await world.captureState()).buffers.find(
    buffer => buffer.name === 'manifolds'
  )!.data;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const rows = [];
  for (let offset = 0; offset < bytes.byteLength; offset += 416)
    for (let slot = 0; slot < view.getUint32(offset + 384, true); slot++) {
      const start = offset + slot * 96;
      rows.push({
        matched: view.getFloat32(start + 36, true),
        firstFeature: view.getFloat32(start + 76, true),
        secondFeature: view.getFloat32(start + 92, true),
        depth: view.getFloat32(start + 12, true),
        impulse: view.getFloat32(start + 32, true)
      });
    }
  return rows;
}

it.for([
  'all-pairs',
  'hierarchical-grid'
] as const)('retains local anchors under common motion with %s discovery', async (broadPhase, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    broadPhase,
    sleepAfter: 0,
    contactSlop: 0,
    contactMatchDistance: 0.01,
    penetrationRecoveryFraction: 0,
    gravity: [0, 0, -10],
    bodies: [
      {
        mode: 'kinematic',
        position: [0, 0, -0.5],
        velocity: [12, 0, 0],
        shape: {type: 'box', halfExtents: [2, 2, 0.5]},
        friction: 1
      },
      {
        position: [0, 0, 0.5],
        velocity: [12, 0, 0],
        // Isolate common translation from tiny contact-induced rotations at zero slop.
        inertiaDiagonal: [0, 0, 0],
        shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]},
        friction: 1
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const contacts = () => readPersistentContacts(world);
  const step = async () => {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    await world.readState();
  };
  try {
    await step();
    const first = await contacts();
    expect(first.length).toBe(4);
    await step();
    const second = await contacts();
    expect(second.length).toBe(4);
    expect(second.every(contact => contact.matched > 0)).toBe(true);
    expect(second.map(contact => [contact.firstFeature, contact.secondFeature])).toEqual(
      first.map(contact => [contact.firstFeature, contact.secondFeature])
    );
    expect(second.reduce((sum, contact) => sum + contact.impulse, 0)).toBeCloseTo(
      10 * world.timeStep,
      4
    );
    expect((await world.readState())[1].velocity[0]).toBeCloseTo(12, 3);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it.for([
  'ordered',
  'parallel'
] as const)('retains box face keys and impulses across penetration changes (%s)', async (solver, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    solver,
    broadPhase: 'hierarchical-grid',
    iterations: 32,
    sleepAfter: 0,
    contactSlop: 0,
    contactMatchDistance: 0.05,
    penetrationRecoveryFraction: 0,
    gravity: [0, 0, -10],
    bodies: [
      {
        mode: 'static',
        position: [0, 0, -0.5],
        shape: {type: 'box', halfExtents: [2, 2, 0.5]},
        friction: 0.5
      },
      {position: [0, 0, 0.496], shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]}, friction: 0.5}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const step = async () => {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    await world.readState();
  };
  try {
    await step();
    const first = await readPersistentContacts(world);
    expect(first).toHaveLength(4);
    const capture = await world.captureState();
    const positions = capture.buffers.find(buffer => buffer.name === 'positions')!.data;
    new DataView(positions.buffer, positions.byteOffset, positions.byteLength).setFloat32(
      24,
      0.48,
      true
    );
    world.restoreState(capture);
    await step();
    const second = await readPersistentContacts(world);
    expect(second).toHaveLength(4);
    expect(second.every(contact => contact.matched > 0)).toBe(true);
    expect(new Set(second.map(contact => contact.matched)).size).toBe(4);
    expect(second.map(contact => [contact.firstFeature, contact.secondFeature])).toEqual(
      first.map(contact => [contact.firstFeature, contact.secondFeature])
    );
    expect(second.every(contact => contact.depth > 0.019)).toBe(true);
    expect(second.reduce((sum, contact) => sum + contact.impulse, 0)).toBeGreaterThan(0);
  } finally {
    graph.destroy();
    world.destroy();
  }
});
