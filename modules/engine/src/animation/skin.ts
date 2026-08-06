// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix4, type NumericArray} from '@math.gl/core';

import type {GroupNode} from '../scenegraph/group-node';

/** Format-independent inputs for evaluating a skinned mesh's joint palette. */
export type SkinJointMatricesProps = {
  /** Joints in their authored palette order. */
  joints: readonly GroupNode[];
  /** Animated scenegraph node that owns the skinned mesh. */
  meshNode?: GroupNode;
  /** World transforms collected once for the animated scene hierarchy. */
  worldMatrices: ReadonlyMap<GroupNode, Readonly<NumericArray>>;
  /** Optional column-major inverse bind matrix for each joint. */
  inverseBindMatrices?: ArrayLike<number>;
  /** Existing output storage that can be reused across animation frames. */
  target?: Float32Array;
};

/** Evaluates joint matrices in mesh-local space without owning a skeleton or GPU resources. */
export function updateSkinJointMatrices(props: SkinJointMatricesProps): Float32Array {
  const {joints, meshNode, worldMatrices, inverseBindMatrices, target} = props;
  const matrixCount = joints.length;
  const jointMatrices =
    target && target.length === matrixCount * 16 ? target : new Float32Array(matrixCount * 16);
  const meshWorldMatrix = meshNode ? worldMatrices.get(meshNode) || meshNode.matrix : undefined;
  const inverseMeshMatrix = meshWorldMatrix ? new Matrix4(meshWorldMatrix).invert() : null;

  for (let jointIndex = 0; jointIndex < matrixCount; jointIndex++) {
    const jointNode = joints[jointIndex];
    const jointWorldMatrix = worldMatrices.get(jointNode) || jointNode.matrix;
    const jointMatrix = inverseMeshMatrix
      ? new Matrix4(inverseMeshMatrix).multiplyRight(jointWorldMatrix)
      : new Matrix4(jointWorldMatrix);
    const offset = jointIndex * 16;
    if (inverseBindMatrices && inverseBindMatrices.length >= offset + 16) {
      const inverseBindMatrix = new Matrix4();
      for (let componentIndex = 0; componentIndex < 16; componentIndex++) {
        inverseBindMatrix[componentIndex] = inverseBindMatrices[offset + componentIndex];
      }
      jointMatrix.multiplyRight(inverseBindMatrix);
    }
    jointMatrices.set(jointMatrix, offset);
  }

  return jointMatrices;
}
