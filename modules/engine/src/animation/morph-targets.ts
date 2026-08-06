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

/** Decodes one immutable vertex attribute into its shader-facing floating-point values. */
export function decodeMorphTargetAttribute(attribute: GeometryAttribute): Float32Array {
  const values = attribute.value;
  if (values instanceof Float32Array) {
    return values;
  }

  const decoded = new Float32Array(values.length);
  const maximum = getNormalizedAttributeMaximum(values);
  const signed =
    values instanceof Int8Array || values instanceof Int16Array || values instanceof Int32Array;
  for (let componentIndex = 0; componentIndex < values.length; componentIndex++) {
    const value = Number(values[componentIndex]);
    decoded[componentIndex] =
      attribute['normalized'] && maximum
        ? signed
          ? Math.max(value / maximum, -1)
          : value / maximum
        : value;
  }
  return decoded;
}

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
    const attribute = geometry.attributes[attributeName];
    if (attribute) {
      baseAttributes[attributeName] = decodeMorphTargetAttribute(attribute);
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
      attributes[attributeName] = {...source, value: encodeMorphTargetAttribute(source, values)};
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

function encodeMorphTargetAttribute(
  attribute: GeometryAttribute,
  values: Float32Array
): GeometryAttribute['value'] {
  if (attribute.value instanceof Float32Array) {
    return values;
  }

  const encoded = attribute.value.slice();
  const maximum = getNormalizedAttributeMaximum(encoded);
  const signed =
    encoded instanceof Int8Array || encoded instanceof Int16Array || encoded instanceof Int32Array;
  for (let componentIndex = 0; componentIndex < values.length; componentIndex++) {
    const value = values[componentIndex];
    encoded[componentIndex] =
      attribute['normalized'] && maximum
        ? Math.round(Math.max(signed ? -1 : 0, Math.min(1, value)) * maximum)
        : value;
  }
  return encoded;
}

function getNormalizedAttributeMaximum(values: GeometryAttribute['value']): number {
  if (values instanceof Int8Array) return 127;
  if (values instanceof Uint8Array || values instanceof Uint8ClampedArray) return 255;
  if (values instanceof Int16Array) return 32767;
  if (values instanceof Uint16Array) return 65535;
  if (values instanceof Int32Array) return 2147483647;
  if (values instanceof Uint32Array) return 4294967295;
  return 0;
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
