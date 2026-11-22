// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPURigidBodyWorld, type GPURigidBody} from '@luma.gl/graph/gpu-physics';
import type {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';

/** Produce one contact and one swept trigger crossing in each isolated cell. */
export async function runEventBurst(
  device: Device,
  groups: number,
  eventCapacity: number,
  diagnostics?: GPUGraphDiagnostics
) {
  if (
    !Number.isInteger(groups) ||
    groups < 1 ||
    groups > 2048 ||
    !Number.isInteger(eventCapacity) ||
    eventCapacity < 1 ||
    eventCapacity > 4096
  )
    throw new Error('Invalid event burst dimensions');

  /** Lay out independent cells so events scale with authored groups, not overlapping cells. */
  const columns = Math.ceil(Math.sqrt(groups));
  /** All authored geometry uses the same radius. */
  const shape = {type: 'sphere', radius: 0.5} as const;
  /** A dynamic sphere crosses each sensor while another overlaps a static neighbor. */
  const bodies: GPURigidBody[] = Array.from({length: groups}, (_, index): GPURigidBody[] => {
    /** Horizontal location of the cell. */
    const east = (index % columns) * 16;
    /** Vertical location of the cell. */
    const north = Math.floor(index / columns) * 6;
    return [
      {position: [east, north, 0], mass: 0, colliders: [{shape, isTrigger: true}]},
      {position: [east - 2, north, 0], shape, velocity: [480, 0, 0]},
      {position: [east + 8, north, 0], shape, mass: 0},
      {position: [east + 8.9, north, 0], shape}
    ];
  }).flat();
  /** The two event rings use the same deliberately bounded retention budget. */
  const world = new GPURigidBodyWorld({
    bodies,
    solver: 'parallel',
    broadPhase: 'hierarchical-grid',
    failurePolicy: 'rollback',
    maximumPairs: 2 ** Math.ceil(Math.log2(Math.max(64, groups * 8))),
    eventCapacity,
    triggerEventCapacity: eventCapacity,
    gravity: [0, 0, 0],
    timeStep: 1 / 120,
    triggers: Array.from({length: groups}, (_, index) => ({
      colliders: [index * 4],
      targets: [index * 4 + 1],
      swept: true
    }))
  });
  try {
    /** Exclude pipeline compilation from the submission timing. */
    const definition = new GPUCommandGraph(device, {id: 'event-burst'});
    world.addToGraph(definition);
    /** One submission exercises both publishers on the same simulation step. */
    const graph = await definition.compileAsync();
    try {
      /** Measure from host encoding to GPU completion, before event readback. */
      const start = performance.now();
      /** The panel records publication nodes and available GPU timestamps. */
      const encoder = device.createCommandEncoder();
      if (diagnostics) diagnostics.encode(graph, encoder, {parameters: undefined});
      else graph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      /** Fence completion excludes the subsequent validation readbacks. */
      const fence = device.createFence();
      try {
        await fence.signaled;
      } finally {
        fence.destroy();
      }
      /** Host turnaround includes the full physics step. */
      const stepMilliseconds = performance.now() - start;
      /** No pose download is needed to validate this fixture. */
      const [contacts, triggers, state] = await Promise.all([
        world.readContactEvents(),
        world.readTriggerEvents(),
        world.readSimulationDiagnostics()
      ]);
      /** A bounded ring retains a contiguous suffix of sequence numbers. */
      const isRetainedSuffix = (ring: typeof contacts | typeof triggers, expected: number) =>
        ring.step === 1 &&
        ring.sequence === expected &&
        !ring.saturated &&
        ring.dropped === Math.max(0, expected - eventCapacity) &&
        ring.events.length === expected - ring.dropped &&
        ring.events.every((event, index) => event.sequence === ring.dropped + index + 1);
      /** Sparse pair slots can choose a different order between adapters. Check their identities. */
      const validContacts =
        contacts.events.every(
          event =>
            event.phase === 'begin' &&
            event.colliders[0] % 4 === 2 &&
            event.colliders[1] === event.colliders[0] + 1
        ) &&
        new Set(contacts.events.map(event => event.colliders[0])).size === contacts.events.length;
      /** Trigger slots have a known authored order and two ordered transitions each. */
      const validTriggers = triggers.events.every(event => {
        /** The first retained event may be the exit of a crossing. */
        const offset = event.sequence - 1;
        return (
          event.swept &&
          event.trigger === Math.floor(offset / 2) &&
          event.phase === (offset % 2 ? 'exit' : 'enter')
        );
      });

      return {
        groups,
        eventCapacity,
        stepMilliseconds,
        complete: state.complete,
        matchesExpected:
          state.complete &&
          isRetainedSuffix(contacts, groups) &&
          isRetainedSuffix(triggers, groups * 2) &&
          validContacts &&
          validTriggers,
        contacts,
        triggers
      };
    } finally {
      graph.destroy();
    }
  } finally {
    world.destroy();
  }
}
