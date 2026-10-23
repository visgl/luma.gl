// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parseGLTFJointDeclarations} from '../parsers/parse-gltf-joints';
import {Matrix4} from '@math.gl/core';
import {makeRigidBodyJointsFromScenegraph} from '@luma.gl/graph/gpu-physics';
import {GroupNode, JointController} from '@luma.gl/engine';
import type {GLTFPhysicsDescription} from './physics-types';

/** Resolve both attachment nodes after scene traversal, including forward references. */
export function parsePhysicsJoints(
  description: GLTFPhysicsDescription,
  worlds: ReadonlyMap<number, Matrix4>,
  parents: ReadonlyMap<number, number>
): void {
  const sceneNodes = new Map(
    Array.from(worlds, ([nodeIndex, world]) => {
      const parent = parents.get(nodeIndex);
      const matrix =
        parent === undefined
          ? world
          : new Matrix4(worlds.get(parent)!).invert().multiplyRight(world);
      return [nodeIndex, new GroupNode({id: `node-${nodeIndex}`, matrix})] as const;
    })
  );
  const roots: GroupNode[] = [];
  for (const [nodeIndex, node] of sceneNodes) {
    const parent = parents.get(nodeIndex);
    if (parent === undefined) roots.push(node);
    else sceneNodes.get(parent)!.add(node);
  }
  const bodyIndices = new Map(
    description.bodies.map(body => [sceneNodes.get(body.nodeIndex)!, body.bodyIndex])
  );
  const {declarations, issues} = parseGLTFJointDeclarations(description.source, sceneNodes);
  description.issues.push(...issues);
  const resolved = new JointController(declarations.map(item => item.joint)).resolve(
    roots,
    new Set(bodyIndices.keys())
  );
  let fixedWorldBody: number | undefined;
  if (resolved.some(item => !item.first.body || !item.second.body)) {
    fixedWorldBody = description.bodies.length;
    description.bodies.push({
      id: 'fixed-world',
      nodeIndex: -1,
      bodyIndex: fixedWorldBody,
      colliderIndices: [],
      centerOfMass: [0, 0, 0],
      worldMatrix: Array.from(new Matrix4()),
      body: {mode: 'static', mass: 0, position: [0, 0, 0], colliders: []}
    });
  }
  for (const [index, item] of resolved.entries()) {
    const {nodeIndex, connectedNodeIndex, jointIndex} = declarations[index];
    const joints = makeRigidBodyJointsFromScenegraph(item, bodyIndices, fixedWorldBody);
    description.joints.push(
      ...joints.map(joint => ({nodeIndex, connectedNodeIndex, jointIndex, joint}))
    );
  }
  description.sceneJoints = declarations.map(item => item.joint);
  description.sceneNodes = sceneNodes;
  description.sceneRoots = roots;
}
