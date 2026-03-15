// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TODO: convert in loaders.gl?
import type {TypedArray} from '@math.gl/types';

/** Maps glTF accessor type strings to their component counts. */
export const ATTRIBUTE_TYPE_TO_COMPONENTS: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

/** Maps glTF accessor component-type enums to typed-array constructors. */
export const ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY: Record<number, any> = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
};

/** Minimal accessor shape required to materialize a typed array. */
type GLTFAccessor = {
  /** Numeric component type enum. */
  componentType: number;
  /** Accessor type string such as `VEC3` or `SCALAR`. */
  type: string;
  /** Number of logical elements in the accessor. */
  count: number;
  /** Buffer view carrying the raw bytes. */
  bufferView?: {data: {buffer: ArrayBufferLike; byteOffset?: number}};
  /** Byte offset into the buffer view. */
  byteOffset?: number;
};

/** Converts a glTF accessor into a typed array plus its component count. */
export function accessorToTypedArray(accessor: GLTFAccessor): {
  /** Typed array view over the accessor data. */
  typedArray: TypedArray;
  /** Number of scalar components per element. */
  components: number;
} {
  const ArrayType = ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY[accessor.componentType];
  const components = ATTRIBUTE_TYPE_TO_COMPONENTS[accessor.type];
  const length = components * accessor.count;
  const {buffer, byteOffset = 0} = accessor.bufferView?.data ?? {};

  const typedArray = new ArrayType(buffer, byteOffset + (accessor.byteOffset || 0), length);

  return {typedArray, components};
}
