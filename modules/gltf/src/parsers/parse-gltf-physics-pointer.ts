// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Address syntax only; scene construction resolves indices and supplies runtime bindings. */
export function isGLTFPhysicsPropertyPointer(pointer: string): boolean {
  return (
    /^\/extensions\/KHR_implicit_shapes\/shapes\/\d+\/(sphere\/radius|box\/size|(?:capsule|cylinder)\/(height|radiusBottom|radiusTop)|plane\/(sizeX|sizeZ|doubleSided))$/.test(
      pointer
    ) ||
    /^\/nodes\/\d+\/extensions\/KHR_physics_rigid_bodies\/(motion\/(isKinematic|mass|centerOfMass|inertiaDiagonal|inertiaOrientation|linearVelocity|angularVelocity|gravityFactor)|joint\/enableCollision)$/.test(
      pointer
    ) ||
    /^\/extensions\/KHR_physics_rigid_bodies\/physicsMaterials\/\d+\/(staticFriction|dynamicFriction|restitution)$/.test(
      pointer
    ) ||
    /^\/extensions\/KHR_physics_rigid_bodies\/physicsJoints\/\d+\/(limits\/\d+\/(min|max|stiffness|damping)|drives\/\d+\/(maxForce|positionTarget|velocityTarget|stiffness|damping))$/.test(
      pointer
    )
  );
}
