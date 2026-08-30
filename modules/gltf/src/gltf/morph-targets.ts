// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  type Geometry,
  GroupNode,
  ModelNode,
  type MorphTargetAttributes,
  updateMorphTargetBuffers
} from '@luma.gl/engine';
import {Buffer, Texture} from '@luma.gl/core';

/** Immutable primitive attributes and glTF morph deltas retained by its existing model node. */
export type GLTFMorphTargetState = {
  geometry: Geometry;
  baseAttributes: MorphTargetAttributes;
  targets: readonly MorphTargetAttributes[];
};

/** GPU-owned morph weights for one ordinary glTF primitive. */
export type GLTFMorphWeightState = {
  values: Float32Array;
  data: Buffer | Texture;
  packedTargetCount: number;
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

      const gpuWeights = child.userData['gltfMorphWeights'] as GLTFMorphWeightState | undefined;
      if (gpuWeights) {
        updateGLTFMorphWeights(gpuWeights, weights);
        child.userData['morphWeights'] = [...weights];
        return;
      }

      updateMorphTargetBuffers(child.model, state.geometry, state.targets, weights);
      child.userData['morphWeights'] = [...weights];
    });
  }
}

function updateGLTFMorphWeights(state: GLTFMorphWeightState, weights: readonly number[]): void {
  state.values.fill(0);
  state.values.set(weights.slice(0, state.values.length));
  if (state.data instanceof Buffer) {
    state.data.write(state.values);
  } else {
    state.data.writeData(state.values, {width: state.packedTargetCount, height: 1});
  }
}
