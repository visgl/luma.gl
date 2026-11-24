// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {expect, it} from 'vitest';
import {GPUPhysicsEnsemble, type GPUPhysicsEnsembleProps} from '../../src/gpu-physics';

/** Each world has one touching pair and two probes that travel without contact. */
const fixture: GPUPhysicsEnsembleProps = {
  instances: 4,
  maximumPairs: 128,
  maximumPairsPerInstance: 2,
  maximumResidentBytes: 32 * 1024 * 1024,
  template: {
    gravity: [0, 0, 0],
    sleepAfter: 0,
    eventCapacity: 64,
    bodies: [-2, -1.5, 3, 5].map(position => ({
      position: [position, 0, 0],
      velocity: [0, 1, 0],
      shape: {type: 'sphere', radius: 0.35},
      restitution: 0
    }))
  }
};

it.for([true, false])(
  'rolls back one partition while siblings advance and publish events with compactContacts=%s',
  async (compactContacts, context) => {
    const device = await getWebGPUTestDevice();
    if (!device) return context.skip('WebGPU unavailable');
    const ensemble = await GPUPhysicsEnsemble.create(device, {
      ...fixture,
      template: {...fixture.template, compactContacts}
    });
    const {world} = ensemble;
    const subject = 2;
    const start = ensemble.getBodyIndex(subject, 0);
    /** Submit steps on the same compiled graph throughout recovery. */
    const step = (steps: number) => {
      const encoder = device.createCommandEncoder();
      ensemble.encode(encoder, steps);
      device.submit(encoder.finish());
    };
    try {
      const graph = ensemble.inspect().graph;
      const allocated = ensemble.getStats().residentBytes;
      world.setColliderShapes(
        [0, 1, 2, 3].map(collider => ({
          collider: ensemble.getColliderIndex(subject, collider),
          shape: {type: 'sphere', radius: 4}
        }))
      );
      const before = await world.readState();
      step(1);
      const rejected = await ensemble.readStatus();
      expect(rejected.instances[subject]).toMatchObject({
        enabled: true,
        failure: 'contact-cache-capacity',
        sharedFailure: false,
        acceptedSteps: 0,
        rejectedSteps: 1
      });
      expect(rejected.instances[0]).toMatchObject({
        acceptedSteps: 1,
        rejectedSteps: 0,
        failure: null
      });
      expect((await world.readState()).slice(start, start + 4)).toEqual(
        before.slice(start, start + 4)
      );
      const events = (await world.readContactEvents()).events;
      expect(events).not.toHaveLength(0);
      expect(
        events.every(event => event.bodies.every(body => Math.floor(body / 4) !== subject))
      ).toBe(true);
      /** A recovery snapshot includes committed contact history only. */
      const recoveredContacts = await world.resyncContactEvents();
      expect(recoveredContacts.contacts).not.toHaveLength(0);
      expect(
        recoveredContacts.contacts.every(contact =>
          contact.bodies.every(body => Math.floor(body / 4) !== subject)
        )
      ).toBe(true);
      expect((await world.readSimulationDiagnostics()).complete).toBe(true);

      ensemble.wake(subject);
      ensemble.setActive(subject, false);
      ensemble.setActive(subject, true);
      const heldStart = await world.readState();
      step(5);
      const held = await ensemble.readStatus();
      expect(held.instances[subject]).toMatchObject({active: false, rejectedSteps: 1});
      const advanced = await world.readState();
      expect(advanced.slice(start, start + 4)).toEqual(heldStart.slice(start, start + 4));
      expect(advanced[2].position[1]).toBeCloseTo(6 * world.timeStep, 5);

      await ensemble.reset(subject);
      expect(world.getColliderShape(ensemble.getColliderIndex(subject, 0))).toEqual({
        type: 'sphere',
        radius: 0.35
      });
      step(3);
      const recovered = await ensemble.readStatus();
      expect(recovered.instances[subject]).toMatchObject({
        acceptedSteps: 3,
        rejectedSteps: 0,
        failure: null
      });
      for (const [instance, status] of recovered.instances.entries())
        expect(status.acceptedSteps).toBe(instance === subject ? 3 : 9);
      expect((await world.readState())[start + 2].position[1]).toBeCloseTo(3 * world.timeStep, 5);
      expect(ensemble.inspect().graph).toBe(graph);
      expect(ensemble.getStats().residentBytes).toBe(allocated);
    } finally {
      ensemble.destroy();
    }
  },
  120000
);

it('retains the shared failure latch for shared broad-phase overflow', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    ...fixture,
    maximumPairs: 8,
    template: {
      ...fixture.template,
      bodies: fixture.template.bodies.map(body => ({...body, position: [0, 0, 0]}))
    }
  });
  try {
    const initial = await ensemble.world.readState();
    const encoder = device.createCommandEncoder();
    ensemble.encode(encoder);
    device.submit(encoder.finish());
    expect((await ensemble.world.readSimulationDiagnostics()).complete).toBe(false);
    expect((await ensemble.readStatus()).instances.every(instance => instance.sharedFailure)).toBe(
      true
    );
    expect(await ensemble.world.readState()).toEqual(initial);
    await expect(ensemble.reset(1)).rejects.toThrow('shared ensemble failure');
  } finally {
    ensemble.destroy();
  }
}, 120000);

it('rejects local budgets that are not power-of-two ranges within the shared table', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  for (const maximumPairsPerInstance of [0, 3, 64]) {
    await expect(
      GPUPhysicsEnsemble.create(device, {
        ...fixture,
        maximumPairsPerInstance
      })
    ).rejects.toThrow('instance contact capacity');
  }
});
