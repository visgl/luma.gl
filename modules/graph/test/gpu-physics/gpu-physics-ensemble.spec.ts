// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  GPUPhysicsEnsemble,
  GPURigidBodyWorld,
  makeConvexHullGeometry,
  type GPURigidBodyWorldProps
} from '../../src/gpu-physics';

import {GPUCommandGraph} from '../../src/gpu-core/gpu-command-graph';

const template: GPURigidBodyWorldProps = {
  gravity: [0, 0, 0],
  timeStep: 1 / 120,
  iterations: 8,
  sleepAfter: 0,
  eventCapacity: 64,
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

it('fuses overlapping contact worlds without cross-world contacts or trajectory changes', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const reference = await GPUPhysicsEnsemble.create(device, {
    template,
    instances: 1,
    maximumPairs: 64,
    maximumResidentBytes: 64 * 1024 * 1024
  });
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template,
    instances: 16,
    maximumPairs: 1024,
    maximumResidentBytes: 64 * 1024 * 1024
  });
  try {
    const encoder = device.createCommandEncoder();
    reference.encode(encoder, 36);
    ensemble.encode(encoder, 36);
    device.submit(encoder.finish());
    const expected = await reference.world.readState();
    const actual = await ensemble.world.readState();
    expect(expected[0].velocity[0]).toBeLessThan(0);
    for (let instance = 0; instance < 16; instance++)
      for (let body = 0; body < 2; body++) {
        const state = actual[ensemble.getBodyIndex(instance, body)];
        for (let axis = 0; axis < 3; axis++) {
          expect(state.position[axis]).toBeCloseTo(expected[body].position[axis], 4);
          expect(state.velocity[axis]).toBeCloseTo(expected[body].velocity[axis], 4);
        }
      }
    expect((await ensemble.world.readSimulationDiagnostics()).complete).toBe(true);
    const events = (await ensemble.world.readContactEvents()).events;
    expect(events.length).toBeGreaterThan(0);
    for (const event of events)
      expect(Math.floor(event.bodies[0] / 2)).toBe(Math.floor(event.bodies[1] / 2));
    expect(ensemble.getStats().checkpointBytes).toBe(reference.getStats().checkpointBytes);
    expect(() => ensemble.getBodyIndex(16, 0)).toThrow();
  } finally {
    reference.destroy();
    ensemble.destroy();
  }
});

it('hashes a thousand coincident independent worlds without quadratic candidate traversal', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template: {
      ...template,
      eventCapacity: 0,
      maximumCandidateTestsPerCollider: 16,
      bodies: [template.bodies[0]]
    },
    instances: 1024,
    maximumPairs: 64,
    maximumResidentBytes: 16 * 1024 * 1024
  });
  try {
    const encoder = device.createCommandEncoder();
    ensemble.encode(encoder, 2);
    device.submit(encoder.finish());
    expect((await ensemble.world.readSimulationDiagnostics()).complete).toBe(true);
    const states = await ensemble.world.readState();
    for (const state of states) expect(state.position[0]).toBeCloseTo(-0.6 + 2 / 120, 5);
    expect(ensemble.getStats().residentBytes).toBeLessThan(4 * 1024 * 1024);
  } finally {
    ensemble.destroy();
  }
});

it('rejects unsupported and over-budget ensemble layouts before allocation', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  await expect(
    GPUPhysicsEnsemble.create(device, {
      template,
      instances: 40000,
      maximumPairs: 64,
      maximumResidentBytes: 1e8
    })
  ).rejects.toThrow('layout');
  await expect(
    GPUPhysicsEnsemble.create(device, {
      template,
      instances: 1,
      maximumPairs: 64,
      maximumResidentBytes: 1
    })
  ).rejects.toThrow('budget');
});

