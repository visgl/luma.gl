// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFNodePostprocessed, GLTFPostprocessed} from '@loaders.gl/gltf';
import {Matrix4} from '@math.gl/core';

/** Accessor values authored on an `EXT_mesh_gpu_instancing` node. */
export type GLTFInstanceAttribute = {
  /** Flattened typed accessor values, preserved without CPU aliases. */
  value: ArrayBufferView;
  /** Number of scalar components in one instance value. */
  size: number;
  /** Number of source instances. */
  count: number;
  /** Whether integer components are normalized by the glTF accessor. */
  normalized: boolean;
};

/** Source-authored glTF instance data and resolved local transforms. */
export type GLTFGPUInstancing = {
  /** Local instance matrices in source accessor order. */
  matrices: Matrix4[];
  /** All authored instance attributes, including application-specific `_NAME` semantics. */
  attributes: Readonly<Record<string, GLTFInstanceAttribute>>;
};

/** Resolves accessor-backed `EXT_mesh_gpu_instancing` transforms for one glTF node. */
export function getGLTFNodeInstancing(
  gltf: GLTFPostprocessed,
  node: GLTFNodePostprocessed
): GLTFGPUInstancing | null {
  const sourceAttributes = node.extensions?.['EXT_mesh_gpu_instancing']?.attributes;
  if (!sourceAttributes || typeof sourceAttributes !== 'object') {
    return null;
  }

  const attributes: Record<string, GLTFInstanceAttribute> = {};
  let instanceCount: number | undefined;

  for (const [attributeName, accessorReference] of Object.entries(sourceAttributes)) {
    const accessor =
      typeof accessorReference === 'number'
        ? gltf.accessors[accessorReference]
        : (accessorReference as GLTFPostprocessed['accessors'][number]);

    if (!accessor || !ArrayBuffer.isView(accessor.value)) {
      throw new Error(`Invalid glTF instance accessor for ${attributeName}`);
    }
    if (instanceCount !== undefined && accessor.count !== instanceCount) {
      throw new Error('glTF instance attributes must have matching accessor counts');
    }

    instanceCount = accessor.count;
    attributes[attributeName] = {
      value: accessor.value,
      size: accessor.components || getAccessorComponentCount(accessor.type),
      count: accessor.count,
      normalized: Boolean(accessor.normalized)
    };
  }

  const matrices: Matrix4[] = [];
  for (let instanceIndex = 0; instanceIndex < (instanceCount || 0); instanceIndex++) {
    const translation = getInstanceValues(attributes['TRANSLATION'], instanceIndex, [0, 0, 0]);
    const rotation = getInstanceValues(attributes['ROTATION'], instanceIndex, [0, 0, 0, 1]);
    const scale = getInstanceValues(attributes['SCALE'], instanceIndex, [1, 1, 1]);
    const rotationLength = Math.hypot(...rotation);
    if (rotationLength > 0) {
      for (let component = 0; component < rotation.length; component++) {
        rotation[component] /= rotationLength;
      }
    }
    matrices.push(
      new Matrix4()
        .translate(translation)
        .multiplyRight(new Matrix4().fromQuaternion(rotation))
        .scale(scale)
    );
  }

  return {matrices, attributes};
}

function getInstanceValues(
  attribute: GLTFInstanceAttribute | undefined,
  instanceIndex: number,
  defaultValues: number[]
): number[] {
  if (!attribute) {
    return [...defaultValues];
  }

  const values = attribute.value as unknown as ArrayLike<number>;
  return defaultValues.map((defaultValue, componentIndex) => {
    const component = values[instanceIndex * attribute.size + componentIndex];
    if (component === undefined) {
      return defaultValue;
    }
    if (!attribute.normalized) {
      return component;
    }
    if (attribute.value instanceof Int8Array) {
      return Math.max(component / 127, -1);
    }
    if (attribute.value instanceof Int16Array) {
      return Math.max(component / 32767, -1);
    }
    if (attribute.value instanceof Uint8Array) {
      return component / 255;
    }
    if (attribute.value instanceof Uint16Array) {
      return component / 65535;
    }
    return component;
  });
}

function getAccessorComponentCount(type: string | undefined): number {
  switch (type) {
    case 'VEC2':
      return 2;
    case 'VEC3':
      return 3;
    case 'VEC4':
      return 4;
    default:
      return 1;
  }
}
