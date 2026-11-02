// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GroupNode, ScenegraphNode, CubeGeometry} from '@luma.gl/engine';
import {PhysicsController, PhysicsGeometryNode} from '@luma.gl/engine/physics';
import {GPURigidBodyWorld, rotateRigidBodyVector} from '@luma.gl/graph/gpu-physics';

it('controller encodes bounded fixed steps without pose readback and publishes node origins', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const node = new ScenegraphNode({id: 'ball'});
  const scene = new GroupNode([node]);
  const physics = new PhysicsController(device, {scene, gravity: [0, 0, 0], timeStep: 0.01});
  const ball = physics.addBody('/ball', {
    collider: {type: 'sphere', radius: 0.5},
    mass: 2,
    centerOfMass: [0, 0.25, 0],
    velocity: [1, 0, 0]
  });
  const reads = vi.spyOn(GPURigidBodyWorld.prototype, 'readState');
  try {
    await physics.prepare();
    expect(physics.update(0.005).steps).toBe(0);
    expect(physics.update(0.005).steps).toBe(1);
    const bounded = physics.update(0.2);
    expect(bounded.steps).toBe(4);
    expect(bounded.droppedTime).toBeCloseTo(0.16);
    expect(reads).not.toHaveBeenCalled();
    const pose = await ball.readPose();
    expect(pose.position[0]).toBeCloseTo(0.05, 4);
    expect(pose.position[1]).toBeCloseTo(0, 4);
    expect(node.position[0]).toBe(0);
    const matrices = new Float32Array((await physics.publication.matrices.readAsync()).buffer);
    expect(matrices[12]).toBeCloseTo(pose.position[0], 4);
    expect(matrices[13]).toBeCloseTo(0, 4);
    ball.applyImpulse([2, 0, 0]);
    physics.update(0.01);
    expect((await ball.readPose()).position[0]).toBeCloseTo(0.07, 4);
    const revision = physics.revision;
    const matricesBeforeReset = physics.publication.matrices;
    const reset = physics.reset();
    expect(() => physics.update(0.01)).toThrow();
    await reset;
    expect(physics.revision).toBeGreaterThan(revision);
    expect(physics.publication.matrices).not.toBe(matricesBeforeReset);
    expect((await ball.readPose()).position[0]).toBeCloseTo(0, 4);
    const read = ball.readPose();
    expect(() => physics.update(0.01)).toThrow();
    await read;
    const pendingRead = ball.readPose();
    const destruction = physics.destroy();
    expect(physics.destroy()).toBe(destruction);
    await pendingRead;
    await destruction;
  } finally {
    reads.mockRestore();
    await physics.destroy();
  }
});

it('controller compiles path-based joint attachments into a stable world-anchored constraint', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const attachment = new ScenegraphNode({id: 'attachment', position: [0, 1, 0]});
  const node = new GroupNode({id: 'ball', position: [0, -1, 0], children: [attachment]});
  const anchor = new ScenegraphNode({id: 'anchor'});
  const physics = new PhysicsController(device, {
    scene: new GroupNode([node, anchor]),
    gravity: [0, 0, 0],
    timeStep: 0.01
  });
  const ball = physics.addBody('ball', {collider: {type: 'sphere', radius: 0.1}});
  physics.addJoint({
    first: 'ball/attachment',
    second: '/anchor',
    limits: [{axes: [0, 1, 2], minimum: 0, maximum: 0}]
  });
  try {
    await physics.prepare();
    ball.applyImpulse([0.1, 0, 0]);
    for (let index = 0; index < 10; index++) physics.update(0.02);
    const pose = await ball.readPose();
    const offset = rotateRigidBodyVector(pose.rotation, [0, 1, 0]);
    expect(Math.hypot(...pose.position.map((value, axis) => value + offset[axis]))).toBeLessThan(
      0.01
    );
  } finally {
    await physics.destroy();
  }
});

it('controller keeps handles through path changes and rebuilds, rejecting detached generations', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const node = new ScenegraphNode({id: 'ball'});
  const left = new GroupNode({id: 'left', children: [node]});
  const right = new GroupNode({id: 'right'});
  const scene = new GroupNode({children: [left, right]});
  const physics = new PhysicsController(device, {scene, gravity: [0, 0, 0], timeStep: 0.01});
  const options = {collider: {type: 'sphere' as const, radius: 0.5}, velocity: [1, 0, 0] as const};
  const ball = physics.addBody('left/ball', options);
  try {
    await physics.prepare();
    physics.update(0.01);
    left.remove(node);
    right.add(node);
    expect(physics.getBody('/left/ball')).toBeUndefined();
    expect(physics.getBody('/right/ball')).toBe(ball);
    await physics.prepare();
    expect((await ball.readPose()).position[0]).toBeCloseTo(0.01, 4);
    const outside = new ScenegraphNode({id: 'outside'});
    physics.addBody(outside, options);
    await expect(physics.prepare()).rejects.toThrow('outside the scene');
    expect(physics.removeBody(outside)).toBe(true);
    await physics.prepare();
    expect((await ball.readPose()).position[0]).toBeCloseTo(0.01, 4);
    node.setScale([0, 1, 1]).updateMatrix();
    await expect(physics.prepare()).rejects.toThrow('Singular');
    expect(() => physics.update(0.01)).toThrow();
    node.setScale([1, 1, 1]).updateMatrix();
    await physics.prepare();
    physics.removeBody(node);
    const replacement = physics.addBody(node, options);
    expect(() => physics.update(0.01)).toThrow();
    await physics.prepare();
    expect(() => ball.applyImpulse([1, 0, 0])).toThrow('no longer attached');
    replacement.applyImpulse([1, 0, 0]);
    physics.update(0.01);
    expect((await replacement.readPose()).position[0]).toBeGreaterThan(0.01);
  } finally {
    await physics.destroy();
  }
});

