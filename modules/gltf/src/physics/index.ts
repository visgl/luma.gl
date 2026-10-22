// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPURigidBodyWorld, type GPURigidBodyWorldProps} from '@luma.gl/gpu-graph/gpu-physics';
import type {GLTFPhysicsDescription} from './physics-types';
export {makeGLTFPhysicsMeshResolver} from './mesh-snapshot';
export {parseGLTFPhysics, GLTF_PHYSICS_DRAFT} from './parse-gltf-physics';
export type {
  GLTFPhysicsDocument,
  GLTFPhysicsDescription,
  GLTFPhysicsBody,
  GLTFPhysicsCollider,
  GLTFPhysicsIssue,
  ParseGLTFPhysicsOptions
} from './physics-types';

/** No partial simulation: inspect description.issues before creating a world. Rendering is separate. */
export function createGLTFPhysicsWorld(
  description: GLTFPhysicsDescription,
  options: Omit<GPURigidBodyWorldProps, 'bodies'> = {}
): GPURigidBodyWorld {
  if (!description.supported || description.issues.length)
    throw new Error('Unsupported glTF physics description');
  return new GPURigidBodyWorld({
    ...options,
    gravity: options.gravity ?? [0, -9.81, 0],
    bodies: description.bodies.map(definition => definition.body)
  });
}