it('isolates oversized plane colliders in the global fallback list', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template: {
      gravity: [0, -9.81, 0],
      timeStep: 1 / 120,
      eventCapacity: 64,
      bodies: [
        {position: [0, 0.5, 0], shape: {type: 'sphere', radius: 0.5}},
        {position: [0, 0, 0], mass: 0, shape: {type: 'plane'}}
      ]
    },
    instances: 8,
    maximumPairs: 64,
    maximumResidentBytes: 32 * 1024 * 1024
  });
  try {
    const encoder = device.createCommandEncoder();
    ensemble.encode(encoder, 8);
    device.submit(encoder.finish());
    expect((await ensemble.world.readSimulationDiagnostics()).complete).toBe(true);
    const states = await ensemble.world.readState();
    for (let instance = 0; instance < 8; instance++)
      expect(states[instance * 2].position[1]).toBeCloseTo(0.5, 2);
    const events = (await ensemble.world.readContactEvents()).events;
    expect(events.length).toBeGreaterThan(0);
    for (const event of events)
      expect(Math.floor(event.bodies[0] / 2)).toBe(Math.floor(event.bodies[1] / 2));
  } finally {
    ensemble.destroy();
  }
});

it('rejects shared contact overflow and rolls every instance back atomically', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template: {
      gravity: [0, -9.81, 0],
      bodies: Array.from({length: 12}, (_, index) => ({
        position: [index * 0.01, 0, 0] as [number, number, number],
        shape: {type: 'sphere' as const, radius: 0.5}
      }))
    },
    instances: 4,
    maximumPairs: 64,
    maximumResidentBytes: 16 * 1024 * 1024
  });
  try {
    const initial = await ensemble.world.readState();
    const encoder = device.createCommandEncoder();
    ensemble.encode(encoder);
    device.submit(encoder.finish());
    expect((await ensemble.world.readSimulationDiagnostics()).complete).toBe(false);
    expect(await ensemble.world.readState()).toEqual(initial);
    const status = await ensemble.readStatus();
    expect(
      status.instances.every(instance => instance.sharedFailure && instance.rejectedSteps === 1)
    ).toBe(true);
    await expect(ensemble.reset(0)).rejects.toThrow('shared ensemble failure');
  } finally {
    ensemble.destroy();
  }
});

it('preserves shared mesh packing through checkpoints and streamed captures', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const geometry = makeConvexHullGeometry(
    Array.from({length: 8}, (_, corner) => [
      corner & 1 ? 1 : -1,
      corner & 2 ? 1 : -1,
      corner & 4 ? 1 : -1
    ]).flat()
  );
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template: {bodies: [{position: [0, 0, 0], mass: 0, shape: {type: 'convex-hull', geometry}}]},
    instances: 4,
    maximumPairs: 64,
    maximumResidentBytes: 32 * 1024 * 1024
  });
  try {
    const bytes = ensemble.getStats().worldBufferBytes;
    const checkpoint = ensemble.world.createGPUCheckpoint({includeRollbackScratch: false});
    checkpoint.save();
    checkpoint.restore();
    expect(ensemble.getStats().worldBufferBytes).toBe(bytes);
    ensemble.world.setColliderMaterial(0, {staticFriction: 0.8});
    ensemble.world.setColliderTransform(1, [0.1, 0, 0], [0, 0, 0, 1]);
    const capture = await ensemble.world.captureState({includeRollbackScratch: false});
    ensemble.world.restoreState(capture);
    expect(ensemble.getStats().worldBufferBytes).toBe(bytes);
    checkpoint.destroy();
    const rebuilt = new GPURigidBodyWorld(capture.props);
    const commands = new GPUCommandGraph(device);
    rebuilt.addToGraph(commands);
    const graph = await commands.compileAsync();
    try {
      expect(rebuilt.getCapacityInfo().ownedBufferBytes).toBe(bytes);
      rebuilt.restoreState(capture);
      expect(await rebuilt.readState()).toEqual(await ensemble.world.readState());
      expect(rebuilt.getColliderMaterial(0).staticFriction).toBe(0.8);
    } finally {
      graph.destroy();
      rebuilt.destroy();
    }
  } finally {
    ensemble.destroy();
  }
});

