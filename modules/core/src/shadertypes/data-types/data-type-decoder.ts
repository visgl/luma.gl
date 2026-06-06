// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray, TypedArrayConstructor} from '../../types';
import type {
  DataTypeInfo,
  NormalizedDataType,
  SignedDataType,
  TypedArrayConstructorT
} from './data-types';
import {
  alignTo as alignDataType,
  getDataType as decodeDataType,
  getDataTypeInfo as decodeDataTypeInfo,
  getNormalizedDataType as decodeNormalizedDataType,
  getTypedArrayConstructor as decodeTypedArrayConstructor
} from './decode-data-types';

export class DataTypeDecoder {
  /**
   * Gets info about a data type constant (signed or normalized)
   * @returns underlying primitive / signed types, byte length, normalization, integer, signed flags
   */
  getDataTypeInfo<T extends NormalizedDataType = NormalizedDataType>(type: T): DataTypeInfo<T> {
    return decodeDataTypeInfo(type) as DataTypeInfo<T>;
  }

  /** Build a vertex format from a signed data type and a component */
  getNormalizedDataType(signedDataType: SignedDataType): NormalizedDataType {
    return decodeNormalizedDataType(signedDataType);
  }

  /** Align offset to 1, 2 or 4 elements (4, 8 or 16 bytes) */
  alignTo(size: number, count: number): number {
    return alignDataType(size, count);
  }

  /** Returns the VariableShaderType that corresponds to a typed array */
  getDataType(arrayOrType: TypedArray | TypedArrayConstructor): SignedDataType {
    return decodeDataType(arrayOrType);
  }

  /** Returns the TypedArray that corresponds to a shader data type */
  getTypedArrayConstructor<T extends NormalizedDataType>(
    type: NormalizedDataType
  ): TypedArrayConstructorT<T> {
    return decodeTypedArrayConstructor(type) as unknown as TypedArrayConstructorT<T>;
  }
}

/** Entry point for decoding luma.gl data types */
export const dataTypeDecoder = new DataTypeDecoder();
