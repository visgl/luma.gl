// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray, TypedArrayConstructor} from '../../types';
import {
  PrimitiveDataType,
  SignedDataType,
  NormalizedDataType,
  DataTypeInfo,
  TypedArrayConstructorT
} from './data-types';

export class DataTypeDecoder {
  /**
   * Gets info about a data type constant (signed or normalized)
   * @returns underlying primitive / signed types, byte length, normalization, integer, signed flags
   */
  getDataTypeInfo<T extends NormalizedDataType = NormalizedDataType>(type: T): DataTypeInfo<T> {
    const [signedType, primitiveType, byteLength] = NORMALIZED_TYPE_MAP[type];
    const normalized: boolean = type.includes('norm');
    const integer: boolean = !normalized && !type.startsWith('float');
    const signed: boolean = type.startsWith('s');
    return {
      signedType: signedType as DataTypeInfo<T>['signedType'],
      primitiveType: primitiveType as DataTypeInfo<T>['primitiveType'],
      byteLength: byteLength as DataTypeInfo<T>['byteLength'],
      normalized: normalized as DataTypeInfo<T>['normalized'],
      integer: integer as DataTypeInfo<T>['integer'],
      signed: signed as DataTypeInfo<T>['signed']
      // TODO - add webglOnly flag
    };
  }

  /** Build a vertex format from a signed data type and a component */
  getNormalizedDataType(signedDataType: SignedDataType): NormalizedDataType {
    const dataType: NormalizedDataType = signedDataType;
    // prettier-ignore
    switch (dataType) {
      case 'uint8': return 'unorm8';
      case 'sint8': return 'snorm8';
      case 'uint16': return 'unorm16';
      case 'sint16': return 'snorm16';
      default: return dataType;
    }
  }

  /** Align offset to 1, 2 or 4 elements (4, 8 or 16 bytes) */
  alignTo(size: number, count: number): number {
    // prettier-ignore
    switch (count) {
      case 1: return size; // Pad upwards to even multiple of 2
      case 2: return size + (size % 2); // Pad upwards to even multiple of 2
      default: return size + ((4 - (size % 4)) % 4); // Pad upwards to even multiple of 4
    }
  }

  /** Returns the VariableShaderType that corresponds to a typed array */
  getDataType(arrayOrType: TypedArray | TypedArrayConstructor): SignedDataType {
    const Constructor = ArrayBuffer.isView(arrayOrType) ? arrayOrType.constructor : arrayOrType;
    if (Constructor === Uint8ClampedArray) {
      return 'uint8';
    }
    const info = Object.values(NORMALIZED_TYPE_MAP).find(entry => Constructor === entry[4]);
    if (!info) {
      throw new Error(Constructor.name);
    }
    return info[0];
  }

  /** Returns the TypedArray that corresponds to a shader data type */
  getTypedArrayConstructor<T extends NormalizedDataType>(
    type: NormalizedDataType
  ): TypedArrayConstructorT<T> {
    const [, , , , Constructor] = NORMALIZED_TYPE_MAP[type];
    return Constructor as unknown as TypedArrayConstructorT<T>;
  }
}

export const dataTypeDecoder = new DataTypeDecoder();

const NORMALIZED_TYPE_MAP = {
  uint8: ['uint8', 'u32', 1, false, Uint8Array],
  sint8: ['sint8', 'i32', 1, false, Int8Array],
  unorm8: ['uint8', 'f32', 1, true, Uint8Array],
  snorm8: ['sint8', 'f32', 1, true, Int8Array],
  uint16: ['uint16', 'u32', 2, false, Uint16Array],
  sint16: ['sint16', 'i32', 2, false, Int16Array],
  unorm16: ['uint16', 'u32', 2, true, Uint16Array],
  snorm16: ['sint16', 'i32', 2, true, Int16Array],
  float16: ['float16', 'f16', 2, false, Uint16Array],
  float32: ['float32', 'f32', 4, false, Float32Array],
  uint32: ['uint32', 'u32', 4, false, Uint32Array],
  sint32: ['sint32', 'i32', 4, false, Int32Array]
} satisfies Record<
  NormalizedDataType,
  [
    SignedDataType,
    PrimitiveDataType,
    bytes: 1 | 2 | 4,
    normalized: boolean,
    arrayConstructor: TypedArrayConstructor
  ]
>;