it('pauses and selectively resets without moving peers or retaining stale contacts', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template,
    instances: 4,
    maximumPairs: 256,
    maximumResidentBytes: 16 * 1024 * 1024
  });
  const step = async (steps: number) => {
    const encoder = device.createCommandEncoder();
    ensemble.encode(encoder, steps);
    device.submit(encoder.finish());
    return ensemble.world.readState();
  };
  try {
    const initial = await ensemble.world.readState();
    ensemble.setActive(1, false);
    const moved = await step(36);
    expect(moved.slice(2, 4)).toEqual(initial.slice(2, 4));
    expect(moved[0].velocity[0]).toBeLessThan(0);
    const status = await ensemble.readStatus();
    expect(status.activeInstances).toBe(3);
    expect(status.instances[0].acceptedSteps).toBe(36);
    expect(status.instances[1].acceptedSteps).toBe(0);
    const bytes = ensemble.getStats().residentBytes;
    for (let iteration = 0; iteration < 3; iteration++) {
      await ensemble.reset(2);
      const reset = await ensemble.world.readState();
      expect(reset.slice(4, 6)).toEqual(initial.slice(4, 6));
      expect(reset.slice(0, 4)).toEqual(moved.slice(0, 4));
      expect(reset.slice(6)).toEqual(moved.slice(6));
      expect(ensemble.getStats().residentBytes).toBe(bytes);
    }
    ensemble.setActive(1, true);
    const resumed = await step(36);
    for (const body of [2, 4]) {
      expect(resumed[body].position[0]).toBeCloseTo(moved[0].position[0], 5);
      expect(resumed[body].velocity[0]).toBeCloseTo(moved[0].velocity[0], 5);
    }
    expect((await ensemble.readStatus()).instances[2].acceptedSteps).toBe(36);
    expect((await ensemble.world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    ensemble.destroy();
  }
});

it('skips sleeping instances and wakes only the requested instance', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template: {
      gravity: [0, 0, 0],
      sleepAfter: 0.01,
      bodies: [{position: [0, 0, 0], shape: {type: 'sphere', radius: 0.5}}]
    },
    instances: 16,
    maximumPairs: 64,
    maximumResidentBytes: 16 * 1024 * 1024
  });
  try {
    const encoder = device.createCommandEncoder();
    ensemble.encode(encoder, 8);
    device.submit(encoder.finish());
    expect((await ensemble.readStatus()).activeInstances).toBe(0);
    expect((await ensemble.world.readState()).every(state => state.sleeping)).toBe(true);
    ensemble.wake(7);
    const awake = device.createCommandEncoder();
    ensemble.encode(awake);
    device.submit(awake.finish());
    const status = await ensemble.readStatus();
    expect(status.activeInstances).toBe(1);
    expect(status.instances[7].active).toBe(true);
  } finally {
    ensemble.destroy();
  }
});

it('resets into the rebased coordinate system', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template,
    instances: 2,
    maximumPairs: 64,
    maximumResidentBytes: 16 * 1024 * 1024
  });
  try {
    ensemble.world.shiftOrigin([128, 0, 0]);
    const before = await ensemble.world.readState();
    await ensemble.reset(1);
    const after = await ensemble.world.readState();
    expect(after).toEqual(before);
  } finally {
    ensemble.destroy();
  }
});

it.each([
  true,
  false
])('preserves paused contacts and events with compactContacts=%s', async (compactContacts, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template: {
      compactContacts,
      gravity: [0, -9.81, 0],
      sleepAfter: 0,
      eventCapacity: 256,
      bodies: [
        {position: [0, 0.5, 0], shape: {type: 'sphere', radius: 0.5}},
        {position: [0, 0, 0], mass: 0, shape: {type: 'plane'}}
      ]
    },
    instances: 2,
    maximumPairs: 64,
    maximumResidentBytes: 16 * 1024 * 1024
  });
  const step = async (steps: number) => {
    const encoder = device.createCommandEncoder();
    ensemble.encode(encoder, steps);
    device.submit(encoder.finish());
    return ensemble.world.readState();
  };
  const contacts = async () => {
    const capture = await ensemble.world.captureState({includeRollbackScratch: false});
    const bytes = capture.buffers.find(buffer => buffer.name === 'manifolds')!.data;
    const records = [];
    for (let offset = 0; offset < bytes.length; offset += 416) {
      const header = new DataView(bytes.buffer, bytes.byteOffset + offset, 416);
      if (header.getUint32(384, true) && header.getUint32(388, true) < 2)
        records.push(Array.from(bytes.slice(offset, offset + 416)));
    }
    return records;
  };
  try {
    const before = await step(8);
    const retained = await contacts();
    expect(retained.length).toBeGreaterThan(0);
    await ensemble.world.readContactEvents();
    ensemble.setActive(0, false);
    const paused = await step(64);
    expect(paused.slice(0, 2)).toEqual(before.slice(0, 2));
    expect(await contacts()).toEqual(retained);
    expect(
      (await ensemble.world.readContactEvents()).events.every(event => event.bodies[0] >= 2)
    ).toBe(true);
    ensemble.setActive(0, true);
    const resumed = await step(8);
    expect(resumed[0].position[1]).toBeCloseTo(0.5, 3);
    expect((await ensemble.world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    ensemble.destroy();
  }
});

