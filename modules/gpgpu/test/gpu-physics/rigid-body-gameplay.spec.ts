// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld} from '../../src/gpu-physics';

it('queries exact sphere and rotated box shapes with selection, exclusion and bounded output', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU is unavailable');
  const world = new GPURigidBodyWorld({
    enableQueries: true,
    gravity: [0, 0, 0],
    bodies: [
      {position: [2, 0, 0], colliders: [{position: [1, 0, 0], shape: {type: 'sphere', radius: 1}}]},
      {
        position: [7, 0, 0],
        orientation: [0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)],
        shape: {type: 'box', halfExtents: [1, 1, 1]}
      },
      {position: [0, 4, 0], shape: {type: 'sphere', radius: 1}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const nearest = await world.raycast({
      origin: [0, 0, 0],
      direction: [2, 0, 0],
      maximumDistance: 10
    });
    expect(nearest.hits[0].body).toBe(0);
    expect(nearest.hits[0].distance).toBeCloseTo(2, 4);
    const box = await world.raycast({
      origin: [0, 0, 0],
      direction: [1, 0, 0],
      maximumDistance: 10,
      excludeBody: 0
    });
    expect(box.hits[0].body).toBe(1);
    expect(box.hits[0].distance).toBeCloseTo(7 - Math.SQRT2, 4);
    expect(
      (await world.raycast({origin: [3, 0, 0], direction: [1, 0, 0], maximumDistance: 1})).hits[0]
        .distance
    ).toBe(0);
    const overlap = await world.overlapSphere({center: [3, 0, 0], radius: 5, maximumHits: 1});
    expect(overlap.hits).toHaveLength(1);
    expect(overlap.totalHits).toBe(3);
    expect(overlap.truncated).toBe(true);
    expect(
      (await world.overlapSphere({center: [3, 0, 0], radius: 5, colliderIndices: [2]})).hits[0].body
    ).toBe(2);
    expect(
      (await world.raycast({origin: [0, 0, 0], direction: [-1, 0, 0], maximumDistance: 10})).hits
    ).toEqual([]);
  } finally {
    graph.destroy();
    world.destroy();
  }
});
it.for([
  'ordered',
  'parallel'
] as const)('emits bounded contact begin/end events with impulses for %s', async (solver, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU is unavailable');
  const world = new GPURigidBodyWorld({
    solver,
    broadPhase: 'hierarchical-grid',
    eventCapacity: 2,
    impactImpulseThreshold: 100,
    gravity: [0, 0, 0],
    sleepAfter: 0,
    bodies: [
      {
        position: [-0.49, 0, 0],
        velocity: [1, 0, 0],
        shape: {type: 'sphere', radius: 0.5},
        restitution: 1
      },
      {
        position: [0.49, 0, 0],
        velocity: [-1, 0, 0],
        shape: {type: 'sphere', radius: 0.5},
        restitution: 1
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const step = async (count: number) => {
    const encoder = device.createCommandEncoder();
    for (let index = 0; index < count; index++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    await world.readState();
  };
  try {
    await step(1);
    const begin = await world.readContactEvents();
    expect(begin.events).toHaveLength(1);
    expect(begin.events[0]).toMatchObject({
      phase: 'begin',
      bodies: [0, 1],
      colliders: [0, 1],
      step: 1
    });
    expect(begin.events[0].normalImpulse).toBeGreaterThan(0.5);
    expect((await world.readContactEvents()).events).toEqual([]);
    await step(20);
    const end = await world.readContactEvents();
    expect(end.events.some(event => event.phase === 'end')).toBe(true);
    expect(end.saturated).toBe(false);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('reports overwritten contact events instead of silently losing them', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU is unavailable');
  const world = new GPURigidBodyWorld({
    eventCapacity: 1,
    impactImpulseThreshold: 100,
    gravity: [0, 0, 0],
    bodies: [
      {
        position: [-0.49, 0, 0],
        velocity: [1, 0, 0],
        shape: {type: 'sphere', radius: 0.5},
        restitution: 1
      },
      {
        position: [0.49, 0, 0],
        velocity: [-1, 0, 0],
        shape: {type: 'sphere', radius: 0.5},
        restitution: 1
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 30; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const events = await world.readContactEvents();
    expect(events.dropped).toBe(1);
    expect(events.events).toHaveLength(1);
    expect(events.events[0].phase).toBe('end');
    expect((await world.readContactEvents()).events).toEqual([]);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('does not expose the private storage collider in a geometry-free world', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU is unavailable');
  const world = new GPURigidBodyWorld({
    enableQueries: true,
    bodies: [{position: [0, 0, 0], colliders: []}]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  try {
    expect(world.colliderCount).toBe(0);
    expect(
      await world.raycast({origin: [-1, 0, 0], direction: [1, 0, 0], maximumDistance: 2})
    ).toEqual({hits: [], totalHits: 0, truncated: false});
    expect(await world.overlapSphere({center: [0, 0, 0], radius: 2})).toEqual({
      hits: [],
      totalHits: 0,
      truncated: false
    });
    await expect(
      world.raycast({
        origin: [0, 0, 0],
        direction: [1, 0, 0],
        maximumDistance: 2,
        colliderIndices: [0]
      })
    ).rejects.toThrow('Invalid query collider');
  } finally {
    world.destroy();
  }
});
