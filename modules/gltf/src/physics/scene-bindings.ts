// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ScenegraphNode} from '@luma.gl/engine';
import type {ScenegraphPhysicsScene, GPURigidBodyWorldProps} from '@luma.gl/graph/gpu-physics';
import {makeGLTFPhysicsDefinition} from './index';
import {makeGLTFPhysicsProperties} from './property-bindings';
import type {GLTFPhysicsDescription} from './physics-types';

/** Resolve glTF identities once; all stepping, ownership and lifecycle logic is engine-independent. */
export function makeGLTFPhysicsScene(
  description: GLTFPhysicsDescription,
  scene: {roots: readonly ScenegraphNode[]; nodes: ReadonlyMap<number, ScenegraphNode>} = {
    roots: description.sceneRoots,
    nodes: description.sceneNodes
  },
  options: Omit<GPURigidBodyWorldProps, 'bodies'> = {}
): ScenegraphPhysicsScene {
  const node = (index: number) => {
    const result = scene.nodes.get(index);
    if (!result) throw new Error('Missing physics scene node');
    return result;
  };
  const definition = makeGLTFPhysicsDefinition(description, scene.nodes, options);
  return {
    roots: scene.roots,
    definition,
    colliders: description.colliders.map(collider => ({
      node: node(collider.nodeIndex),
      body: node(description.bodies[collider.bodyIndex].nodeIndex),
      index: collider.colliderIndex,
      localMatrix: collider.localMatrix
    })),
    properties: world => makeGLTFPhysicsProperties(world, description),
    behaviors: {
      roots: scene.roots,
      nodes: scene.nodes,
      bodyNodes: definition.bodies,
      colliderNodes: description.colliders.map(collider => node(collider.nodeIndex)),
      triggerNodes: description.triggers.map(trigger => node(trigger.nodeIndex)),
      querySelections: description.querySelections
    }
  };
}
