// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Geometry} from '../../geometry/geometry';
import {GroupNode} from '../group-node';
import {ModelNode} from '../model-node';
import {type MorphTargetAttributes, updateMorphTargetBuffers} from '../../animation/morph-targets';
import {Buffer, Texture} from '@luma.gl/core';

/** Immutable primitive attributes and morph deltas retained by its existing model node. */
export type MorphTargetState = {
  geometry: Geometry;
  baseAttributes: MorphTargetAttributes;
  targets: readonly MorphTargetAttributes[];
};

/** GPU-owned morph weights for one ordinary primitive. */
export type MorphWeightState = {
  values: Float32Array;
  data: Buffer | Texture;
  packedTargetCount: number;
};

/** Updates existing vertex buffers so morph animation works on both WebGL and WebGPU. */
export function setMorphWeights(node: GroupNode, weights: readonly number[]): void {
  node.userData['morphWeights'] = [...weights];
  const meshes = (node.userData['morphMeshes'] as readonly GroupNode[] | undefined) || [];
  for (const mesh of meshes) {
    mesh.preorderTraversal(child => {
      if (!(child instanceof ModelNode)) {
        return;
      }

      const state = child.userData['morphTargets'] as MorphTargetState | undefined;
      if (!state) {
        return;
      }

      const gpuWeights = child.userData['morphWeightTransport'] as MorphWeightState | undefined;
      if (gpuWeights) {
        updateMorphWeights(gpuWeights, weights);
        child.userData['morphWeights'] = [...weights];
        return;
      }

      updateMorphTargetBuffers(child.model, state.geometry, state.targets, weights);
      child.userData['morphWeights'] = [...weights];
    });
  }
}

function updateMorphWeights(state: MorphWeightState, weights: readonly number[]): void {
  state.values.fill(0);
  state.values.set(weights.slice(0, state.values.length));
  if (state.data instanceof Buffer) {
    state.data.write(state.values);
  } else {
    state.data.writeData(state.values, {width: state.packedTargetCount, height: 1});
  }
}
