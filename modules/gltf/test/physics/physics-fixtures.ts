// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPhysicsDocument} from '../../src/physics';

export function makePhysicsDocument(
  nodes: GLTFPhysicsDocument['nodes'] = [
    {extensions: {KHR_physics_rigid_bodies: {motion: {mass: 2}, collider: {geometry: {shape: 0}}}}}
  ]
): GLTFPhysicsDocument {
  return {
    scene: 0,
    scenes: [{nodes: [0]}],
    extensionsUsed: ['KHR_physics_rigid_bodies', 'KHR_implicit_shapes'],
    extensions: {
      KHR_implicit_shapes: {
        shapes: [
          {type: 'sphere', sphere: {radius: 0.5}},
          {type: 'box', box: {size: [1, 2, 3]}}
        ]
      },
      KHR_physics_rigid_bodies: {
        physicsMaterials: [
          {
            staticFriction: 0.8,
            dynamicFriction: 0.3,
            restitution: 0.7,
            frictionCombine: 'maximum',
            restitutionCombine: 'multiply'
          }
        ],
        collisionFilters: [
          {collisionSystems: ['first'], notCollideWithSystems: ['second']},
          {collisionSystems: ['second']}
        ]
      }
    },
    nodes
  };
}
