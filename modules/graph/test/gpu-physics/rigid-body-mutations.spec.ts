// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils/device';
import {GPUCommandGraph} from '../../src/gpu-core';
import {GPURigidBodyWorld} from '../../src/gpu-physics';

it('updates mass, inertia and COM on GPU while preserving node pose and replay state', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    publishPoses: true,
    bodies: [{position: [2, 3, 4], mass: 1, shape: {type: 'sphere', radius: 0.2}}]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const step = async () => {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return (await world.readState())[0];
  };
  try {
    const capture = await world.captureState();
    world.setBodyParameters(0, {mass: 2, centerOfMass: [0.5, 0, 0], inertiaDiagonal: [4, 4, 4]});
    let state = await step();
    expect(state.position).toEqual([2.5, 3, 4]);
    const matrices = new Float32Array((await world.poseMatrices!.readAsync()).buffer);
    expect(Array.from(matrices.slice(12, 15))).toEqual([2, 3, 4]);
    world.applyImpulse(0, [2, 0, 0]);
    world.applyAngularImpulse(0, [0, 4, 0]);
    state = (await world.readState())[0];
    expect(state.velocity).toEqual([1, 0, 0]);
    expect(state.angularVelocity).toEqual([0, 1, 0]);
    world.restoreState(capture);
    world.applyImpulse(0, [2, 0, 0]);
    expect((await world.readState())[0].velocity).toEqual([2, 0, 0]);
    expect(world.getBodyMode(0)).toBe('dynamic');
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('switches motion modes and gravity without losing live velocity or accepting invalid edits', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, -10, 0],
    timeStep: 0.01,
    broadPhase: 'hierarchical-grid',
    bodies: [{position: [0, 0, 0], mode: 'kinematic', shape: {type: 'sphere', radius: 0.2}}]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const step = async () => {
    const encoder = device.createCommandEncoder();
    graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return (await world.readState())[0];
  };
  try {
    world.setKinematicTarget(0, [1, 0, 0], [0, 0, 0, 1]);
    await step();
    world.setBodyParameters(0, {mode: 'dynamic', velocity: [0, 0, 0], gravityFactor: 0.5});
    expect((await step()).velocity[1]).toBeCloseTo(-0.05, 5);
    expect(() => world.setBodyParameters(0, {mass: -1})).toThrow();
    expect((await step()).velocity[1]).toBeCloseTo(-0.1, 5);
    world.setBodyParameters(0, {mode: 'static'});
    expect((await step()).velocity).toEqual([0, 0, 0]);
    world.setBodyParameters(0, {mode: 'kinematic', velocity: [2, 0, 0]});
    const previous = (await world.readState())[0].position[0];
    expect((await step()).position[0]).toBeCloseTo(previous + 0.02, 5);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('changes restitution live and restores materials with the captured GPU state', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    restitutionThreshold: 0,
    timeStep: 1 / 120,
    bodies: [
      {
        position: [-1, 0, 0],
        velocity: [1, 0, 0],
        mass: 1,
        restitution: 0,
        shape: {type: 'sphere', radius: 0.25}
      },
      {position: [0, 0, 0], mode: 'static', restitution: 1, shape: {type: 'sphere', radius: 0.25}}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const advance = async () => {
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 100; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    return (await world.readState())[0];
  };
  try {
    const capture = await world.captureState();
    world.setColliderMaterial(0, {restitution: 1});
    expect((await advance()).velocity[0]).toBeLessThan(-0.9);
    world.restoreState(capture);
    expect(world.getColliderMaterial(0)).toEqual({});
    expect(Math.abs((await advance()).velocity[0])).toBeLessThan(0.1);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('keeps joint attachments in node space after changing the center of mass', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    publishPoses: true,
    bodies: [
      {mode: 'static', position: [0, 0, 0], colliders: []},
      {position: [0, 0, 0], shape: {type: 'sphere', radius: 0.2}}
    ],
    joints: [{type: 'fixed', first: 0, second: 1}]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    world.setBodyParameters(1, {centerOfMass: [0.5, 0.2, 0], inertiaDiagonal: [1, 1, 1]});
    world.applyImpulse(1, [0, 1, 0]);
    const encoder = device.createCommandEncoder();
    for (let step = 0; step < 120; step++) graph.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    const matrices = new Float32Array((await world.poseMatrices!.readAsync()).buffer);
    expect(Math.hypot(...matrices.slice(28, 31))).toBeLessThan(0.01);
    expect((await world.readSimulationDiagnostics()).complete).toBe(true);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('moves child collider frames independently and restores their query geometry', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    enableQueries: true,
    bodies: [
      {position: [0, 0, 0], colliders: [{shape: {type: 'box', halfExtents: [0.2, 0.2, 0.2]}}]}
    ]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const capture = await world.captureState();
    world.setColliderTransform(0, [2, 0, 0], [0, 0, 0, 1]);
    expect((await world.readState())[0].position).toEqual([0, 0, 0]);
    const ray = {origin: [2, 2, 0] as const, direction: [0, -1, 0] as const, maximumDistance: 4};
    expect((await world.raycast(ray)).hits).toHaveLength(1);
    world.restoreState(capture);
    expect((await world.raycast(ray)).hits).toHaveLength(0);
    world.setBodyParameters(0, {mass: 2});
    expect((await world.raycast({...ray, origin: [0, 2, 0]})).hits).toHaveLength(1);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('updates shared analytic geometry atomically with derived inertia and capture restoration', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    enableQueries: true,
    bodies: [0, 4].map(position => ({
      position: [position, 0, 0] as [number, number, number],
      mass: 2,
      shape: {type: 'sphere' as const, radius: 0.5}
    }))
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  try {
    const capture = await world.captureState();
    const before = await world.readState();
    world.setColliderShapes(
      [0, 1].map(collider => ({collider, shape: {type: 'sphere', radius: 1}}))
    );
    expect(await world.readState()).toEqual(before);
    expect(world.getBodyParameters(0).inertiaDiagonal).toEqual([0.8, 0.8, 0.8]);
    world.applyAngularImpulse(0, [0, 0.8, 0]);
    expect((await world.readState())[0].angularVelocity[1]).toBeCloseTo(1, 5);
    expect(() =>
      world.setColliderShapes([
        {collider: 0, shape: {type: 'sphere', radius: 2}},
        {collider: 1, shape: {type: 'sphere', radius: -1}}
      ])
    ).toThrow();
    expect(world.getColliderShape(0)).toEqual({type: 'sphere', radius: 1});
    expect(() =>
      world.setColliderShapes([{collider: 0, shape: {type: 'box', halfExtents: [1, 1, 1]}}])
    ).toThrow();
    world.restoreState(capture);
    expect(world.getColliderShape(0)).toEqual({type: 'sphere', radius: 0.5});
    expect(await world.readState()).toEqual(before);
    world.applyAngularImpulse(0, [0, 0.2, 0]);
    expect((await world.readState())[0].angularVelocity[1]).toBeCloseTo(1, 5);
  } finally {
    graph.destroy();
    world.destroy();
  }
});

it('scales animated analytic child colliders without moving their dynamic parent or accumulating scale', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const {GroupNode} = await import('@luma.gl/engine');
  const {ScenegraphPhysicsMotion} = await import('@luma.gl/engine/physics');
  const child = new GroupNode();
  const root = new GroupNode({children: [child]});
  const world = new GPURigidBodyWorld({
    gravity: [0, 0, 0],
    enableQueries: true,
    bodies: [{position: [0, 0, 0], mass: 1, shape: {type: 'sphere', radius: 0.5}}]
  });
  const definition = new GPUCommandGraph(device);
  world.addToGraph(definition);
  const graph = await definition.compileAsync();
  const motion = new ScenegraphPhysicsMotion(world, [root], new Map(), [
    {node: child, body: root, index: 0}
  ]);
  try {
    child.setMatrixComponents({scale: [2, 2, 2]});
    motion.update();
    expect(world.getColliderShape(0)).toEqual({type: 'sphere', radius: 1});
    motion.update();
    expect(world.getColliderShape(0)).toEqual({type: 'sphere', radius: 1});
    expect(world.getBodyMode(0)).toBe('dynamic');
    expect((await world.readState())[0].position).toEqual([0, 0, 0]);
    expect(
      (await world.raycast({origin: [-3, 0, 0], direction: [1, 0, 0], maximumDistance: 5})).hits[0]
        .distance
    ).toBeCloseTo(2, 5);
    child.setMatrixComponents({scale: [1, 2, 1]});
    expect(() => motion.update()).toThrow();
    expect(world.getColliderShape(0)).toEqual({type: 'sphere', radius: 1});
    child.setMatrixComponents({scale: [1, 1, 1]});
    motion.update();
    expect(world.getColliderShape(0)).toEqual({type: 'sphere', radius: 0.5});
  } finally {
    graph.destroy();
    world.destroy();
  }
});
