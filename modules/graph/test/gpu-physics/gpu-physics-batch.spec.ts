// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils/device';
import {GPUPhysicsBatch, type GPURigidBodyWorldProps} from '../../src/gpu-physics';

const fixture: GPURigidBodyWorldProps = {
  failurePolicy: 'rollback',
  gravity: [0, 0, 0],
  sleepAfter: 0,
  iterations: 4,
  eventCapacity: 16,
  bodies: [
    {
      position: [-0.6, 0, 0],
      velocity: [1, 0, 0],
      shape: {type: 'sphere', radius: 0.5},
      restitution: 1,
      friction: 0
    },
    {
      position: [0.6, 0, 0],
      velocity: [-1, 0, 0],
      shape: {type: 'sphere', radius: 0.5},
      restitution: 1,
      friction: 0
    }
  ]
};

it('isolates overlapping worlds, skips paused worlds, and reuses slots without leaking events', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const batch = new GPUPhysicsBatch({
    device,
    maximumResidentBytes: 32 * 1024 * 1024,
    maximumResidentWorlds: 2
  });
  try {
    batch.registerTemplate('pair', fixture);
    const first = await batch.acquire('pair', 'first');
    const second = await batch.acquire('pair', 'second');
    const initial = await batch.getWorld(second).readState();
    batch.setActive(second, false);
    const encoder = device.createCommandEncoder();
    expect(batch.encode(encoder, 20)).toEqual({worldSteps: 20, bodySteps: 40});
    device.submit(encoder.finish());
    const reference = await batch.getWorld(first).readState();
    expect(reference).not.toEqual(initial);
    expect(await batch.getWorld(second).readState()).toEqual(initial);
    expect((await batch.getWorld(first).readContactEvents()).events.length).toBeGreaterThan(0);
    batch.setActive(first, false);
    batch.setActive(second, true);
    const comparison = device.createCommandEncoder();
    batch.encode(comparison, 20);
    device.submit(comparison.finish());
    expect(await batch.getWorld(second).readState()).toEqual(reference);
    const buffers = batch.getWorld(first).positions;
    const bytes = batch.getStats().residentBytes;
    expect(batch.getStats().checkpointBytes).toBeLessThan(batch.getStats().worldBufferBytes);
    batch.release(first);
    const recycled = await batch.acquire('pair', 'first');
    expect(recycled.generation).not.toBe(first.generation);
    expect(() => batch.getWorld(first)).toThrow('Stale');
    expect(batch.getWorld(recycled).positions).toBe(buffers);
    expect(await batch.getWorld(recycled).readState()).toEqual(initial);
    expect((await batch.getWorld(recycled).readContactEvents()).events).toEqual([]);
    expect(batch.getStats()).toMatchObject({residentBytes: bytes, createdSlots: 2, reusedSlots: 1});
    await expect(batch.acquire('pair', 'overflow')).rejects.toThrow('budget');
    expect(await batch.getWorld(second).readState()).toEqual(reference);
    batch.release(recycled);
    batch.trim();
    expect(batch.getStats().residentWorlds).toBe(1);
  } finally {
    batch.destroy();
  }
});

it('rebases contacts and global origins without changing dynamics and restores the original frame', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const batch = new GPUPhysicsBatch({
    device,
    maximumResidentBytes: 32 * 1024 * 1024,
    maximumResidentWorlds: 2
  });
  try {
    batch.registerTemplate('pair', fixture);
    const reference = await batch.acquire('pair', 'reference');
    const shifted = await batch.acquire('pair', 'shifted', [1e20, 0, 0]);
    const world = batch.getWorld(shifted);
    const encoder = device.createCommandEncoder();
    batch.encode(encoder, 7);
    device.submit(encoder.finish());
    const before = await world.readState();
    world.shiftOrigin([16, 0, 0]);
    expect(batch.getOrigin(shifted)).toEqual([1e20 + 16, 0, 0]);
    expect(batch.getRenderTranslation(shifted, [1e20, 0, 0])).toEqual([16, 0, 0]);
    const rebased = await world.readState();
    for (let index = 0; index < before.length; index++) {
      expect(rebased[index].position[0] + 16).toBeCloseTo(before[index].position[0], 4);
      expect(rebased[index].velocity).toEqual(before[index].velocity);
    }
    const continuation = device.createCommandEncoder();
    batch.encode(continuation, 12);
    device.submit(continuation.finish());
    const expected = await batch.getWorld(reference).readState();
    const actual = await world.readState();
    for (let index = 0; index < expected.length; index++) {
      expect(actual[index].position[0] + 16).toBeCloseTo(expected[index].position[0], 3);
      expect(actual[index].velocity[0]).toBeCloseTo(expected[index].velocity[0], 3);
    }
    const capture = await world.captureState();
    world.shiftOrigin([-16, 0, 0]);
    world.restoreState(capture);
    expect(world.origin).toEqual([16, 0, 0]);
    batch.reset(shifted);
    expect(world.origin).toEqual([0, 0, 0]);
    expect((await world.readState())[0].position[0]).toBeCloseTo(-0.6, 5);
    expect(() => world.shiftOrigin([0.1, 0, 0])).toThrow('float32');
  } finally {
    batch.destroy();
  }
});

