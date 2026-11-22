// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, type GPURigidBody} from '../../src/gpu-physics';
import {addRigidBodyEventCompaction} from '../../src/gpu-physics/rigid-body-event-compaction';

/** Synthetic records qualify the shared publisher independently of collision fixtures. */
function makeRing(device: Device, rows: number, capacity: number) {
  /** Caller-owned storage mirrors the normal four-word ring header. */
  const ring = device.createBuffer({
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    byteLength: 16 + 16 * capacity
  });
  /** Input starts with a commit flag and contains up to two records per row. */
  const input = device.createBuffer({
    usage: Buffer.STORAGE | Buffer.COPY_DST,
    byteLength: (rows + 1) * 4
  });
  /** The graph owns temporary compaction storage. */
  const definition = new GPUCommandGraph(device);
  /** Import both buffers under their shader names. */
  const ringBinding = {
    name: 'ring',
    location: 0,
    resource: definition.importBuffer(
      {id: 'ring', usage: Buffer.STORAGE, byteLength: ring.byteLength},
      ring
    )
  };
  /** Publication observes a coherent commit decision from the same input. */
  const inputBinding = {
    name: 'inputFlags',
    location: 1,
    readOnly: true,
    resource: definition.importBuffer(
      {id: 'input', usage: Buffer.STORAGE, byteLength: input.byteLength},
      input
    )
  };
  addRigidBodyEventCompaction(definition, {
    id: 'test-events',
    rowCount: rows,
    capacity,
    ring: 'ring',
    source: /* wgsl */ `
struct Ring { sequence:u32, step:u32, saturated:u32, reserved:u32, entries:array<vec4u,${capacity}> }
@group(0) @binding(0) var<storage,read_write> ring:Ring;
@group(0) @binding(1) var<storage,read> inputFlags:array<u32>;
fn eventCommit()->bool{return inputFlags[0]!=0u;}
fn eventClassify(row:u32)->u32{return inputFlags[row+1u];}
fn eventCount(flags:u32)->u32{return flags;}
fn eventPublish(row:u32,flags:u32,offset:u32,reservation:vec3u){
 for(var record=0u;record<flags;record++){
  let sequence=retainedEventSequence(reservation,offset+record);
  if(sequence!=0u){ring.entries[(sequence-1u)%${capacity}u]=vec4u(sequence,row,record,reservation.z);}
 }
}`,
    classify: [inputBinding],
    commit: [ringBinding, inputBinding],
    publish: [ringBinding]
  });
  /** Build the same compute graph used by the rigid-body world. */
  const graph = definition.compile();
  return {
    graph,
    ring,
    input,
    destroy() {
      graph.destroy();
      ring.destroy();
      input.destroy();
    }
  };
}

