// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {ScenegraphPhysicsSession} from '@luma.gl/engine/physics';
import {
  parseGLTFPhysics,
  makeGLTFPhysicsScene,
  exportGLTFPhysicsState,
  type GLTFPhysicsDocument
} from '../../src/physics';

function document(): GLTFPhysicsDocument {
  return {
    scenes: [{nodes: [0]}],
    nodes: [
      {translation: [2, 0, 0], children: [1, 2]},
      ...[1, 2].map((scale, index) => ({
        translation: [index * 5, 1, 0],
        scale: [scale, scale, scale],
        extensions: {
          KHR_physics_rigid_bodies: {
            motion: {mass: 1, centerOfMass: [0.1, 0, 0]},
            collider: {geometry: {shape: 0}, physicsMaterial: 0}
          }
        }
      }))
    ],
    extensions: {
      KHR_implicit_shapes: {shapes: [{type: 'box', box: {size: [1, 1, 1]}}]},
      KHR_physics_rigid_bodies: {physicsMaterials: [{restitution: 0.2}]}
    }
  };
}

it('qualifies imported component pointers, shared shape edits and rejected mutation atomically', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const source = document();
  const description = parseGLTFPhysics(source, {propertyBindings: true});
  expect(description.issues).toEqual([]);
  const session = await ScenegraphPhysicsSession.create(
    device,
    makeGLTFPhysicsScene(description, undefined, {gravity: [0, 0, 0]})
  );
  try {
    const size = '/extensions/KHR_implicit_shapes/shapes/0/box/size';
    expect(session.properties.set(`${size}/0`, [2])).toBe(true);
    expect(session.properties.get(size)).toEqual([2, 1, 1]);
    expect(session.world.getColliderShape(0)).toMatchObject({halfExtents: [1, 0.5, 0.5]});
    expect(session.world.getColliderShape(1)).toMatchObject({halfExtents: [2, 1, 1]});
    expect(() => session.properties.set(`${size}/1`, [-1])).toThrow();
    expect(session.properties.get(size)).toEqual([2, 1, 1]);
    expect(session.properties.set(`${size}/3`, [1])).toBe(false);
    const velocity = '/nodes/2/extensions/KHR_physics_rigid_bodies/motion/linearVelocity';
    session.properties.set(`${velocity}/2`, [3]);
    expect((await session.world.readState())[1].velocity[2]).toBeCloseTo(6);
    expect(session.properties.get(velocity)).toEqual([0, 0, 3]);
    expect(source.extensions).toEqual(document().extensions);
  } finally {
    await session.destroy();
  }
});

it('qualifies imported ancestor ownership and native export reimport with COM and shared assets', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const source = document();
  const description = parseGLTFPhysics(source);
  const session = await ScenegraphPhysicsSession.create(
    device,
    makeGLTFPhysicsScene(description, undefined, {gravity: [0, 0, 0]})
  );
  let reimported: ScenegraphPhysicsSession | undefined;
  try {
    const ancestor = description.sceneNodes.get(0)!;
    await session.step(new Set([ancestor]), () =>
      ancestor.setMatrixComponents({position: [3, 0, 0]})
    );
    expect(session.world.getBodyMode(0)).toBe('kinematic');
    expect(session.world.getBodyMode(1)).toBe('kinematic');
    await session.step(new Set([ancestor]));
    await session.step();
    const before = await session.world.readState();
    const exported = await exportGLTFPhysicsState(source, description, session.world);
    const imported = parseGLTFPhysics(exported);
    expect(imported.issues).toEqual([]);
    reimported = await ScenegraphPhysicsSession.create(
      device,
      makeGLTFPhysicsScene(imported, undefined, {gravity: [0, 0, 0]})
    );
    const after = await reimported.world.readState();
    for (let index = 0; index < before.length; index++) {
      for (let axis = 0; axis < 3; axis++) {
        expect(after[index].position[axis]).toBeCloseTo(before[index].position[axis]);
        expect(after[index].velocity[axis]).toBeCloseTo(before[index].velocity[axis]);
      }
    }
    expect(source).toEqual(document());
    expect(exported.extensions?.KHR_implicit_shapes).toEqual(
      source.extensions?.KHR_implicit_shapes
    );
  } finally {
    await reimported?.destroy();
    await session.destroy();
  }
});

it('reimports automatically derived inertia under nonuniform box scale', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const source = document();
  source.nodes![1].scale = [2, 1, 3];
  const description = parseGLTFPhysics(source);
  expect(description.issues).toEqual([]);
  const session = await ScenegraphPhysicsSession.create(device, makeGLTFPhysicsScene(description));
  try {
    const result = parseGLTFPhysics(
      await exportGLTFPhysicsState(source, description, session.world)
    );
    expect(result.issues).toEqual([]);
    expect(result.bodies[0].body.inertiaDiagonal).toBeUndefined();
  } finally {
    await session.destroy();
  }
});

