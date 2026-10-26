// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  GroupNode,
  ScenegraphNode,
  AnimationClip,
  AnimationTrack,
  AnimationMixer
} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {ScenegraphPhysicsSession, type ScenegraphPhysicsScene} from '@luma.gl/engine/physics';

class BoundsNode extends ScenegraphNode {
  extent = 0.5;
  override getBounds() {
    return [
      [-this.extent, -this.extent, -this.extent],
      [this.extent, this.extent, this.extent]
    ];
  }
}
function fixture() {
  const mesh = new BoundsNode({id: 'mesh'});
  const body = new GroupNode({id: 'body', children: [mesh]});
  const root = new GroupNode({id: 'root', children: [body]});
  const scene: ScenegraphPhysicsScene = {
    roots: [root],
    definition: {
      bodies: new Map([[body, 0]]),
      world: {
        gravity: [0, 0, 0],
        timeStep: 0.1,
        enableQueries: true,
        bodies: [{position: [0, 0, 0], mass: 1, shape: {type: 'sphere', radius: 0.5}}]
      }
    },
    colliders: [{node: body, body, index: 0}]
  };
  return {scene, root, body, mesh};
}

it('qualifies animation takeover, paused poses, seek and release without snapping', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const {scene, root, body} = fixture();
  const session = await ScenegraphPhysicsSession.create(device, scene);
  try {
    await session.step(new Set([root]), () => root.setMatrixComponents({position: [2, 0, 0]}));
    expect(session.world.getBodyMode(0)).toBe('kinematic');
    expect((await session.world.readState())[0].position[0]).toBeCloseTo(2);
    await session.step(new Set([root]));
    expect((await session.world.readState())[0].position[0]).toBeCloseTo(2);
    await session.step(new Set([body]), () => body.setMatrixComponents({position: [-1, 0, 0]}));
    expect((await session.world.readState())[0].position[0]).toBeCloseTo(1);
    await session.step();
    expect(session.world.getBodyMode(0)).toBe('dynamic');
    expect((await session.world.readState())[0].position[0]).toBeLessThan(1);
    await session.reset();
    expect(root.position).toEqual([0, 0, 0]);
    expect(body.position).toEqual([0, 0, 0]);
    expect((await session.world.readState())[0].position[0]).toBe(0);
  } finally {
    await session.destroy();
  }
});

it('qualifies scene lifecycle, independent instances, pending work and failed recooking', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const firstScene = fixture(),
    secondScene = fixture();
  const first = await ScenegraphPhysicsSession.create(device, firstScene.scene);
  const second = await ScenegraphPhysicsSession.create(device, secondScene.scene);
  try {
    first.world.applyImpulse(0, [1, 0, 0]);
    await first.step();
    const capture = await first.capture();
    await first.step();
    await first.restore(capture);
    expect((await first.world.readState())[0].position[0]).toBeCloseTo(0.1);
    expect((await second.world.readState())[0].position[0]).toBe(0);
    const previousWorld = first.world;
    await expect(
      first.rebuild(async () => ({
        ...firstScene.scene,
        definition: {
          ...firstScene.scene.definition,
          world: {bodies: [{position: [0, 0, 0], shape: {type: 'sphere', radius: -1}}]}
        }
      }))
    ).rejects.toThrow();
    expect(first.world).toBe(previousWorld);
    let finish!: () => void;
    let started!: () => void;
    const starting = new Promise<void>(resolve => {
      started = resolve;
    });
    const query = first.withWorld(async world => {
      await new Promise<void>(resolve => {
        finish = resolve;
        started();
      });
      return world.raycast({origin: [-2, 0, 0], direction: [1, 0, 0], maximumDistance: 10});
    });
    await starting;
    await expect(first.reset()).rejects.toThrow();
    const destroying = first.destroy();
    finish();
    expect((await query).hits).toHaveLength(1);
    await destroying;
    await expect(first.step()).rejects.toThrow();
    await second.step();
  } finally {
    await first.destroy();
    await second.destroy();
  }
});

