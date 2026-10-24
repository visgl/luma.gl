// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Matrix4} from '@math.gl/core';
import {applyMorphTargets} from './morph-targets';

/** Explicit CPU snapshot for collision cooking/export. Rendering remains GPU driven. */
export function deformPositions(props: {
  positions: Float32Array;
  targets?: readonly Float32Array[];
  weights?: readonly number[];
  jointMatrices?: readonly Matrix4[];
  influences?: readonly {joints: readonly number[]; weights: readonly number[]}[];
}): Float32Array {
  const {positions, targets = [], weights = [], jointMatrices, influences = []} = props;
  if (
    positions.length % 3 ||
    targets.some(target => target.length !== positions.length) ||
    !weights.every(Number.isFinite)
  )
    throw new Error('Invalid position deformation');
  const result = applyMorphTargets(
    {POSITION: positions},
    targets.map(POSITION => ({POSITION})),
    weights
  ).POSITION!;
  if (!jointMatrices) {
    if (!result.every(Number.isFinite)) throw new Error('Nonfinite deformation');
    return result;
  }
  if (
    !influences.length ||
    influences.some(
      influence =>
        influence.joints.length !== (positions.length / 3) * 4 ||
        influence.weights.length !== influence.joints.length
    )
  )
    throw new Error('Invalid skin influences');
  for (let vertex = 0; vertex < result.length / 3; vertex++) {
    const original = Array.from(result.subarray(vertex * 3, vertex * 3 + 3));
    const point = [0, 0, 0];
    let totalWeight = 0;
    for (const influence of influences)
      for (let component = 0; component < 4; component++) {
        const offset = vertex * 4 + component;
        const weight = influence.weights[offset];
        if (!Number.isFinite(weight) || weight < 0) throw new Error('Invalid skin weight');
        if (!weight) continue;
        const index = influence.joints[offset];
        const matrix = jointMatrices[index];
        if (!Number.isInteger(index) || !matrix) throw new Error('Invalid skin joint');
        const transformed = matrix.transformAsPoint(original);
        for (let axis = 0; axis < 3; axis++) point[axis] += weight * transformed[axis];
        totalWeight += weight;
      }
    if (!(totalWeight > 0)) throw new Error('Empty skin weights');
    for (let axis = 0; axis < 3; axis++) result[vertex * 3 + axis] = point[axis] / totalWeight;
  }
  if (!result.every(Number.isFinite)) throw new Error('Nonfinite deformation');
  return result;
}