it('exports static and reactivated motion modes without retaining stale declarations', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const source = document();
  const description = parseGLTFPhysics(source);
  const session = await ScenegraphPhysicsSession.create(device, makeGLTFPhysicsScene(description));
  try {
    session.world.setBodyParameters(0, {mode: 'static'});
    const frozen = await exportGLTFPhysicsState(source, description, session.world);
    expect(parseGLTFPhysics(frozen).bodies[0].body.mode).toBe('static');
    const frozenDescription = parseGLTFPhysics(frozen);
    await session.rebuild(async () => makeGLTFPhysicsScene(frozenDescription), false);
    session.world.setBodyParameters(0, {mode: 'dynamic', mass: 2});
    const activated = parseGLTFPhysics(
      await exportGLTFPhysicsState(frozen, frozenDescription, session.world)
    );
    expect(activated.issues).toEqual([]);
    expect(activated.bodies[0].body.mode).toBe('dynamic');
    expect(activated.bodies[0].body.mass).toBe(2);
  } finally {
    await session.destroy();
  }
});

it('exports rotating bodies beneath unequal parent scale by preserving world poses as scene roots', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const source = document();
  source.nodes![0].scale = [2, 1, 1];
  const description = parseGLTFPhysics(source);
  expect(description.issues).toEqual([]);
  const session = await ScenegraphPhysicsSession.create(
    device,
    makeGLTFPhysicsScene(description, undefined, {gravity: [0, 0, 0]})
  );
  let reopened: ScenegraphPhysicsSession | undefined;
  try {
    session.world.setBodyParameters(0, {angularVelocity: [0, 0, 2]});
    await session.step();
    const before = await session.world.readState();
    const saved = await exportGLTFPhysicsState(source, description, session.world);
    expect(saved.nodes![0].children).not.toContain(1);
    expect(saved.scenes![0].nodes).toContain(1);
    expect(source.nodes![0].children).toEqual([1, 2]);
    const imported = parseGLTFPhysics(saved);
    expect(imported.issues).toEqual([]);
    reopened = await ScenegraphPhysicsSession.create(device, makeGLTFPhysicsScene(imported));
    const after = await reopened.world.readState();
    for (const body of description.bodies) {
      const restored = imported.bodies.find(candidate => candidate.nodeIndex === body.nodeIndex)!;
      for (const field of ['position', 'orientation', 'velocity', 'angularVelocity'] as const) {
        for (let axis = 0; axis < before[body.bodyIndex][field].length; axis++)
          expect(after[restored.bodyIndex][field][axis]).toBeCloseTo(
            before[body.bodyIndex][field][axis]
          );
      }
    }
  } finally {
    await reopened?.destroy();
    await session.destroy();
  }
});

it('preserves a frozen nested body independently of its moving ancestor on reimport', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const source = document();
  source.nodes![0].children = [1];
  source.nodes![1].children = [2];
  const description = parseGLTFPhysics(source);
  expect(description.issues).toEqual([]);
  const session = await ScenegraphPhysicsSession.create(device, makeGLTFPhysicsScene(description));
  try {
    const child = description.bodies.find(body => body.nodeIndex === 2)!;
    session.world.setBodyParameters(child.bodyIndex, {mode: 'static'});
    const saved = await exportGLTFPhysicsState(source, description, session.world);
    const imported = parseGLTFPhysics(saved);
    expect(imported.issues).toEqual([]);
    expect(imported.bodies).toHaveLength(2);
    const frozen = imported.bodies.find(body => body.nodeIndex === 2)!;
    expect(frozen.body.mode).toBe('static');
    expect(saved.nodes![1].children).not.toContain(2);
    expect(saved.scenes![0].nodes).toContain(2);
    for (let axis = 0; axis < 3; axis++)
      expect(frozen.worldMatrix[12 + axis]).toBeCloseTo(child.worldMatrix[12 + axis]);
    expect(source.nodes![1].children).toEqual([2]);
  } finally {
    await session.destroy();
  }
});

it('rejects exporting explicit inertia under unequal scale instead of returning an unreopenable file', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return context.skip('WebGPU unavailable');
  const source = document();
  source.nodes![1].scale = [2, 1, 3];
  const description = parseGLTFPhysics(source);
  const session = await ScenegraphPhysicsSession.create(device, makeGLTFPhysicsScene(description));
  try {
    session.world.setBodyParameters(0, {inertiaDiagonal: [1, 2, 3]});
    await expect(exportGLTFPhysicsState(source, description, session.world)).rejects.toThrow(
      'Cannot export explicit inertia under unequal scale'
    );
    expect(source.nodes![1].scale).toEqual([2, 1, 3]);
  } finally {
    await session.destroy();
  }
});