it('kinematic parents preserve independent dynamics and manual targets do not block descendant animation', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const child = new ScenegraphNode({id: 'child', position: [5, 0, 0]});
  const parent = new GroupNode({id: 'parent', children: [child]});
  const scene = new GroupNode([parent]);
  const physics = new PhysicsController(device, {scene, gravity: [0, 0, 0], timeStep: 0.1});
  const parentBody = physics.addBody('parent', {
    motion: 'kinematic',
    collider: {type: 'sphere', radius: 0.1}
  });
  const childBody = physics.addBody('parent/child', {
    collider: {type: 'sphere', radius: 0.1},
    velocity: [1, 0, 0]
  });
  try {
    await physics.prepare();
    parent.setPosition([1, 0, 0]).updateMatrix();
    physics.update(0.1);
    expect((await parentBody.readPose()).position[0]).toBeCloseTo(1, 4);
    expect((await childBody.readPose()).position[0]).toBeCloseTo(5.1, 4);
    parentBody.setKinematicTarget({position: [2, 0, 0], rotation: [0, 0, 0, 1]});
    parent.setPosition([3, 0, 0]).updateMatrix();
    physics.update(0.1, {animatedNodes: new Set([scene])});
    expect((await parentBody.readPose()).position[0]).toBeCloseTo(2, 4);
    expect((await childBody.readPose()).position[0]).toBeCloseTo(8, 4);
    physics.update(0.1);
    expect((await childBody.readPose()).position[0]).toBeGreaterThan(8);
  } finally {
    await physics.destroy();
  }
});

it('controller distinguishes scene-owned kinematic targets from explicit targets and animation release', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const node = new ScenegraphNode({id: 'ball'});
  const scene = new GroupNode([node]);
  const physics = new PhysicsController(device, {scene, gravity: [0, 0, 0], timeStep: 0.1});
  const ball = physics.addBody('ball', {
    motion: 'kinematic',
    collider: {type: 'sphere', radius: 0.5}
  });
  try {
    await physics.prepare();
    node.setPosition([2, 0, 0]).updateMatrix();
    physics.update(0.1);
    expect((await ball.readPose()).position[0]).toBeCloseTo(2, 4);
    ball.setKinematicTarget({position: [3, 0, 0], rotation: [0, 0, 0, 1]});
    node.setPosition([4, 0, 0]).updateMatrix();
    physics.update(0.1, {animatedNodes: new Set([scene])});
    expect((await ball.readPose()).position[0]).toBeCloseTo(3, 4);
    ball.followScenegraph();
    physics.update(0.1);
    expect((await ball.readPose()).position[0]).toBeCloseTo(4, 4);
    await physics.reset();
    expect(node.position[0]).toBe(0);
    expect((await ball.readPose()).position[0]).toBeCloseTo(0, 4);
    const destruction = physics.destroy();
    expect(physics.destroy()).toBe(destruction);
    await destruction;
    expect(() => physics.update(0.1)).toThrow();
  } finally {
    await physics.destroy();
  }
});

it('controller publishes cooked visual bounds without changing authored node transforms', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip();
  const node = new PhysicsGeometryNode({
    id: 'box',
    geometry: new CubeGeometry(),
    scale: [2, 3, 4],
    position: [0, 0, 10]
  });
  const scene = new GroupNode([node]);
  const physics = new PhysicsController(device, {scene, gravity: [0, 0, 0], timeStep: 0.1});
  const body = physics.addBody('box', {velocity: [1, 0, 0]});
  try {
    await physics.prepare();
    physics.update(0.1);
    const pose = await body.readPose();
    const bounds = new Float32Array((await physics.publication.bounds.readAsync()).buffer);
    expect(bounds[0]).toBeCloseTo(pose.position[0] - 2, 4);
    expect(bounds[1]).toBeCloseTo(-3, 4);
    expect(bounds[2]).toBeCloseTo(6, 4);
    expect(bounds[4]).toBeCloseTo(pose.position[0] + 2, 4);
    expect(bounds[5]).toBeCloseTo(3, 4);
    expect(bounds[6]).toBeCloseTo(14, 4);
    expect(node.position[0]).toBe(0);
  } finally {
    await physics.destroy();
  }
});