it('clears mesh work when every instance is paused and preserves peers during mesh reset', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const geometry = makeConvexHullGeometry(
    Array.from({length: 8}, (_, corner) => [
      corner & 1 ? 0.5 : -0.5,
      corner & 2 ? 0.5 : -0.5,
      corner & 4 ? 0.5 : -0.5
    ]).flat()
  );
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template: {
      gravity: [0, -9.81, 0],
      sleepAfter: 0,
      bodies: [
        {position: [0, 0.5, 0], shape: {type: 'convex-hull', geometry}},
        {position: [0, 0, 0], mass: 0, shape: {type: 'plane'}}
      ]
    },
    instances: 2,
    maximumPairs: 64,
    maximumResidentBytes: 16 * 1024 * 1024
  });
  const step = async () => {
    const encoder = device.createCommandEncoder();
    ensemble.encode(encoder, 4);
    device.submit(encoder.finish());
    return ensemble.world.readState();
  };
  try {
    const initial = await ensemble.world.readState();
    const settled = await step();
    ensemble.setActive(0, false);
    ensemble.setActive(1, false);
    expect(await step()).toEqual(settled);
    expect((await ensemble.readStatus()).activeInstances).toBe(0);
    await ensemble.reset(1);
    const reset = await ensemble.world.readState();
    expect(reset.slice(0, 2)).toEqual(settled.slice(0, 2));
    expect(reset.slice(2)).toEqual(initial.slice(2));
    ensemble.setActive(1, true);
    await step();
    expect((await ensemble.world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    ensemble.destroy();
  }
});

it('restores selected collider scales while retaining peer shape edits', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template,
    instances: 2,
    maximumPairs: 64,
    maximumResidentBytes: 16 * 1024 * 1024
  });
  try {
    ensemble.world.setColliderShapes([
      {collider: 0, shape: {type: 'sphere', radius: 1}, shapeScale: [2, 2, 2]},
      {collider: 2, shape: {type: 'sphere', radius: 1.5}, shapeScale: [3, 3, 3]}
    ]);
    await ensemble.reset(0);
    expect(ensemble.world.getColliderShape(0)).toEqual({type: 'sphere', radius: 0.5});
    expect(ensemble.world.getColliderShapeScale(0)).toEqual([1, 1, 1]);
    expect(ensemble.world.getColliderShape(2)).toEqual({type: 'sphere', radius: 1.5});
    expect(ensemble.world.getColliderShapeScale(2)).toEqual([3, 3, 3]);
    expect(
      (await ensemble.world.captureState({includeRollbackScratch: false})).colliderShapeScales
    ).toEqual([[2, [3, 3, 3]]]);
  } finally {
    ensemble.destroy();
  }
});

