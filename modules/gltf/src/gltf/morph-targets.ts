// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type Geometry,
  GroupNode,
  ModelNode,
  type MorphTargetAttributes,
  updateMorphTargetBuffers
} from '@luma.gl/engine';

/** Immutable primitive attributes and glTF morph deltas retained by its existing model node. */
export type GLTFMorphTargetState = {
  geometry: Geometry;
  baseAttributes: MorphTargetAttributes;
  targets: readonly MorphTargetAttributes[];
};

/** Updates existing vertex buffers so morph animation works on both WebGL and WebGPU. */
export function setGLTFMorphWeights(node: GroupNode, weights: readonly number[]): void {
  node.userData['morphWeights'] = [...weights];
  const meshes = (node.userData['morphMeshes'] as readonly GroupNode[] | undefined) || [];
  for (const mesh of meshes) {
    mesh.preorderTraversal(child => {
      if (!(child instanceof ModelNode)) {
        return;
      }

      const state = child.userData['morphTargets'] as GLTFMorphTargetState | undefined;
      if (!state) {
        return;
      }

      updateMorphTargetBuffers(child.model, state.geometry, state.targets, weights);
      child.userData['morphWeights'] = [...weights];
    });
  }
}
