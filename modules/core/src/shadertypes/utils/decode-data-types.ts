// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray, TypedArrayConstructor} from '../../types';
import {PrimitiveDataType, SignedDataType, NormalizedDataType, DataTypeInfo} from '../data-types';

/**
 * Gets info about a data type constant (signed or normalized)
 * @returns underlying primitive / signed types, byte length, normalization, integer, signed flags
 */
export function getDataTypeInfo(type: NormalizedDataType): DataTypeInfo {
  const [signedType, primitiveType, byteLength] = NORMALIZED_TYPE_MAP[type];
  const normalized: boolean = type.includes('norm');
  const integer: boolean = !normalized && !type.startsWith('float');
  const signed: boolean = type.startsWith('s');

  return {
    signedType,
    primitiveType,
    byteLength,
    normalized,
    integer,
    signed
  };
}

/** Build a vertex format from a signed data type and a component */
export function makeNormalizedDataType(signedDataType: SignedDataType): NormalizedDataType {
  const dataType: NormalizedDataType = signedDataType;

  switch (dataType) {
    case 'uint8':
      return 'unorm8';
    case 'sint8':
      return 'snorm8';
    case 'uint16':
      return 'unorm16';
    case 'sint16':
      return 'snorm16';
    default:
      return dataType;
  }
}

/** Align offset to 1, 2 or 4 elements (4, 8 or 16 bytes) */
export function alignTo(size: number, count: number): number {
  // prettier-ignore
  switch (count) {
    case 1: return size; // Pad upwards to even multiple of 2
    case 2: return size + (size % 2); // Pad upwards to even multiple of 2
    default: return size + ((4 - (size % 4)) % 4); // Pad upwards to even multiple of 4
  }
}

/** Returns the VariableShaderType that corresponds to a typed array */
export function getDataTypeFromTypedArray(
  arrayOrType: TypedArray | TypedArrayConstructor
): SignedDataType {
  const type = ArrayBuffer.isView(arrayOrType) ? arrayOrType.constructor : arrayOrType;
  switch (type) {
    case Float32Array:
      return 'float32';
    case Uint16Array:
      return 'uint16';
    case Uint32Array:
      return 'uint32';
    case Uint8Array:
    case Uint8ClampedArray:
      return 'uint8';
    case Int8Array:
      return 'sint8';
    case Int16Array:
      return 'sint16';
    case Int32Array:
      return 'sint32';
    default:
      // Failed to deduce data type from typed array
      throw new Error(type.constructor.name);
  }
}

/** Returns the TypedArray that corresponds to a shader data type */
export function getTypedArrayFromDataType(
  type: NormalizedDataType | PrimitiveDataType
): TypedArrayConstructor {
  switch (type) {
    case 'f32':
    case 'float32':
      return Float32Array;
    case 'u32':
    case 'uint32':
      return Uint32Array;
    case 'i32':
    case 'sint32':
      return Int32Array;
    case 'uint16':
    case 'unorm16':
      return Uint16Array;
    case 'sint16':
    case 'snorm16':
      return Int16Array;
    case 'uint8':
    case 'unorm8':
      return Uint8Array;
    case 'sint8':
    case 'snorm8':
      return Int8Array;
    case 'f16':
    default:
      throw new Error(type);
  }
}

const NORMALIZED_TYPE_MAP: Record<
  NormalizedDataType,
  [SignedDataType, PrimitiveDataType, bytes: 1 | 2 | 4, normalized: boolean]
> = {
  uint8: ['uint8', 'u32', 1, false],
  sint8: ['sint8', 'i32', 1, false],
  unorm8: ['uint8', 'f32', 1, true],
  snorm8: ['sint8', 'f32', 1, true],
  uint16: ['uint16', 'u32', 2, false],
  sint16: ['sint16', 'i32', 2, false],
  unorm16: ['uint16', 'u32', 2, true],
  snorm16: ['sint16', 'i32', 2, true],
  float16: ['float16', 'f16', 2, false],
  float32: ['float32', 'f32', 4, false],
  uint32: ['uint32', 'u32', 4, false],
  sint32: ['sint32', 'i32', 4, false]
};