it('evicts released templates, accounts resident storage, and rejects concurrent streaming', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const batch = new GPUPhysicsBatch({
    device,
    maximumResidentBytes: 32 * 1024 * 1024,
    maximumResidentWorlds: 1
  });
  try {
    batch.registerTemplate('first', fixture);
    batch.registerTemplate('second', {...fixture, bodies: [fixture.bodies[0]]});
    const loading = batch.acquire('first', 'world');
    await expect(batch.acquire('first', 'other')).rejects.toThrow('busy');
    const handle = await loading;
    batch.release(handle);
    await batch.acquire('second', 'world');
    const stats = batch.getStats();
    expect(stats).toMatchObject({residentWorlds: 1, createdSlots: 2, evictedSlots: 1});
    expect(stats.residentBytes).toBe(
      stats.worldBufferBytes + stats.checkpointBytes + stats.graphTransientBytes
    );
  } finally {
    batch.destroy();
  }
});

it('streams accepted state through eviction and preserves swept sensors, queries and local origins', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const batch = new GPUPhysicsBatch({
    device,
    maximumResidentBytes: 32 * 1024 * 1024,
    maximumResidentWorlds: 1
  });
  try {
    batch.registerTemplate('sensor', {
      gravity: [0, 0, 0],
      timeStep: 0.1,
      enableQueries: true,
      failurePolicy: 'rollback',
      triggers: [{colliders: [0], targets: [1], swept: true}],
      bodies: [
        {
          mode: 'static',
          position: [0, 0, 0],
          colliders: [{isTrigger: true, shape: {type: 'sphere', radius: 1}}]
        },
        {position: [-3, 0, 0], velocity: [2, 0, 0], shape: {type: 'sphere', radius: 0.25}}
      ]
    });
    const handle = await batch.acquire('sensor', 'traveller', [1e9, 0, 0]);
    expect(batch.planSubmissions(1, 1)[0].oversized).toBe(true);
    const encoder = device.createCommandEncoder();
    batch.encode(encoder, 10);
    device.submit(encoder.finish());
    const world = batch.getWorld(handle);
    world.shiftOrigin([8, 0, 0]);
    const expected = await world.readState();
    const saved = await batch.streamOut(handle);
    expect(saved.state.includeRollbackScratch).toBe(false);
    expect(saved.state.buffers.some(buffer => buffer.name.startsWith('checkpoint-'))).toBe(false);
    expect(() => batch.getWorld(handle)).toThrow('Stale');
    batch.trim();
    expect(batch.getStats().residentBytes).toBe(0);
    const restored = await batch.streamIn('resumed', saved);
    expect(await batch.getWorld(restored).readState()).toEqual(expected);
    expect(batch.getOrigin(restored)).toEqual([1e9 + 8, 0, 0]);
    const query = await batch.getWorld(restored).overlapSphere({center: [-8, 0, 0], radius: 2});
    expect(query.complete).toBe(true);
    expect(query.hits.some(hit => hit.body === 1)).toBe(true);
    const continuation = device.createCommandEncoder();
    batch.encode(continuation, 20);
    device.submit(continuation.finish());
    const events = await batch.getWorld(restored).readTriggerEvents();
    expect(events.events.map(event => event.phase)).toEqual(['enter', 'exit']);
    expect(events.dropped).toBe(0);
  } finally {
    batch.destroy();
  }
});

