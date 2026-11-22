// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GroupNode, JointController, SkinController} from '@luma.gl/engine';
import {
  makeRigidBodyJointsFromScenegraph,
  ScenegraphPhysicsSession,
  ScenegraphRagdoll
} from '@luma.gl/engine/physics';
import {Matrix4} from '@math.gl/core/matrix';
import {expect, test} from 'vitest';

test('hands an animated body to physics and writes its descendant skin joint directly on the GPU', async context => {
  /** Exercise the WebGPU path on a real storage-capable backend. */
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  /** The skin joint is offset from the rigid body's node and center of mass. */
  const joint = new GroupNode({position: [0, 2, 0]});
  /** Author a rigid-body ancestor for the skin joint. */
  const body = new GroupNode({children: [joint]});
  /** Give the mesh a distinct world position to exercise the inverse mesh transform. */
  const mesh = new GroupNode({position: [0, 1, 0]});
  /** Keep body and skin in the same scene. */
  const root = new GroupNode({children: [body, mesh]});
  /** The copy source flag lets the test inspect results without changing runtime policy. */
  const palette = device.createBuffer({
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    byteLength: 64
  });
  /** Use a conventional skin without allocating a render model. */
  const binding = {
    node: mesh,
    joints: [joint],
    models: [],
    jointMatrices: new Float32Array(16),
    skinJointMatrices: palette,
    inverseBindMatrices: new Float32Array(new Matrix4().translate([0, -1, 0]))
  };
  /** Use the same palette update path as imported glTF. */
  const controller = new SkinController({scenes: [root], bindings: [binding]});
  /** Start from a dynamic body that animation can temporarily claim. */
  const session = await ScenegraphPhysicsSession.create(device, {
    roots: [root],
    definition: {
      bodies: new Map([[body, 0]]),
      world: {
        timeStep: 1 / 60,
        gravity: [0, 0, 0],
        bodies: [
          {
            shape: {type: 'sphere', radius: 0.2},
            position: [0, 0, 0],
            centerOfMass: [0.1, 0, 0],
            mass: 1
          }
        ]
      }
    }
  });
  /** Borrow the skin palette for the GPU handoff. */
  const ragdoll = new ScenegraphRagdoll(device, controller, binding);
  try {
    await session.step(new Set([body]), () => body.setPosition([1, 0, 0]).updateMatrix());
    await session.step(new Set([body]), () => body.setPosition([1.1, 0, 0]).updateMatrix());
    /** Read the last accepted kinematic position and velocity. */
    const before = (await session.world.readState())[0];
    expect(session.world.getBodyMode(0)).toBe('kinematic');
    expect(before.velocity[0]).toBeGreaterThan(0);

    /** Encode accepted dynamic motion and palette writes before a single submission. */
    const encoder = device.createCommandEncoder();
    session.encode(encoder);
    ragdoll.encode(encoder, session.publication, mesh.matrix);
    device.submit(encoder.finish());
    /** Inspect the first accepted dynamic state. */
    const after = (await session.world.readState())[0];
    /** Read the palette only for the test assertion. */
    const output = new Float32Array((await palette.readAsync()).buffer);
    expect(session.world.getBodyMode(0)).toBe('dynamic');
    expect(after.velocity[0]).toBeCloseTo(before.velocity[0], 4);
    expect(output[12]).toBeCloseTo(after.position[0] - 0.1, 4);
    expect(output[13]).toBeCloseTo(0, 5);

    /** A CPU animation tick cannot clobber the borrowed GPU palette until reset. */
    body.setPosition([9, 0, 0]).updateMatrix();
    controller.update();
    expect(new Float32Array((await palette.readAsync()).buffer)[12]).toBeCloseTo(output[12], 5);
    ragdoll.reset();
    controller.update();
    expect(new Float32Array((await palette.readAsync()).buffer)[12]).toBeCloseTo(9, 5);
  } finally {
    ragdoll.destroy();
    await session.destroy();
    controller.destroy();
  }
});

test('keeps an ordered scenegraph joint through an all-kinematic pose and dynamic release', async context => {
  /** Exercise the same joint resolution used by both composed and authored scenes. */
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');

  /** Both body frames meet at a pair of coincident authored anchors. */
  const firstAnchor = new GroupNode({position: [0, -0.5, 0]});
  const secondAnchor = new GroupNode({position: [0, 0.5, 0]});
  const first = new GroupNode({position: [0, 2, 0], children: [firstAnchor]});
  const second = new GroupNode({position: [0, 1, 0], children: [secondAnchor]});
  const root = new GroupNode({children: [first, second]});
  /** Node objects provide scope-safe identities for both attachment frames. */
  const bodies = new Map([
    [first, 0],
    [second, 1]
  ]);
  const joints = new JointController([
    {
      first: firstAnchor,
      second: secondAnchor,
      limits: [{axes: [0, 1, 2], minimum: 0, maximum: 0}],
      collideConnected: false
    }
  ]).resolve([root], new Set(bodies.keys()));

  const session = await ScenegraphPhysicsSession.create(device, {
    roots: [root],
    definition: {
      bodies,
      world: {
        gravity: [0, -9.81, 0],
        joints: makeRigidBodyJointsFromScenegraph(joints[0], bodies),
        bodies: [
          {shape: {type: 'sphere', radius: 0.2}, position: [0, 2, 0], mass: 1},
          {shape: {type: 'sphere', radius: 0.2}, position: [0, 1, 0], mass: 1}
        ]
      }
    }
  });
  try {
    await session.step(new Set([root]));
    await session.step(new Set([root]), () => root.setPosition([0.2, 0, 0]).updateMatrix());
    expect(session.world.getBodyMode(0)).toBe('kinematic');
    expect(session.world.getBodyMode(1)).toBe('kinematic');
    await session.step();
    /** Both bodies should carry horizontal animation momentum while their joint stays aligned. */
    const [firstState, secondState] = await session.world.readState();
    expect(session.world.getBodyMode(0)).toBe('dynamic');
    expect(session.world.getBodyMode(1)).toBe('dynamic');
    expect(firstState.position[0]).toBeGreaterThan(0.2);
    expect(secondState.position[0]).toBeCloseTo(firstState.position[0], 4);
    expect(firstState.position[1] - secondState.position[1]).toBeCloseTo(1, 4);
  } finally {
    await session.destroy();
  }
});
