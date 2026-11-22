// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {ScenegraphPhysicsSession} from '@luma.gl/engine/physics';
import {
  parseGLTFPhysics,
  makeGLTFPhysicsScene,
  exportGLTFPhysicsState,
  type GLTFPhysicsDocument
} from '../../../src/gltf/physics';

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

it('exports a settled animated collider frame and shared analytic scale without recooking', async context => {
  /** This round trip exercises the same CPU-independent physics world used by rendering. */
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  /** Start with two rigid bodies that share a primitive declaration. */
  const original = document();
  /** Copy the node array so additional children keep stable glTF indices. */
  const nodes = [...original.nodes!];
  nodes[1].children = [3, 4, 5];
  /** Move the first collider off the body node to exercise compound ownership. */
  const extension = nodes[1].extensions!['KHR_physics_rigid_bodies'] as Record<string, unknown>;
  delete extension['collider'];
  nodes.push({
    translation: [1, 0, 0],
    extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 0}, physicsMaterial: 0}}}
  });
  // Use a rounded source quaternion to exercise the physics importer's normalization.
  nodes.push({scale: [0, 1, 1]}, {scale: [1, 0, 1], rotation: [0, 0, 0.70710677, 0.70710677]});
  /** Exercise both standard and pointer-targeted scale channels. */
  const source: GLTFPhysicsDocument = {
    ...original,
    nodes,
    animations: [
      {
        channels: [
          {target: {node: 3, path: 'scale'}},
          {target: {node: 4, path: 'scale'}},
          {
            target: {
              path: 'pointer',
              extensions: {KHR_animation_pointer: {pointer: '/nodes/5/scale/0'}}
            }
          }
        ]
      }
    ]
  };
  /** Let the scenegraph drive changes to the cooked collider. */
  const options = {animationOwnership: 'scenegraph', propertyBindings: true} as const;
  /** Cook the original hierarchy before applying the live changes. */
  const description = parseGLTFPhysics(source, options);
  expect(description.issues).toEqual([]);
  /** Live node whose matrix supplies the compound collider placement. */
  const child = description.sceneNodes.get(3)!;
  /** Live visual sibling with no collider binding. */
  const renderOnlyChild = description.sceneNodes.get(4)!;
  /** Disable gravity so the test isolates the authored scale and placement changes. */
  const session = await ScenegraphPhysicsSession.create(
    device,
    makeGLTFPhysicsScene(description, undefined, {gravity: [0, 0, 0]})
  );
  try {
    await session.step(new Set([child, renderOnlyChild]), () => {
      child.setPosition([2, 0, 0]);
      child.setScale([1.5, 2, 1]);
      child.updateMatrix();
      renderOnlyChild.setScale([0, -2, 3]).updateMatrix();
    });
    /** Source-only export cannot reconstruct a child changed by live animation. */
    await expect(exportGLTFPhysicsState(source, description, session.world)).rejects.toThrow(
      'Export scene scale does not match'
    );
    /** Export applies the accepted GPU pose and original shared primitive declaration. */
    const saved = await session.withWorld(world =>
      exportGLTFPhysicsState(source, description, world, {sceneNodes: description.sceneNodes})
    );
    expect(saved.nodes![3].matrix).toBeUndefined();
    expect(saved.nodes![3].translation).toEqual([2, 0, 0]);
    expect(saved.nodes![3].scale).toEqual([1.5, 2, 1]);
    expect(saved.nodes![4].matrix).toBeUndefined();
    expect(saved.nodes![4].scale).toEqual([0, -2, 3]);
    expect(saved.nodes![5].matrix).toBeUndefined();
    expect(saved.nodes![5].scale).toEqual([1, 0, 1]);
    expect(saved.nodes![5].rotation![2]).toBeCloseTo(Math.SQRT1_2, 12);
    expect(source.nodes![3].translation).toEqual([1, 0, 0]);
    /** Reimport the exported pose to compare the newly cooked colliders. */
    const roundTrip = parseGLTFPhysics(saved, options);
    expect(roundTrip.issues).toEqual([]);
    for (const collider of roundTrip.colliders) {
      /** The imported collider's bounds and frame must agree with the accepted revision. */
      const old = description.colliders.find(
        candidate => candidate.nodeIndex === collider.nodeIndex
      )!;
      expect(collider.shapeIndex).toBe(0);
      expect(collider.collider.shape).toEqual(session.world.getColliderShape(old.colliderIndex));
      expect(collider.collider.position).toEqual(
        session.world.getColliderTransform(old.colliderIndex).position
      );
    }
  } finally {
    await session.destroy();
  }
}, 120000);

it('exports absolute body poses after a physics origin shift', async context => {
  /** Source coordinates should not become simulation-local after rebasing. */
  const device = await getWebGPUTestDevice('core');
  if (!device) return context.skip('WebGPU unavailable');
  /** Author bodies far from the initial simulation origin. */
  const source = document();
  source.nodes![0].translation = [129, 0, 0];
  /** Cook the bodies in the original world frame. */
  const description = parseGLTFPhysics(source);
  /** Attach the scene to a real GPU world so the rebase updates live buffers. */
  const session = await ScenegraphPhysicsSession.create(device, makeGLTFPhysicsScene(description));
  try {
    session.world.shiftOrigin([128, 0, 0]);
    /** Confirm the GPU pose shifted before reading the exported pose. */
    const live = await session.world.readState();
    expect(live[0].position[0]).toBeCloseTo(1.1, 4);
    /** Export using the saved origin and live local poses. */
    const saved = await exportGLTFPhysicsState(source, description, session.world);
    /** Verify import reconstructs both authored world translations. */
    const imported = parseGLTFPhysics(saved);
    expect(imported.issues).toEqual([]);
    expect(imported.bodies[0].worldMatrix[12]).toBeCloseTo(129, 4);
    expect(imported.bodies[1].worldMatrix[12]).toBeCloseTo(134, 4);
  } finally {
    await session.destroy();
  }
}, 120000);
