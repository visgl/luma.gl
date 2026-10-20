// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4, Quaternion} from '@math.gl/core';

export type PhysicsVector = [number, number, number];
export type PhysicsRotation = [number, number, number, number];

export function readPhysicsVector(value: unknown, fallback: PhysicsVector): PhysicsVector {
  if (value === undefined) return [...fallback];
  if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite))
    throw new Error('Expected a finite three-component vector');
  return [value[0], value[1], value[2]];
}
export function readPhysicsRotation(value: unknown): PhysicsRotation {
  if (value === undefined) return [0, 0, 0, 1];
  if (!Array.isArray(value) || value.length !== 4 || !value.every(Number.isFinite))
    throw new Error('Expected a finite quaternion');
  const length = Math.hypot(...value);
  if (length === 0) throw new Error('Quaternion must be nonzero');
  return [value[0] / length, value[1] / length, value[2] / length, value[3] / length];
}
export function transformPhysicsVector(
  matrix: Matrix4,
  vector: readonly number[],
  point = false
): PhysicsVector {
  const result = point ? matrix.transformAsPoint(vector) : matrix.transformAsVector(vector);
  return [result[0], result[1], result[2]];
}
/** Resolve affine TRS; reflection stays in signed scale and shear is rejected. */
export function decomposePhysicsTransform(matrix: Matrix4): {
  position: PhysicsVector;
  rotation: PhysicsRotation;
  scale: PhysicsVector;
} {
  if (
    !matrix.every(Number.isFinite) ||
    Math.abs(matrix[3]) + Math.abs(matrix[7]) + Math.abs(matrix[11]) > 1e-7 ||
    Math.abs(matrix[15] - 1) > 1e-7
  )
    throw new Error('Expected an affine transform');
  const scale: PhysicsVector = [
    Math.hypot(matrix[0], matrix[1], matrix[2]),
    Math.hypot(matrix[4], matrix[5], matrix[6]),
    Math.hypot(matrix[8], matrix[9], matrix[10])
  ];
  if (scale.some(value => value < 1e-10))
    throw new Error('Singular collider transforms are unsupported');
  if (matrix.determinant() < 0) scale[0] = -scale[0];
  const axes = [
    matrix[0] / scale[0],
    matrix[1] / scale[0],
    matrix[2] / scale[0],
    matrix[4] / scale[1],
    matrix[5] / scale[1],
    matrix[6] / scale[1],
    matrix[8] / scale[2],
    matrix[9] / scale[2],
    matrix[10] / scale[2]
  ];
  for (const [first, second] of [
    [0, 1],
    [0, 2],
    [1, 2]
  ]) {
    const product =
      axes[first * 3] * axes[second * 3] +
      axes[first * 3 + 1] * axes[second * 3 + 1] +
      axes[first * 3 + 2] * axes[second * 3 + 2];
    if (Math.abs(product) > 1e-5) throw new Error('Sheared collider transforms are unsupported');
  }
  const quaternion = new Quaternion().fromMatrix3(axes).normalize();
  return {
    position: [matrix[12], matrix[13], matrix[14]],
    rotation: [quaternion[0], quaternion[1], quaternion[2], quaternion[3]],
    scale
  };
}
