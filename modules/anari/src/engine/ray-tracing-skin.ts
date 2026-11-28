// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {decodeMorphTargetAttribute, type MorphTargetAttributes} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core/matrix';
import type {SceneSurface} from './scene-renderer';

/** Finds a CPU-readable glTF joint palette and the corresponding vertex influence attributes. */
export function getRaySkin(surface: SceneSurface) {
  const palette = surface.skin?.jointMatrices;
  const joints = surface.geometry.attributes['JOINTS_0'];
  const weights = surface.geometry.attributes['WEIGHTS_0'];
  return palette && palette.length >= 16 && joints?.size === 4 && weights?.size === 4
    ? {palette, joints: joints.value, weights}
    : undefined;
}

/** Bakes one retained skin pose into mesh-local vertex attributes after morphing. */
export function applyRaySkin(
  skin: NonNullable<ReturnType<typeof getRaySkin>>,
  attributes: MorphTargetAttributes & {POSITION: Float32Array; NORMAL: Float32Array}
): MorphTargetAttributes {
  const positions = attributes.POSITION;
  const normals = attributes.NORMAL;
  const tangents = attributes.TANGENT;
  const outputPositions = new Float32Array(positions);
  const outputNormals = new Float32Array(normals);
  const outputTangents = tangents && new Float32Array(tangents);
  const weights = decodeMorphTargetAttribute(skin.weights);
  const matrix = new Matrix4();
  const normalMatrix = new Matrix4();
  const input = [0, 0, 0];
  const output = [0, 0, 0];

  for (let vertex = 0; vertex * 3 + 2 < positions.length; vertex++) {
    const influenceOffset = vertex * 4;
    matrix.fill(0);
    let totalWeight = 0;
    for (let influence = 0; influence < 4; influence++) {
      const weight = weights[influenceOffset + influence];
      const joint = skin.joints[influenceOffset + influence];
      const jointOffset = joint * 16;
      if (
        !(weight > 0) ||
        !Number.isInteger(joint) ||
        joint < 0 ||
        jointOffset + 15 >= skin.palette.length
      )
        continue;
      totalWeight += weight;
      for (let component = 0; component < 16; component++) {
        matrix[component] += weight * skin.palette[jointOffset + component];
      }
    }
    if (totalWeight === 0) continue;
    for (let component = 0; component < 16; component++) matrix[component] /= totalWeight;

    const vertexOffset = vertex * 3;
    input[0] = positions[vertexOffset];
    input[1] = positions[vertexOffset + 1];
    input[2] = positions[vertexOffset + 2];
    matrix.transformAsPoint(input, output);
    outputPositions.set(output, vertexOffset);

    const determinant = matrix.determinant();
    if (determinant !== 0) {
      input[0] = normals[vertexOffset];
      input[1] = normals[vertexOffset + 1];
      input[2] = normals[vertexOffset + 2];
      normalMatrix.copy(matrix).invert().transpose().transformAsVector(input, output);
      normalizeRaySkinDirection(output);
      outputNormals.set(output, vertexOffset);
    }

    if (tangents && outputTangents) {
      input[0] = tangents[influenceOffset];
      input[1] = tangents[influenceOffset + 1];
      input[2] = tangents[influenceOffset + 2];
      matrix.transformAsVector(input, output);
      normalizeRaySkinDirection(output);
      outputTangents.set(output, influenceOffset);
      outputTangents[influenceOffset + 3] =
        tangents[influenceOffset + 3] * (determinant < 0 ? -1 : 1);
    }
  }
  return {POSITION: outputPositions, NORMAL: outputNormals, TANGENT: outputTangents};
}

/** Normalizes a transformed direction and preserves a degenerate zero vector. */
function normalizeRaySkinDirection(direction: number[]): void {
  const length = Math.hypot(direction[0], direction[1], direction[2]);
  if (length > 0) {
    direction[0] /= length;
    direction[1] /= length;
    direction[2] /= length;
  }
}