it('keeps allocations flat over repeated streaming-slot churn', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const batch = new GPUPhysicsBatch({
    device,
    maximumResidentBytes: 32 * 1024 * 1024,
    maximumResidentWorlds: 1
  });
  try {
    batch.registerTemplate('pair', fixture);
    let handle = await batch.acquire('pair', 'world-0');
    const buffer = batch.getWorld(handle).positions;
    const bytes = batch.getStats().residentBytes;
    expect(batch.getStats().checkpointBytes).toBeLessThan(batch.getStats().worldBufferBytes);
    for (let cycle = 1; cycle <= 64; cycle++) {
      const encoder = device.createCommandEncoder();
      batch.encode(encoder, 2);
      device.submit(encoder.finish());
      batch.release(handle);
      handle = await batch.acquire('pair', `world-${cycle}`);
      expect(batch.getWorld(handle).positions).toBe(buffer);
      expect(batch.getStats().residentBytes).toBe(bytes);
    }
    expect((await batch.getWorld(handle).readState())[0].position[0]).toBeCloseTo(-0.6, 5);
    expect(batch.getStats()).toMatchObject({createdSlots: 1, reusedSlots: 64});
  } finally {
    batch.destroy();
  }
});

it('rebases kinematic targets and body-local joint anchors together', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const batch = new GPUPhysicsBatch({
    device,
    maximumResidentBytes: 32 * 1024 * 1024,
    maximumResidentWorlds: 2
  });
  try {
    batch.registerTemplate('joint', {
      gravity: [0, 0, 0],
      sleepAfter: 0,
      bodies: [
        {mode: 'kinematic', position: [0, 0, 0], shape: {type: 'sphere', radius: 0.1}},
        {position: [0, -2, 0], shape: {type: 'sphere', radius: 0.1}}
      ],
      joints: [{type: 'distance', first: 0, second: 1, distance: 2}]
    });
    const reference = await batch.acquire('joint', 'reference');
    const shifted = await batch.acquire('joint', 'shifted');
    for (const handle of [reference, shifted])
      batch.getWorld(handle).setKinematicTarget(0, [1, 0, 0], [0, 0, 0, 1]);
    batch.getWorld(shifted).shiftOrigin([16, 8, 0]);
    const encoder = device.createCommandEncoder();
    batch.encode(encoder, 30);
    device.submit(encoder.finish());
    const expected = await batch.getWorld(reference).readState();
    const actual = await batch.getWorld(shifted).readState();
    for (let index = 0; index < expected.length; index++) {
      expect(actual[index].position[0] + 16).toBeCloseTo(expected[index].position[0], 3);
      expect(actual[index].position[1] + 8).toBeCloseTo(expected[index].position[1], 3);
    }
  } finally {
    batch.destroy();
  }
});

it('restores a reused streaming slot before exposing it to immediate encoding', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const batch = new GPUPhysicsBatch({
    device,
    maximumResidentBytes: 32 * 1024 * 1024,
    maximumResidentWorlds: 1
  });
  try {
    batch.registerTemplate('moving', {
      gravity: [0, 0, 0],
      timeStep: 0.1,
      sleepAfter: 0,
      bodies: [{position: [0, 0, 0], velocity: [1, 0, 0], shape: {type: 'sphere', radius: 0.1}}]
    });
    const handle = await batch.acquire('moving', 'first');
    const encoder = device.createCommandEncoder();
    batch.encode(encoder, 10);
    device.submit(encoder.finish());
    const snapshot = await batch.streamOut(handle);
    const pending = batch.streamIn('restored', snapshot);
    // Reuse can finish synchronously, but must never expose the reset state before restoration.
    const continuation = device.createCommandEncoder();
    expect(batch.encode(continuation)).toEqual({worldSteps: 1, bodySteps: 1});
    device.submit(continuation.finish());
    const restored = await pending;
    expect((await batch.getWorld(restored).readState())[0].position[0]).toBeCloseTo(1.1, 5);
  } finally {
    batch.destroy();
  }
});