it('rejects adversarial hash bucket traversal instead of silently ignoring the work budget', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  // Radius 0.5 plus an exactly representable 0.125 margin uses level 12 (cell size 4). Pick 128
  // distinct cells with the same low 8 hash bits, without overlapping bodies.
  const coordinates: number[] = [];
  for (let coordinate = 0; coordinates.length < 128; coordinate++) {
    let hash = Math.imul(coordinate, 73856093) ^ Math.imul(12, 2654435761);
    hash = Math.imul(hash ^ (hash >>> 16), 2246822519);
    hash ^= hash >>> 13;
    if (
      (hash & 255) === 0 &&
      (!coordinates.length || coordinate - coordinates[coordinates.length - 1] >= 3)
    )
      coordinates.push(coordinate);
  }
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template: {
      gravity: [0, 0, 0],
      sleepAfter: 0,
      maximumCandidateTestsPerCollider: 1,
      contactSlop: 0.125,
      bodies: coordinates.map(coordinate => ({
        position: [coordinate * 4, 0, 0],
        shape: {type: 'sphere', radius: 0.5}
      }))
    },
    instances: 1,
    maximumPairs: 64,
    maximumResidentBytes: 16 * 1024 * 1024
  });
  try {
    const initial = await ensemble.world.readState();
    const encoder = device.createCommandEncoder();
    ensemble.encode(encoder);
    device.submit(encoder.finish());
    const diagnostics = await ensemble.world.readSimulationDiagnostics();
    expect(diagnostics.complete).toBe(false);
    expect(diagnostics.incompleteQueries).toBeGreaterThan(0);
    expect(diagnostics.droppedPairs).toBe(0);
    expect(diagnostics.maximumCandidateTests).toBeLessThanOrEqual(coordinates.length);
    const capture = await ensemble.world.captureState({includeRollbackScratch: false});
    const minima = new Float32Array(
      capture.buffers.find(buffer => buffer.name === 'minima')!.data.buffer
    );
    const maxima = new Float32Array(
      capture.buffers.find(buffer => buffer.name === 'maxima')!.data.buffer
    );
    for (let index = 0; index < coordinates.length; index++) {
      const size = Math.max(
        ...[0, 1, 2].map(axis => maxima[index * 3 + axis] - minima[index * 3 + axis])
      );
      expect(Math.ceil(Math.log2(size * 2 * 1024))).toBe(12);
      expect(Math.floor((minima[index * 3] * 0.5 + maxima[index * 3] * 0.5) / 4)).toBe(
        coordinates[index]
      );
    }
    expect(await ensemble.world.readState()).toEqual(initial);
  } finally {
    ensemble.destroy();
  }
});

it('copies active payloads independently of resident contact capacity and preserves wake notifications', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template: {
      gravity: [0, 0, 0],
      sleepAfter: 0.01,
      bodies: [{position: [0, 0, 0], shape: {type: 'sphere', radius: 0.5}}]
    },
    instances: 128,
    maximumPairs: 16384,
    maximumResidentBytes: 32 * 1024 * 1024
  });
  const step = async (steps = 1) => {
    const encoder = device.createCommandEncoder();
    ensemble.encode(encoder, steps);
    device.submit(encoder.finish());
    return ensemble.readWorkStatistics();
  };
  try {
    await step(8);
    expect(await step()).toMatchObject({
      activeBodies: 0,
      journaledContacts: 0,
      visitedContacts: 0,
      bodySnapshotBytes: 0,
      contactSnapshotBytes: 0,
      allocatorSnapshotBytes: 32
    });
    ensemble.setActive(7, false);
    ensemble.wake(7);
    await step(2);
    ensemble.setActive(7, true);
    expect(await step()).toMatchObject({
      activeInstances: 1,
      activeBodies: 1,
      bodySnapshotBytes: 80,
      allocatorSnapshotBytes: 40
    });
    await step(8);
    ensemble.world.applyImpulse(7, [1, 0, 0]);
    await step();
    expect((await ensemble.world.readState())[7].position[0]).toBeGreaterThan(0);
    expect((await ensemble.world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    ensemble.destroy();
  }
});

it('retires, reuses and resets sparse contact lists without changing paused peers', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template,
    instances: 4,
    maximumPairs: 64,
    maximumResidentBytes: 16 * 1024 * 1024
  });
  const step = async (steps: number) => {
    const encoder = device.createCommandEncoder();
    ensemble.encode(encoder, steps);
    device.submit(encoder.finish());
    return ensemble.world.readState();
  };
  try {
    await step(16);
    ensemble.setActive(3, false);
    const paused = (await ensemble.world.readState()).slice(6);
    for (let cycle = 0; cycle < 12; cycle++) {
      await ensemble.reset(cycle % 3);
      await step(40);
      expect((await ensemble.world.readState()).slice(6)).toEqual(paused);
      const work = await ensemble.readWorkStatistics();
      expect(work.journaledContacts).toBeLessThanOrEqual(3);
      expect(work.visitedContacts).toBeLessThanOrEqual(3);
      expect((await ensemble.world.readSimulationDiagnostics()).complete).toBe(true);
    }
  } finally {
    ensemble.destroy();
  }
});