it('qualifies hierarchy publication, resized bounds and visibility without pose readback', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const {scene, body, mesh} = fixture();
  const session = await ScenegraphPhysicsSession.create(device, scene);
  try {
    session.world.readState = async () => {
      throw new Error('Forbidden pose bridge');
    };
    await session.step(new Set([body]), () => {
      body.setMatrixComponents({position: [3, 0, 0], scale: [2, 2, 2]});
      mesh.setMatrixComponents({position: [1, 0, 0]});
      mesh.extent = 1;
    });
    const bounds = new Float32Array((await session.publication.bounds.readAsync()).buffer);
    expect(Array.from(bounds.slice(0, 3))).toEqual([3, -2, -2]);
    expect(Array.from(bounds.slice(4, 7))).toEqual([7, 2, 2]);
    expect(session.publication.bindings.get(mesh)!.localMatrix[12]).toBe(2);
    body.display = false;
    session.publication.update();
    expect(session.publication.bindings.get(mesh)!.visible).toBe(false);
  } finally {
    await session.destroy();
  }
});

it('retains animation release ownership across capture and scene replacement', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const first = fixture();
  const session = await ScenegraphPhysicsSession.create(device, first.scene);
  try {
    await session.step(new Set([first.body]), () =>
      first.body.setMatrixComponents({position: [1, 0, 0]})
    );
    const capture = await session.capture();
    const second = fixture();
    await session.rebuild(async () => second.scene, false);
    expect((await session.world.readState())[0].position[0]).toBe(0);
    await session.restore(capture);
    expect(session.world.getBodyMode(0)).toBe('kinematic');
    await session.step();
    expect(session.world.getBodyMode(0)).toBe('dynamic');
    await session.reset();
    expect(first.body.position[0]).toBe(0);
    expect((await session.world.readState())[0].position[0]).toBe(0);
  } finally {
    await session.destroy();
  }
});

it('rolls back render binding failure before publishing replacement buffers', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const {scene, mesh} = fixture();
  const session = await ScenegraphPhysicsSession.create(device, scene);
  try {
    const before = session.world;
    const buffer = session.publication.matrices;
    mesh.extent = NaN;
    await expect(session.rebuild(async () => scene)).rejects.toThrow();
    expect(session.world).toBe(before);
    expect(session.publication.matrices).toBe(buffer);
    mesh.extent = 0.5;
    await session.step();
  } finally {
    await session.destroy();
  }
});

it('qualifies blended mixer pause seek stop and explicit body mode changes', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const {scene, body} = fixture();
  const session = await ScenegraphPhysicsSession.create(device, scene);
  const binding = {
    id: 'body.translation',
    getValue: () => Array.from(body.position),
    setValue: (position: number[]) => {
      body.setMatrixComponents({position});
    }
  };
  const clips = [2, 4].map(
    (distance, index) =>
      new AnimationClip({
        name: String(index),
        tracks: [
          new AnimationTrack({
            times: [0, 1],
            values: [
              [0, 0, 0],
              [distance, 0, 0]
            ],
            binding
          })
        ]
      })
  );
  const mixer = new AnimationMixer(clips);
  const first = mixer.clipAction('0', {weight: 0.5}).play();
  const second = mixer.clipAction('1', {weight: 0.5}).play();
  try {
    await session.step(new Set([body]), () => mixer.update(0.5));
    expect((await session.world.readState())[0].position[0]).toBeCloseTo(1.5);
    first.pause();
    second.pause();
    await session.step(new Set([body]), () => mixer.update(0.1));
    expect((await session.world.readState())[0].position[0]).toBeCloseTo(1.5);
    first.setTime(0.25);
    second.setTime(0.25);
    await session.step(new Set([body]), () => mixer.update(0));
    expect((await session.world.readState())[0].position[0]).toBeCloseTo(0.75);
    session.world.setBodyParameters(0, {mode: 'static'});
    await session.step(new Set([body]));
    expect(session.world.getBodyMode(0)).toBe('kinematic');
    first.stop();
    second.stop();
    await session.step();
    expect(session.world.getBodyMode(0)).toBe('static');
  } finally {
    await session.destroy();
  }
});

