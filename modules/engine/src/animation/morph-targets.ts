// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry, type GeometryAttribute} from '../geometry/geometry';
import {makeInterleavedGeometry} from '../geometry/geometry-utils';
import type {Model} from '../model/model';

/** Portable vertex attributes supported by glTF-style morph target deformation. */
export type MorphTargetAttributes = {
  POSITION?: Float32Array;
  NORMAL?: Float32Array;
  TANGENT?: Float32Array;
};

/** Applies weighted morph deltas without modifying the immutable source vertex attributes. */
export function applyMorphTargets(
  baseAttributes: Readonly<MorphTargetAttributes>,
  targets: readonly Readonly<MorphTargetAttributes>[],
  weights: readonly number[]
): MorphTargetAttributes {
  const result: MorphTargetAttributes = {};

  for (const attributeName of ['POSITION', 'NORMAL', 'TANGENT'] as const) {
    const baseValues = baseAttributes[attributeName];
    if (!baseValues) {
      continue;
    }

    const values = new Float32Array(baseValues);
    const componentCount = attributeName === 'TANGENT' ? 4 : 3;
    const vertexCount = Math.floor(baseValues.length / componentCount);

    for (
      let targetIndex = 0;
      targetIndex < Math.min(targets.length, weights.length);
      targetIndex++
    ) {
      const weight = weights[targetIndex];
      const targetValues = targets[targetIndex][attributeName];
      if (!weight || !targetValues) {
        continue;
      }

      const targetComponentCount =
        attributeName === 'TANGENT' && targetValues.length === vertexCount * 4 ? 4 : 3;
      for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
        const destinationOffset = vertexIndex * componentCount;
        const sourceOffset = vertexIndex * targetComponentCount;
        for (let componentIndex = 0; componentIndex < 3; componentIndex++) {
          values[destinationOffset + componentIndex] +=
            (targetValues[sourceOffset + componentIndex] || 0) * weight;
        }
      }
    }

    if (attributeName !== 'POSITION') {
      normalizeMorphDirections(values, componentCount);
    }
    result[attributeName] = values;
  }

  return result;
}

/** Rewrites an existing model vertex buffer while preserving its canonical interleaved layout. */
export function updateMorphTargetBuffers(
  model: Model,
  geometry: Geometry,
  targets: readonly Readonly<MorphTargetAttributes>[],
  weights: readonly number[]
): void {
  const baseAttributes: MorphTargetAttributes = {};
  for (const attributeName of ['POSITION', 'NORMAL', 'TANGENT'] as const) {
    const values = geometry.attributes[attributeName]?.value;
    if (values instanceof Float32Array) {
      baseAttributes[attributeName] = values;
    }
  }

  const morphedAttributes = applyMorphTargets(baseAttributes, targets, weights);
  const attributes: Record<string, GeometryAttribute> = {};
  for (const [attributeName, attribute] of Object.entries(geometry.attributes)) {
    if (attribute) {
      attributes[attributeName] = attribute;
    }
  }
  for (const attributeName of ['POSITION', 'NORMAL', 'TANGENT'] as const) {
    const values = morphedAttributes[attributeName];
    const source = attributes[attributeName];
    if (values && source) {
      attributes[attributeName] = {...source, value: values};
    }
  }

  const morphedGeometry = new Geometry({
    id: geometry.id,
    topology: geometry.topology || 'triangle-list',
    vertexCount: geometry.vertexCount,
    indices: geometry.indices,
    attributes,
    bufferLayout: geometry.bufferLayout
  });
  const interleaved = makeInterleavedGeometry(morphedGeometry);
  const packedValues = interleaved.attributes['geometry']?.value;
  const packedBuffer =
    model._gpuGeometry?.attributes['geometry'] || model.bufferAttributes['geometry'];
  if (packedValues && packedBuffer) {
    packedBuffer.write(packedValues);
    return;
  }

  for (const attributeName of ['POSITION', 'NORMAL', 'TANGENT'] as const) {
    const values = morphedAttributes[attributeName];
    if (values) {
      const shaderAttributeName =
        attributeName === 'POSITION'
          ? 'positions'
          : attributeName === 'NORMAL'
            ? 'normals'
            : 'TANGENT';
      model.bufferAttributes[shaderAttributeName]?.write(values);
    }
  }
}

function normalizeMorphDirections(values: Float32Array, componentCount: number): void {
  for (let offset = 0; offset < values.length; offset += componentCount) {
    const length = Math.hypot(values[offset], values[offset + 1], values[offset + 2]);
    if (length > 0) {
      values[offset] /= length;
      values[offset + 1] /= length;
      values[offset + 2] /= length;
    }
  }
}