it('repeated shared overflow restores contact payloads and allocator ownership', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template: {
      gravity: [0, 0, 0],
      bodies: Array.from({length: 12}, (_, index) => ({
        position: [index * 0.01, 0, 0] as [number, number, number],
        shape: {type: 'sphere' as const, radius: 0.5}
      }))
    },
    instances: 4,
    maximumPairs: 64,
    maximumResidentBytes: 16 * 1024 * 1024
  });
  try {
    const initial = await ensemble.world.readState();
    for (let attempt = 0; attempt < 4; attempt++) {
      const encoder = device.createCommandEncoder();
      ensemble.encode(encoder);
      device.submit(encoder.finish());
      expect(await ensemble.world.readState()).toEqual(initial);
      const capture = await ensemble.world.captureState();
      const contacts = capture.buffers.find(buffer => buffer.name === 'manifolds')!.data;
      expect(contacts.slice(0, 64 * 416).every(value => value === 0)).toBe(true);
      const targets = new Uint32Array(
        capture.buffers.find(buffer => buffer.name === 'targets')!.data.buffer
      );
      const keyOffset = ensemble.world.count * 8 + 8;
      expect(
        Array.from(targets.slice(keyOffset, keyOffset + 64 * 2)).every(value => value === 0)
      ).toBe(true);
      expect(
        Array.from(targets.slice(keyOffset + 64 * 2, keyOffset + 64 * 2 + 4)).every(
          value => value === 0
        )
      ).toBe(true);
    }
  } finally {
    ensemble.destroy();
  }
});

it('restores existing contacts and new claims when a later step exhausts discovery', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    template: {
      gravity: [0, 0, 0],
      timeStep: 1 / 30,
      sleepAfter: 0,
      maximumCandidateTestsPerCollider: 4,
      bodies: [
        {position: [0, 0, 0], mass: 0, shape: {type: 'sphere', radius: 0.5}},
        {position: [0.99, 0, 0], shape: {type: 'sphere', radius: 0.5}},
        ...Array.from({length: 6}, (_, index) => ({
          position: [12 + index * 6, 0, 0] as [number, number, number],
          velocity: [-24 - index * 12, 0, 0] as [number, number, number],
          shape: {type: 'sphere' as const, radius: 0.5}
        }))
      ]
    },
    instances: 4,
    maximumPairs: 64,
    maximumResidentBytes: 16 * 1024 * 1024
  });
  try {
    let rejected = false;
    let previouslyJournaled = false;
    for (let step = 0; step < 60; step++) {
      const before = await ensemble.world.captureState();
      const encoder = device.createCommandEncoder();
      ensemble.encode(encoder);
      device.submit(encoder.finish());
      const diagnostics = await ensemble.world.readSimulationDiagnostics();
      if (!diagnostics.complete) {
        const after = await ensemble.world.captureState();
        for (const name of [
          'positions',
          'orientations',
          'velocities',
          'angular-velocities',
          'sleep',
          'manifolds',
          'targets'
        ]) {
          const previous = before.buffers.find(buffer => buffer.name === name)!.data;
          const current = after.buffers.find(buffer => buffer.name === name)!.data;
          if (name === 'manifolds')
            expect(current.slice(0, 64 * 416)).toEqual(previous.slice(0, 64 * 416));
          else if (name === 'targets') {
            // Header work counters and journal scratch describe the attempted step; ownership must roll back.
            const start = ensemble.world.count * 32 + 32;
            const end = start + (64 * 3 + 4 * 2) * 4;
            expect(current.slice(start, end)).toEqual(previous.slice(start, end));
          } else expect(current).toEqual(previous);
        }
        expect(diagnostics.incompleteQueries).toBeGreaterThan(0);
        rejected = true;
        break;
      }
      previouslyJournaled ||= (await ensemble.readWorkStatistics()).journaledContacts > 0;
    }
    expect(previouslyJournaled).toBe(true);
    expect(rejected).toBe(true);
  } finally {
    ensemble.destroy();
  }
});

it('keeps the journal within default binding limits at the previous contact-capacity ceiling', () => {
  const world = new GPURigidBodyWorld({
    ...template,
    solver: 'parallel',
    broadPhase: 'hierarchical-grid',
    failurePolicy: 'rollback',
    ensembleBodiesPerInstance: 1,
    collisionPartitionSize: 1,
    maximumPairs: 262144
  });
  const buffers = world.getCapacityInfo().buffers;
  expect(buffers.find(buffer => buffer.name === 'manifolds')!.byteLength).toBe(262144 * 416);
  expect(Math.max(...buffers.map(buffer => buffer.byteLength))).toBeLessThanOrEqual(
    128 * 1024 * 1024
  );
  world.destroy();
});
