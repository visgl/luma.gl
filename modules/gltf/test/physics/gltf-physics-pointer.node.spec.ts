// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {isGLTFPhysicsPropertyPointer} from '../../src/parsers/parse-gltf-physics-pointer';

it('qualifies declared motion material joint shape and vector-component pointer syntax', () => {
  const motion = '/nodes/0/extensions/KHR_physics_rigid_bodies/motion/';
  for (const field of [
    'isKinematic',
    'mass',
    'centerOfMass',
    'inertiaDiagonal',
    'inertiaOrientation',
    'linearVelocity',
    'angularVelocity',
    'gravityFactor'
  ])
    expect(isGLTFPhysicsPropertyPointer(motion + field)).toBe(true);
  for (const [field, size] of [
    ['centerOfMass', 3],
    ['inertiaDiagonal', 3],
    ['inertiaOrientation', 4],
    ['linearVelocity', 3],
    ['angularVelocity', 3]
  ] as const) {
    for (let component = 0; component < size; component++)
      expect(isGLTFPhysicsPropertyPointer(`${motion}${field}/${component}`)).toBe(true);
    expect(isGLTFPhysicsPropertyPointer(`${motion}${field}/${size}`)).toBe(false);
  }
  for (const field of ['staticFriction', 'dynamicFriction', 'restitution'])
    expect(
      isGLTFPhysicsPropertyPointer(
        `/extensions/KHR_physics_rigid_bodies/physicsMaterials/0/${field}`
      )
    ).toBe(true);
  for (const field of ['maxForce', 'positionTarget', 'velocityTarget', 'stiffness', 'damping'])
    expect(
      isGLTFPhysicsPropertyPointer(
        `/extensions/KHR_physics_rigid_bodies/physicsJoints/0/drives/0/${field}`
      )
    ).toBe(true);
  for (const pointer of [
    motion + 'mass/0',
    motion + 'linearVelocity/-1',
    motion + 'linearVelocity/01',
    '/extensions/KHR_implicit_shapes/shapes/0/box/size/3'
  ])
    expect(isGLTFPhysicsPropertyPointer(pointer)).toBe(false);
});