/** Run a step and read the ordered ring values without assuming their physical slot order. */
async function recordStep(device: Device, fixture: ReturnType<typeof makeRing>) {
  /** Submit before the compact ring readback. */
  const encoder = device.createCommandEncoder();
  fixture.graph.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  /** Output words retain exact u32 sequence values. */
  const bytes = await fixture.ring.readAsync();
  return new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

it.for([
  64, 143
])('preserves stable event order, overflow and saturation across %i slots', async (rows, context) => {
  /** Exercise WebGPU's default storage binding budget. */
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  /** Small rings wrap multiple times within a single step. */
  const capacity = 7;
  /** Include empty slots and two-event slots within each GPU tile. */
  const counts = Array.from({length: rows}, (_, row) => row % 3);
  /** Reference records use consecutive stable row order. */
  const expected = counts.flatMap((count, row) =>
    Array.from({length: count}, (_, record) => [row, record])
  );
  /** A fused ring has no graph scratch. Large rings keep their scratch in the compiled graph. */
  const fixture = makeRing(device, rows, capacity);
  try {
    expect(fixture.graph.stats.physicalTransientResourceBytes > 0).toBe(rows > 64);
    fixture.input.write(Uint32Array.from([1, ...counts]));
    /** Compare every retained record after several wraps. */
    const first = await recordStep(device, fixture);
    expect([...first.slice(0, 3)]).toEqual([expected.length, 1, 0]);
    for (let offset = expected.length - capacity; offset < expected.length; offset++) {
      /** Ring addresses are based on the old sequence plus the stable row prefix. */
      const word = 4 + (offset % capacity) * 4;
      expect([...first.slice(word, word + 4)]).toEqual([offset + 1, ...expected[offset], 1]);
    }
    fixture.input.write(Uint32Array.of(0));
    expect(await recordStep(device, fixture)).toEqual(first);

    /** Saturating sequence arithmetic retains the very last two representable records. */
    const lastSequence = 0xffffffff;
    fixture.input.write(Uint32Array.of(1));
    fixture.ring.write(Uint32Array.of(lastSequence - 2, 10, 0, 0));
    const saturated = await recordStep(device, fixture);
    expect([...saturated.slice(0, 3)]).toEqual([lastSequence, 11, 1]);
    for (let offset = 0; offset < 2; offset++) {
      /** At maximum sequence the final slot remains addressable without wrapping to zero. */
      const word = 4 + ((lastSequence - 2 + offset) % capacity) * 4;
      expect([...saturated.slice(word, word + 4)]).toEqual([
        lastSequence - 1 + offset,
        ...expected[offset],
        11
      ]);
    }

    /** Step saturation also leaves the current sequence and payloads untouched. */
    fixture.ring.write(Uint32Array.of(13, lastSequence, 0, 0));
    expect([...(await recordStep(device, fixture)).slice(0, 3)]).toEqual([13, lastSequence, 1]);
  } finally {
    fixture.destroy();
  }
});

it('publishes a bounded burst of contacts from distinct pair tiles', async context => {
  /** Select a deterministic all-pairs slot order. */
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  /** Spaced pairs make each beginning contact independent. */
  const pairCount = 24;
  /** Each dynamic sphere overlaps only its own static sphere. */
  const bodies: GPURigidBody[] = Array.from({length: pairCount}, (_, index): GPURigidBody[] => [
    {position: [0, index * 4, 0], mass: 0, shape: {type: 'sphere', radius: 0.5}},
    {position: [0.9, index * 4, 0], shape: {type: 'sphere', radius: 0.5}}
  ]).flat();
  /** Force the publication to retain just the tail of the burst. */
  const capacity = 7;
  /** All-pairs registration determines the event ordering. */
  const world = new GPURigidBodyWorld({
    bodies,
    broadPhase: 'all-pairs',
    gravity: [0, 0, 0],
    eventCapacity: capacity
  });
  /** Build the normal world graph. */
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  /** The tail should survive even when input slots exceed one tile. */
  const graph = await definition.compileAsync();
  try {
    /** One accepted step creates all begin transitions. */
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const batch = await world.readContactEvents();
    expect(batch).toMatchObject({sequence: pairCount, step: 1, dropped: pairCount - capacity});
    expect(batch.events.map(event => [event.phase, ...event.colliders])).toEqual(
      Array.from({length: capacity}, (_, index) => {
        const collider = (pairCount - capacity + index) * 2;
        return ['begin', collider, collider + 1];
      })
    );
  } finally {
    graph.destroy();
    world.destroy();
  }
}, 120000);

it('keeps swept trigger enter and exit order when a burst crosses publication tiles', async context => {
  /** The ordinary sparse solver handles this many independent sensor groups. */
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  /** A partial last tile also tests padded publication rows. */
  const groups = 70;
  /** Static spheres act as sensors for a row of fast crossing spheres. */
  const bodies: GPURigidBody[] = Array.from({length: groups}, (_, index): GPURigidBody[] => [
    {
      position: [0, index * 4, 0],
      mass: 0,
      colliders: [{isTrigger: true, shape: {type: 'sphere', radius: 0.5}}]
    },
    {position: [-2, index * 4, 0], velocity: [480, 0, 0], shape: {type: 'sphere', radius: 0.5}}
  ]).flat();
  /** An odd capacity truncates the tail in the middle of a two-record transition. */
  const capacity = 17;
  /** Use fixed-step rollback and analytic sphere crossings. */
  const world = new GPURigidBodyWorld({
    bodies,
    broadPhase: 'hierarchical-grid',
    maximumPairs: 512,
    failurePolicy: 'rollback',
    gravity: [0, 0, 0],
    timeStep: 1 / 120,
    triggerEventCapacity: capacity,
    triggers: Array.from({length: groups}, (_, index) => ({
      colliders: [index * 2],
      targets: [index * 2 + 1],
      swept: true
    }))
  });
  /** Compile and submit through the production graph. */
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    /** Both records count even when one is overwritten before readback. */
    const batch = await world.readTriggerEvents();
    expect(batch).toMatchObject({sequence: groups * 2, step: 1, dropped: groups * 2 - capacity});
    expect(batch.events.map(event => [event.trigger, event.phase, event.swept])).toEqual(
      Array.from({length: capacity}, (_, index) => {
        const offset = groups * 2 - capacity + index;
        return [Math.floor(offset / 2), offset % 2 ? 'exit' : 'enter', true];
      })
    );
  } finally {
    graph.destroy();
    world.destroy();
  }
}, 120000);
