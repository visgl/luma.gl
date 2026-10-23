// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld, ScenegraphPhysicsBehaviors} from '../../src/gpu-physics';
import {GroupNode, Interactivity} from '@luma.gl/engine';

it('emits box sensor transitions without collision response', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    timeStep: 1 / 60,
    failurePolicy: 'rollback',
    bodies: [
      {
        mode: 'static',
        position: [0, 0, 0],
        colliders: [{isTrigger: true, shape: {type: 'box', halfExtents: [1, 1, 1]}}]
      },
      {position: [-2, 0.1, 0.2], velocity: [2, 0, 0], shape: {type: 'sphere', radius: 0.2}}
    ],
    triggers: [{colliders: [0]}]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 120; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
    expect((await world.readTriggerEvents()).events.map(event => event.phase)).toEqual([
      'enter',
      'exit'
    ]);
    const state = (await world.readState())[1];
    expect(state.position[0]).toBeCloseTo(2, 3);
    expect(state.velocity[0]).toBeCloseTo(2, 3);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('preserves independent collider identities when one compound body crosses a trigger', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    timeStep: 1 / 60,
    failurePolicy: 'rollback',
    bodies: [
      {
        mode: 'static',
        position: [0, 0, 0],
        colliders: [{isTrigger: true, shape: {type: 'sphere', radius: 0.5}}]
      },
      {
        position: [-3, 0, 0],
        velocity: [3, 0, 0],
        colliders: [-1, 1].map(offset => ({
          position: [offset, 0, 0] as [number, number, number],
          shape: {type: 'sphere' as const, radius: 0.2}
        }))
      }
    ],
    triggers: [{colliders: [0], perCollider: true}]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 120; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await world.readSimulationDiagnostics()).toMatchObject({complete: true});
    expect((await world.readState())[1].position[0]).toBeCloseTo(3, 3);
    const batch = await world.readTriggerEvents();
    expect(batch.dropped).toBe(0);
    expect(batch.events).toHaveLength(4);
    for (const collider of [1, 2])
      expect(
        batch.events.filter(event => event.collider === collider).map(event => event.phase)
      ).toEqual(['enter', 'exit']);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('resolves a real GPU ray hit to a child collider and applies its behavior impulse to the owning body', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const colliderNode = new GroupNode({id: 'collider'});
  const bodyNode = new GroupNode({id: 'body', children: [colliderNode]});
  const world = new GPURigidBodyWorld({
    enableQueries: true,
    gravity: [0, 0, 0],
    bodies: [{position: [0, 0, 0], mass: 1, shape: {type: 'sphere', radius: 0.5}}]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const physics = new ScenegraphPhysicsBehaviors(world, {
    roots: [bodyNode],
    nodes: new Map([
      [4, bodyNode],
      [7, colliderNode]
    ]),
    bodyNodes: new Map([[bodyNode, 0]]),
    colliderNodes: [colliderNode],
    triggerNodes: []
  });
  const behavior = new Interactivity(
    {
      graphs: [
        {
          declarations: [
            {op: 'event/onStart'},
            {op: 'rigid_body/rayCast', extension: 'KHR_physics_rigid_bodies'},
            {op: 'rigid_body/applyPointImpulse', extension: 'KHR_physics_rigid_bodies'}
          ],
          nodes: [
            {declaration: 0, flows: {out: {node: 1}}},
            {
              declaration: 1,
              values: {rayStart: {value: [-2, 0, 0]}, rayEnd: {value: [2, 0, 0]}},
              flows: {hit: {node: 2}}
            },
            {
              declaration: 2,
              values: {
                nodeIndex: {node: 1, socket: 'hitNodeIndex'},
                impulse: {value: [1, 0, 0]},
                position: {value: [0, 0.5, 0]}
              }
            }
          ]
        }
      ]
    },
    {physics}
  );
  try {
    behavior.start();
    await behavior.flushPhysics();
    const state = (await world.readState())[0];
    expect(state.velocity[0]).toBeCloseTo(1, 4);
    expect(state.angularVelocity[2]).toBeCloseTo(-5, 4);
  } finally {
    graph.destroy();
    world.destroy();
  }
});
