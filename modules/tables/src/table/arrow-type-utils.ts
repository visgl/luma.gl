// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  NormalizedDataType,
  SignedDataType,
  TypedArray,
  TypedArrayConstructor
} from '@luma.gl/core';
import {getFloat16ArrayConstructor, isFloat16ArrayConstructor} from '@luma.gl/core';
import {
  DataType,
  Field,
  FixedSizeList,
  Float16,
  Float32,
  Int16,
  Int32,
  Int8,
  Precision,
  Uint16,
  Uint32,
  Uint8,
  util
} from 'apache-arrow';

export type ArrowDataType = DataType;

export function getArrowDataType(type: SignedDataType, size: number): DataType {
  const scalarType = getArrowScalarType(type);
  return size === 1 ? scalarType : new FixedSizeList(size, new Field('value', scalarType, false));
}

export function validateArrowDataType(
  type: DataType,
  supportedTypes: readonly DataType[],
  name: string = 'Arrow data'
): void {
  if (supportedTypes.some(supportedType => util.compareTypes(type, supportedType))) {
    return;
  }

  throw new Error(`${name} type ${type} is not supported`);
}

export function getArrowScalarType(type: SignedDataType): DataType {
  switch (type) {
    case 'uint8':
      return new Uint8();
    case 'sint8':
      return new Int8();
    case 'uint16':
      return new Uint16();
    case 'sint16':
      return new Int16();
    case 'uint32':
      return new Uint32();
    case 'sint32':
      return new Int32();
    case 'float16':
      return new Float16();
    case 'float32':
      return new Float32();
    default:
      throw new Error(`Cannot synthesize an Arrow type for ${type}`);
  }
}

export function getScalarArrowType(type: DataType): DataType {
  return DataType.isFixedSizeList(type) ? type.children[0].type : type;
}

export function getSignedDataType(type: DataType): SignedDataType {
  if (DataType.isInt(type)) {
    switch (type.bitWidth) {
      case 8:
        return type.isSigned ? 'sint8' : 'uint8';
      case 16:
        return type.isSigned ? 'sint16' : 'uint16';
      case 32:
        return type.isSigned ? 'sint32' : 'uint32';
    }
  }

  if (DataType.isFloat(type)) {
    switch (type.precision) {
      case Precision.HALF:
        return 'float16';
      case Precision.SINGLE:
        return 'float32';
    }
  }

  throw new Error(`Unsupported GPUVector logical type ${type}`);
}

export function getArrowScalarByteLength(type: DataType): number {
  if (DataType.isInt(type)) {
    return type.bitWidth / 8;
  }
  if (DataType.isFloat(type)) {
    switch (type.precision) {
      case Precision.HALF:
        return 2;
      case Precision.SINGLE:
        return 4;
      case Precision.DOUBLE:
        return 8;
    }
  }
  throw new Error(`Unsupported GPUVector logical type ${type}`);
}

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
      if (isFloat16ArrayConstructor(type)) {
        return 'float16';
      }
      throw new Error(type.constructor.name);
  }
}

export function getTypedArrayFromDataType(dataType: NormalizedDataType): TypedArrayConstructor {
  switch (dataType) {
    case 'float32':
      return Float32Array;
    case 'float16':
      return getFloat16ArrayConstructor();
    case 'uint32':
      return Uint32Array;
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
    default:
      throw new Error(dataType);
  }
}
