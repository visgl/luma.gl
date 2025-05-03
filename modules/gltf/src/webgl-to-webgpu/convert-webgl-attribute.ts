// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TODO: convert in loaders.gl?
import type {TypedArray} from '@math.gl/types';

export const ATTRIBUTE_TYPE_TO_COMPONENTS: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

export const ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY: Record<number, any> = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
};

type GLTFAccessor = {
  componentType: number;
  type: string;
  count: number;
  bufferView?: {data: {buffer: ArrayBuffer; byteOffset?: number}};
  byteOffset?: number;
};

export function accessorToTypedArray(accessor: GLTFAccessor): {
  typedArray: TypedArray;
  components: number;
} {
  const ArrayType = ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY[accessor.componentType];
  const components = ATTRIBUTE_TYPE_TO_COMPONENTS[accessor.type];
  const length = components * accessor.count;
  const {buffer, byteOffset = 0} = accessor.bufferView?.data ?? {};

  const typedArray = new ArrayType(buffer, byteOffset + (accessor.byteOffset || 0), length);

  return {typedArray, components};
}
