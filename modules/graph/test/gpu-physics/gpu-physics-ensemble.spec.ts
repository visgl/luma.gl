// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUPhysicsEnsemble, type GPURigidBodyWorldProps} from '../../src/gpu-physics';

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
    expect(ensemble.getStats().checkpointBytes).toBe(0);
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
  } finally {
    ensemble.destroy();
  }
});
