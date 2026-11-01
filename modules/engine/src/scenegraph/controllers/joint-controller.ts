// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {ScenegraphNode} from '../scenegraph-node';
import {GroupNode} from '../group-node';
import {decomposePhysicsTransform} from '../physics-transforms';

/** Shared physical constraint metadata. Skinning joints do not imply these constraints. */
import type {
  GPURigidBodyJointLimit as ScenegraphJointLimit,
  GPURigidBodyJointDrive as ScenegraphJointDrive
} from '@luma.gl/graph/gpu-physics';
export type {
  GPURigidBodyJointLimit as ScenegraphJointLimit,
  GPURigidBodyJointDrive as ScenegraphJointDrive
} from '@luma.gl/graph/gpu-physics';

export type ScenegraphJoint = {
  first: ScenegraphNode;
  second: ScenegraphNode;
  limits?: readonly ScenegraphJointLimit[];
  drives?: readonly ScenegraphJointDrive[];
  collideConnected?: boolean;
  enabled?: boolean;
};
export type ScenegraphJointAttachment = {
  /** Null means the attachment is fixed in world space. */
  body: ScenegraphNode | null;
  position: [number, number, number];
  orientation: [number, number, number, number];
};
export type ResolvedScenegraphJoint = {
  joint: ScenegraphJoint;
  first: ScenegraphJointAttachment;
  second: ScenegraphJointAttachment;
};

/** Resolves authored attachment nodes independently of file format and physics backend. */
export class JointController {
  constructor(readonly joints: readonly ScenegraphJoint[]) {}

  resolve(
    roots: readonly ScenegraphNode[],
    bodyNodes: ReadonlySet<ScenegraphNode>
  ): ResolvedScenegraphJoint[] {
    const worlds = new Map<ScenegraphNode, Matrix4>();
    const owners = new Map<ScenegraphNode, ScenegraphNode | null>();
    const visit = (node: ScenegraphNode, parentMatrix: Matrix4, owner: ScenegraphNode | null) => {
      if (worlds.has(node)) throw new Error('Joint scene must be a tree');
      const matrix = new Matrix4(parentMatrix).multiplyRight(node.matrix);
      const body = bodyNodes.has(node) ? node : owner;
      worlds.set(node, matrix);
      owners.set(node, body);
      if (node instanceof GroupNode) for (const child of node.children) visit(child, matrix, body);
    };
    for (const root of roots) visit(root, new Matrix4(), null);
    const attachment = (node: ScenegraphNode): ScenegraphJointAttachment => {
      const matrix = worlds.get(node);
      if (!matrix) throw new Error('Joint attachment is outside the scene');
      const body = owners.get(node) ?? null;
      let relative = new Matrix4(matrix);
      if (body) {
        // Physics body frames are rigid; authored scale is baked into the attachment offset.
        const transform = decomposePhysicsTransform(worlds.get(body)!);
        const frame = new Matrix4()
          .translate(transform.position)
          .multiplyRight(new Matrix4().fromQuaternion(transform.rotation));
        relative = frame.invert().multiplyRight(relative);
      }
      const transform = decomposePhysicsTransform(relative);
      return {body, position: transform.position, orientation: transform.rotation};
    };
    return this.joints.map(joint => ({
      joint,
      first: attachment(joint.first),
      second: attachment(joint.second)
    }));
  }
}
