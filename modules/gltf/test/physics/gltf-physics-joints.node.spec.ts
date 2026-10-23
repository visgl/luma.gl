// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  parseGLTFPhysics,
  createGLTFPhysicsWorld,
  type GLTFPhysicsDocument
} from '../../src/physics';

function document(): GLTFPhysicsDocument {
  return {
    scenes: [{nodes: [0, 2]}],
    nodes: [
      {
        translation: [2, 0, 0],
        children: [1],
        extensions: {KHR_physics_rigid_bodies: {motion: {mass: 1, inertiaDiagonal: [1, 1, 1]}}}
      },
      {
        translation: [0, 1, 0],
        extensions: {KHR_physics_rigid_bodies: {joint: {connectedNode: 2, joint: 0}}}
      },
      {translation: [2, 1, 0]}
    ],
    extensions: {
      KHR_physics_rigid_bodies: {
        physicsJoints: [
          {
            limits: [
              {linearAxes: [0, 1, 2], max: 0},
              {angularAxes: [0, 2], max: 0},
              {angularAxes: [1], min: -0.5, max: 0.5}
            ],
            drives: [
              {
                type: 'angular',
                mode: 'acceleration',
                axis: 1,
                velocityTarget: 2,
                damping: 1,
                maxForce: 3
              }
            ]
          }
        ]
      }
    }
  };
}
it('imports composed joints with forward attachment references and static world anchors', () => {
  const source = document();
  const original = structuredClone(source);
  const description = parseGLTFPhysics(source);
  expect(description.issues).toEqual([]);
  expect(source).toEqual(original);
  expect(description.joints).toHaveLength(4);
  expect(description.joints[0].joint).toMatchObject({
    type: 'general',
    first: 0,
    second: 1,
    firstFrame: {position: [0, 1, 0]},
    secondFrame: {position: [2, 1, 0]},
    axes: [0, 1, 2],
    maximum: 0,
    collideConnected: false
  });
  expect(description.joints[3].joint).toMatchObject({
    drive: {mode: 'acceleration', maximumForce: 3}
  });
  const world = createGLTFPhysicsWorld(description);
  expect(world.getBodyMode(0)).toBe('dynamic');
  world.destroy();
});
it('rejects invalid and off-scene joint references without a partial supported description', () => {
  const source = document();
  source.scenes = [{nodes: [0]}];
  expect(parseGLTFPhysics(source).supported).toBe(false);
});

it('binds animated child collider transforms without taking ownership of the parent body', () => {
  const source: GLTFPhysicsDocument = {
    scenes: [{nodes: [0]}],
    nodes: [
      {children: [1], extensions: {KHR_physics_rigid_bodies: {motion: {mass: 1}}}},
      {extensions: {KHR_physics_rigid_bodies: {collider: {geometry: {shape: 0}}}}}
    ],
    extensions: {KHR_implicit_shapes: {shapes: [{type: 'sphere', sphere: {radius: 1}}]}},
    animations: [{channels: [{target: {node: 1, path: 'translation'}}]}]
  };
  const description = parseGLTFPhysics(source, {animationOwnership: 'scenegraph'});
  expect(description.issues).toEqual([]);
  expect(description.animatedBodyIndices).toEqual([]);
  expect(description.animatedColliderIndices).toEqual([0]);
  expect(description.bodies[0].body.mode).toBe('dynamic');
});

it.for([
  1, 2, 3
])('imports %s-dimensional linear and angular limits with explicit softness', dimensions => {
  const axes = [0, 1, 2].slice(0, dimensions);
  const source: GLTFPhysicsDocument = {
    scenes: [{nodes: [0, 1]}],
    nodes: [
      {
        extensions: {
          KHR_physics_rigid_bodies: {
            motion: {mass: 1, inertiaDiagonal: [1, 1, 1]},
            joint: {connectedNode: 1, joint: 0}
          }
        }
      },
      {}
    ],
    extensions: {
      KHR_physics_rigid_bodies: {
        physicsJoints: [
          {
            limits: [
              {linearAxes: axes, min: 0.1, max: 1, stiffness: 20, damping: 4},
              {angularAxes: axes, min: 0, max: 0.5, stiffness: 10, damping: 2}
            ]
          }
        ]
      }
    }
  };
  const result = parseGLTFPhysics(source);
  expect(result.issues).toEqual([]);
  expect(result.joints.map(item => item.joint)).toMatchObject([
    {axes, minimum: 0.1, maximum: 1, stiffness: 20, damping: 4, angular: false},
    {axes, minimum: 0, maximum: 0.5, stiffness: 10, damping: 2, angular: true}
  ]);
});