it('rejects a shared joint edit before changing any participating constraint', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const {scene} = fixture();
  scene.definition.world.joints = [4, 2].map(maximum => ({
    type: 'general',
    first: 0,
    second: 0,
    axes: [0],
    minimum: 0,
    maximum
  }));
  // Separate anchored bodies avoid self-joint ambiguity.
  scene.definition.world.bodies = [
    ...scene.definition.world.bodies,
    {mode: 'static', position: [0, 0, 0], colliders: []}
  ];
  scene.definition.world.joints = scene.definition.world.joints.map(joint => ({
    ...joint,
    second: 1
  }));
  const session = await ScenegraphPhysicsSession.create(device, scene);
  try {
    const before = [session.world.getJointParameters(0), session.world.getJointParameters(1)];
    expect(() =>
      session.world.setJointParameterEdits(
        before.map((joint, index) => ({index, parameters: {...joint, minimum: 3}}))
      )
    ).toThrow();
    expect([session.world.getJointParameters(0), session.world.getJointParameters(1)]).toEqual(
      before
    );
  } finally {
    await session.destroy();
  }
});

it('drains active GPU behavior queries and rejects stale queued continuations on disposal', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const {scene, body, root} = fixture();
  scene.behaviors = {
    roots: [root],
    nodes: new Map([[0, body]]),
    bodyNodes: scene.definition.bodies,
    colliderNodes: [body],
    triggerNodes: []
  };
  const session = await ScenegraphPhysicsSession.create(device, scene);
  const original = session.world.raycast.bind(session.world);
  let started!: () => void;
  let finish!: () => void;
  const starting = new Promise<void>(resolve => {
    started = resolve;
  });
  session.world.raycast = async query => {
    await new Promise<void>(resolve => {
      finish = resolve;
      started();
    });
    return original(query);
  };
  const first = session.behaviors!.rayCast([-2, 0, 0], [2, 0, 0], -1);
  const second = session.behaviors!.rayCast([-2, 0, 0], [2, 0, 0], -1);
  const rejected = Promise.all([
    expect(first).rejects.toThrow('Disposed'),
    expect(second).rejects.toThrow('Disposed')
  ]);
  await starting;
  const destroyed = session.destroy();
  finish();
  await rejected;
  await destroyed;
});

it('restores captured hierarchy after edits and rejects cyclic capture references atomically', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const {scene, root, body, mesh} = fixture();
  const session = await ScenegraphPhysicsSession.create(device, scene);
  try {
    body.setRotation([0, 0, 0, 1]);
    const capture = await session.capture();
    body.add(new BoundsNode({id: 'temporary'}));
    body.setRotation([0, 0, 0]);
    await session.restore(capture);
    expect(body.children).toEqual([mesh]);
    expect(Array.from(body.rotation)).toEqual([0, 0, 0, 1]);
    const previousWorld = session.world;
    const capturedRoot = capture.nodes.find(state => state.node === root)!;
    capturedRoot.children = [root];
    await expect(session.restore(capture)).rejects.toThrow('hierarchy');
    expect(session.world).toBe(previousWorld);
    await session.step();
  } finally {
    await session.destroy();
  }
});

it('publishes bounds before exposing create reset restore and recook revisions without stepping', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const {scene, body, mesh} = fixture();
  body.setMatrixComponents({position: [10, 0, 0]});
  scene.definition.world.bodies = [
    {...scene.definition.world.bodies[0], position: [10, 0, 0], velocity: [1, 0, 0]}
  ];
  const session = await ScenegraphPhysicsSession.create(device, scene);
  const check = async (position: number, extent: number) => {
    const bounds = new Float32Array((await session.publication.bounds.readAsync()).buffer);
    const matrices = new Float32Array((await session.publication.matrices.readAsync()).buffer);
    expect(bounds[0]).toBeCloseTo(position - extent);
    expect(bounds[4]).toBeCloseTo(position + extent);
    expect(matrices[12]).toBeCloseTo(position);
    expect((await session.world.readState())[0].position[0]).toBeCloseTo(position);
  };
  try {
    await check(10, 0.5);
    await session.step();
    const capture = await session.capture();
    await session.reset();
    await check(10, 0.5);
    await session.restore(capture);
    await check(10.1, 0.5);
    mesh.extent = 2;
    await session.rebuild(async () => scene);
    await check(10.1, 2);
  } finally {
    await session.destroy();
  }
});
