// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPURigidBodyWorld, type GPURigidBodyWorldProps} from '@luma.gl/graph/gpu-physics';
import {
  ScenegraphPhysicsBehaviors,
  type ScenegraphPhysicsDefinition
} from '@luma.gl/engine/physics';
import type {GLTFPhysicsDescription} from './physics-types';
export {makeGLTFPhysicsMeshResolver, type GLTFPhysicsMeshSource} from './mesh-snapshot';
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
    failurePolicy: 'rollback',
    ...options,
    gravity: options.gravity ?? [0, -9.81, 0],
    triggers: options.triggers ?? description.triggers.map(definition => definition.trigger),
    joints: options.joints ?? description.joints.map(definition => definition.joint),
    bodies: description.bodies.map(definition => definition.body)
  });
}

/** Resolve source indices once; runtime physics keeps engine node references. */
export function makeGLTFPhysicsBehaviors(
  world: GPURigidBodyWorld,
  description: GLTFPhysicsDescription,
  scene: Pick<
    import('../gltf/create-scenegraph-from-gltf').GLTFScenegraphs,
    'scenes' | 'gltfNodeIndexToNodeMap'
  >
): ScenegraphPhysicsBehaviors {
  const node = (index: number) => {
    const resolved = scene.gltfNodeIndexToNodeMap.get(index);
    if (!resolved) throw new Error('Missing physics scene node');
    return resolved;
  };
  return new ScenegraphPhysicsBehaviors(world, {
    roots: scene.scenes,
    nodes: scene.gltfNodeIndexToNodeMap,
    bodyNodes: new Map(
      description.bodies
        .filter(body => body.nodeIndex >= 0)
        .map(body => [node(body.nodeIndex), body.bodyIndex])
    ),
    colliderNodes: description.colliders.map(collider => node(collider.nodeIndex)),
    triggerNodes: description.triggers.map(trigger => node(trigger.nodeIndex)),
    querySelections: description.querySelections
  });
}

export {makeGLTFPhysicsProperties} from './property-bindings';

/** Bind a fresh import/collider snapshot to stable render-scene node references for rebuilds. */
export function makeGLTFPhysicsDefinition(
  description: GLTFPhysicsDescription,
  nodes: ReadonlyMap<number, import('@luma.gl/engine').ScenegraphNode>,
  options: Omit<GPURigidBodyWorldProps, 'bodies'> = {}
): ScenegraphPhysicsDefinition {
  if (!description.supported || description.issues.length)
    throw new Error('Unsupported glTF physics description');
  const bodies = new Map<import('@luma.gl/engine').ScenegraphNode, number>();
  for (const body of description.bodies)
    if (body.nodeIndex >= 0) {
      const node = nodes.get(body.nodeIndex);
      if (!node) throw new Error('Missing physics scene node');
      bodies.set(node, body.bodyIndex);
    }
  return {
    bodies,
    world: {
      failurePolicy: 'rollback',
      ...options,
      gravity: options.gravity ?? [0, -9.81, 0],
      triggers: options.triggers ?? description.triggers.map(definition => definition.trigger),
      joints: options.joints ?? description.joints.map(definition => definition.joint),
      bodies: description.bodies.map(definition => definition.body)
    }
  };
}
export {makeGLTFPhysicsScene} from './scene-bindings';

export {exportGLTFPhysicsState} from './export-state';

export {snapshotGLTFPhysicsScene} from './snapshot-scene';
