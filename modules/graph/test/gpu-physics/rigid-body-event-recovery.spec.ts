// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import type {Device} from '@luma.gl/core';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, type GPURigidBodyWorldProps} from '../../src/gpu-physics';

/** Build the production graph and expose an unfenced step submission. */
async function startWorld(device: Device, options: GPURigidBodyWorldProps) {
  /** Tests submit consecutive steps without waiting for CPU readback. */
  const world = new GPURigidBodyWorld(options);
  /** Both history and ring updates come through this compiled graph. */
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  /** Keep the graph alive until all readbacks settle. */
  const graph = await definition.compileAsync();
  return {
    world,
    step() {
      /** Submit this step ahead of or behind a snapshot in normal queue order. */
      const encoder = device.createCommandEncoder();
      graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
    },
    destroy() {
      graph.destroy();
      world.destroy();
    }
  };
}

it('restores all active contact pairs after overflow and resumes from that exact cursor', async context => {
  /** Use the ordinary core storage limits. */
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  /** Three islands overflow a one-event contact ring. */
  const shape = {type: 'sphere', radius: 0.5} as const;
  /** All-pairs slot ordering makes the recovered set directly comparable. */
  const fixture = await startWorld(device, {
    eventCapacity: 1,
    gravity: [0, 0, 0],
    impactImpulseThreshold: 1e6,
    bodies: [
      {position: [0, 0, 0], mass: 0, shape},
      {position: [0.9, 0, 0], shape},
      {position: [0, 4, 0], mass: 0, shape},
      {position: [0.9, 4, 0], shape},
      {position: [0, 8, 0], mass: 0, shape},
      {position: [0.9, 8, 0], shape}
    ]
  });
  try {
    /** Queue a normal read, then recover the state at the same step. */
    fixture.step();
    const delta = fixture.world.readContactEvents();
    const recovery = fixture.world.resyncContactEvents();
    expect(fixture.world.resyncContactEvents()).toBe(recovery);
    fixture.world.setColliderTransform(1, [4, 0, 0], [0, 0, 0, 1]);
    fixture.step();
    /** A read made during resync resumes from the recovered cursor. */
    const afterwards = fixture.world.readContactEvents();
    expect(fixture.world.readContactEvents()).toBe(afterwards);
    fixture.step();
    expect(await delta).toMatchObject({sequence: 3, step: 1, dropped: 2});
    expect(await recovery).toEqual({
      sequence: 3,
      step: 1,
      saturated: false,
      contacts: [
        {bodies: [0, 1], colliders: [0, 1]},
        {bodies: [2, 3], colliders: [2, 3]},
        {bodies: [4, 5], colliders: [4, 5]}
      ]
    });
    expect(await afterwards).toMatchObject({
      sequence: 4,
      step: 2,
      dropped: 0,
      events: [{phase: 'end', colliders: [0, 1]}]
    });
  } finally {
    fixture.destroy();
  }
}, 120000);

it('recovers compound overlaps and excludes completed swept crossings', async context => {
  /** A swept crossing contributes two records and leaves no active overlap. */
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  /** A compound trigger has two sensors, and another sensor receives a complete crossing. */
  const shape = {type: 'sphere', radius: 0.5} as const;
  /** Two standing overlaps plus one swept crossing overflow the trigger ring. */
  const fixture = await startWorld(device, {
    failurePolicy: 'rollback',
    gravity: [0, 0, 0],
    timeStep: 1 / 120,
    triggerEventCapacity: 1,
    bodies: [
      {
        position: [0, 0, 0],
        mass: 0,
        colliders: [
          {shape, isTrigger: true},
          {shape, isTrigger: true, position: [4, 0, 0]}
        ]
      },
      {position: [0, 0, 0], mass: 0, shape},
      {position: [4, 0, 0], mass: 0, shape},
      {position: [0, 8, 0], mass: 0, colliders: [{shape, isTrigger: true}]},
      {position: [-2, 8, 0], shape, velocity: [480, 0, 0]}
    ],
    triggers: [
      {colliders: [0, 1], targets: [2, 3]},
      {colliders: [4], targets: [5], swept: true}
    ]
  });
  try {
    /** Before the first published step, the active history is empty. */
    expect(await fixture.world.resyncTriggerEvents()).toEqual({
      sequence: 0,
      step: 0,
      saturated: false,
      overlaps: []
    });
    fixture.step();
    expect(await fixture.world.readTriggerEvents()).toMatchObject({
      sequence: 4,
      dropped: 3,
      events: [{phase: 'exit', swept: true}]
    });
    /** Starting a recovery read also marks the cursor as busy for checkpoint restore. */
    const checkpoint = fixture.world.createGPUCheckpoint();
    checkpoint.save();
    const recovery = fixture.world.resyncTriggerEvents();
    expect(fixture.world.resyncTriggerEvents()).toBe(recovery);
    expect(() => checkpoint.restore()).toThrow('idle live world');
    fixture.world.setColliderTransform(2, [0, 5, 0], [0, 0, 0, 1]);
    fixture.step();
    /** Register the restore attempt ahead of the delta's recovery continuation. */
    const remainsBusy = recovery.then(() =>
      expect(() => checkpoint.restore()).toThrow('idle live world')
    );
    /** Queue the delta's GPU copy before another step can advance the ring header. */
    const next = fixture.world.readTriggerEvents();
    expect(fixture.world.readTriggerEvents()).toBe(next);
    fixture.step();
    await remainsBusy;
    expect(await recovery).toEqual({
      sequence: 4,
      step: 1,
      saturated: false,
      overlaps: [
        {trigger: 0, body: 1, collider: 2, triggerCollider: 0},
        {trigger: 0, body: 2, collider: 3, triggerCollider: 1}
      ]
    });
    expect(await next).toMatchObject({
      sequence: 5,
      step: 2,
      dropped: 0,
      events: [{phase: 'exit', swept: false, collider: 2}]
    });
    checkpoint.restore();
    checkpoint.destroy();
    expect(await fixture.world.resyncTriggerEvents()).toMatchObject({sequence: 4, step: 1});
  } finally {
    fixture.destroy();
  }
}, 120000);
