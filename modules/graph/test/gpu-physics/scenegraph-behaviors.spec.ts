// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils/device';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld} from '../../src/gpu-physics';
import {ScenegraphPhysicsBehaviors} from '@luma.gl/engine/physics';
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

it('qualifies bounded filtered behavior segments and snapshots queued ray inputs', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const nodes = [new GroupNode(), new GroupNode()];
  const world = new GPURigidBodyWorld({
    enableQueries: true,
    gravity: [0, 0, 0],
    bodies: [0, 4].map(position => ({
      position: [position, 0, 0] as [number, number, number],
      mode: 'static' as const,
      shape: {type: 'sphere' as const, radius: 1}
    }))
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const physics = new ScenegraphPhysicsBehaviors(world, {
    roots: nodes,
    nodes: new Map([
      [10, nodes[0]],
      [20, nodes[1]]
    ]),
    bodyNodes: new Map([
      [nodes[0], 0],
      [nodes[1], 1]
    ]),
    colliderNodes: nodes,
    triggerNodes: [],
    querySelections: [[1], []]
  });
  try {
    const origin = [-3, 0, 0];
    const end = [7, 0, 0];
    const first = physics.rayCast(origin, end, -1);
    const second = physics.rayCast(origin, end, 0);
    origin[1] = 100;
    end[1] = 100;
    expect(await first).toMatchObject({node: 10, fraction: 0.2, normal: [-1, 0, 0]});
    expect((await second)!.fraction).toBeCloseTo(0.6, 5);
    expect((await second)!.node).toBe(20);
    expect(await physics.rayCast([-3, 0, 0], [-2, 0, 0], -1)).toBeNull();
    expect(await physics.rayCast([-3, 0, 0], [7, 0, 0], 1)).toBeNull();
    expect(await physics.rayCast([0, 0, 0], [0, 0, 0], -1)).toBeNull();
    await expect(physics.rayCast([NaN, 0, 0], [1, 0, 0], -1)).rejects.toThrow();
    await expect(physics.rayCast([0, 0, 0], [1, 0, 0], 3)).rejects.toThrow();
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('qualifies behavior point impulses against COM and inertia and rejects partial operations', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const node = new GroupNode();
  const child = new GroupNode();
  node.add(child);
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    bodies: [
      {
        position: [2, 0, 0],
        centerOfMass: [1, 0, 0],
        mass: 2,
        inertiaDiagonal: [2, 3, 4],
        shape: {type: 'sphere', radius: 0.5}
      }
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const physics = new ScenegraphPhysicsBehaviors(world, {
    roots: [node],
    nodes: new Map([
      [0, node],
      [1, child]
    ]),
    bodyNodes: new Map([[node, 0]]),
    colliderNodes: [child],
    triggerNodes: []
  });
  try {
    // COM is (3,0,0); lever arm (0,1,0) crossed with impulse (2,0,0) is (0,0,-2).
    physics.applyPointImpulse(1, [2, 0, 0], [3, 1, 0]);
    expect((await world.readState())[0]).toMatchObject({
      velocity: [1, 0, 0],
      angularVelocity: [0, 0, -0.5]
    });
    const before = await world.readState();
    expect(() => physics.applyImpulse(0, [2, 0, 0], [NaN, 0, 0])).toThrow();
    expect(await world.readState()).toEqual(before);
    physics.applyImpulse(0, [0, 4, 0], [0, 3, 0]);
    expect((await world.readState())[0]).toMatchObject({
      velocity: [1, 2, 0],
      angularVelocity: [0, 1, -0.5]
    });
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('delivers GPU trigger transitions through authored graphs with collider and motion identities', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const sensor = new GroupNode();
  const collider = new GroupNode();
  const body = new GroupNode({children: [collider]});
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    timeStep: 0.1,
    failurePolicy: 'rollback',
    triggers: [{colliders: [0], targets: [1], perCollider: true, swept: true}],
    bodies: [
      {
        mode: 'static',
        position: [0, 0, 0],
        colliders: [{isTrigger: true, shape: {type: 'sphere', radius: 1}}]
      },
      {position: [-5, 0, 0], velocity: [100, 0, 0], shape: {type: 'sphere', radius: 0.2}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const physics = new ScenegraphPhysicsBehaviors(world, {
    roots: [sensor, body],
    nodes: new Map([
      [2, sensor],
      [7, body],
      [9, collider]
    ]),
    bodyNodes: new Map([
      [sensor, 0],
      [body, 1]
    ]),
    colliderNodes: [sensor, collider],
    triggerNodes: [sensor]
  });
  const events: unknown[] = [];
  const behavior = new Interactivity(
    {
      graphs: [
        {
          types: [{signature: 'int'}],
          events: [
            {id: 'entered', values: {collider: {type: 0}, motion: {type: 0}}},
            {id: 'exited', values: {collider: {type: 0}, motion: {type: 0}}}
          ],
          declarations: [
            {op: 'event/rigid_body_triggerEntered', extension: 'KHR_physics_rigid_bodies'},
            {op: 'event/rigid_body_triggerExited', extension: 'KHR_physics_rigid_bodies'},
            {op: 'event/send'}
          ],
          nodes: [
            {declaration: 0, configuration: {nodeIndex: {value: [2]}}, flows: {out: {node: 2}}},
            {declaration: 1, configuration: {nodeIndex: {value: [2]}}, flows: {out: {node: 3}}},
            {
              declaration: 2,
              configuration: {event: {value: [0]}},
              values: {
                collider: {node: 0, socket: 'colliderNodeIndex'},
                motion: {node: 0, socket: 'motionNodeIndex'}
              }
            },
            {
              declaration: 2,
              configuration: {event: {value: [1]}},
              values: {
                collider: {node: 1, socket: 'colliderNodeIndex'},
                motion: {node: 1, socket: 'motionNodeIndex'}
              }
            }
          ]
        }
      ]
    },
    {physics, onEvent: (event, values) => events.push([event, values.collider, values.motion])}
  );
  try {
    behavior.start();
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    await physics.dispatchTriggers(behavior);
    expect(events).toEqual([
      ['entered', [9], [7]],
      ['exited', [9], [7]]
    ]);
    await physics.dispatchTriggers(behavior);
    expect(events).toHaveLength(2);
  } finally {
    graph.destroy();
    world.destroy();
  }
});
