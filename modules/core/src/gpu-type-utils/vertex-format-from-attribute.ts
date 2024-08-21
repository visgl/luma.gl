// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray, TypedArrayConstructor} from '../types';
import {VertexFormat} from './vertex-formats';

// import {DataType} from '../types/vertex-formats';
// type Omit<DataType, 'float16'> unfortunately breaks Typescript inferance
type DataType = 'uint8' | 'sint8' | 'uint16' | 'sint16' | 'uint32' | 'sint32' | 'float32';
type DataTypeNorm = 'unorm8' | 'snorm8' | 'unorm16' | 'snorm16';

export function getDataTypeFromTypedArray(
  arrayOrType: TypedArray | TypedArrayConstructor
): DataType {
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

export function getTypedArrayFromDataType(
  dataType: DataType | DataTypeNorm
): TypedArrayConstructor {
  switch (dataType) {
    case 'float32':
      return Float32Array;
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
      // Failed to deduce typed array from data type
      throw new Error(dataType);
  }
}

/** Get the vertex format for an attribute with TypedArray and size */
export function getVertexFormatFromAttribute(
  typedArray: TypedArray,
  size: number,
  normalized?: boolean
): VertexFormat {
  if (!size || size > 4) {
    throw new Error(`size ${size}`);
  }

  const components = size as 1 | 2 | 3 | 4;
  let dataType: DataType | DataTypeNorm = getDataTypeFromTypedArray(typedArray);

  // TODO - Special cases for WebGL (not supported on WebGPU), overrides the check below
  if (dataType === 'uint8' && normalized && components === 1) {
    return 'unorm8-webgl';
  }
  if (dataType === 'uint8' && normalized && components === 3) {
    return 'unorm8x3-webgl';
  }

  if (dataType === 'uint8' || dataType === 'sint8') {
    if (components === 1 || components === 3) {
      // WebGPU 8 bit formats must be aligned to 16 bit boundaries');
      throw new Error(`size: ${size}`);
    }
    if (normalized) {
      dataType = dataType.replace('int', 'norm') as 'unorm8' | 'snorm8';
    }
    return `${dataType}x${components}`;
  }
  if (dataType === 'uint16' || dataType === 'sint16') {
    if (components === 1 || components === 3) {
      // WebGPU 16 bit formats must be aligned to 32 bit boundaries
      throw new Error(`size: ${size}`);
    }
    if (normalized) {
      dataType = dataType.replace('int', 'norm') as 'unorm16' | 'snorm16';
    }
    return `${dataType}x${components}`;
  }

  if (components === 1) {
    return dataType;
  }

  return `${dataType}x${components}`;
}
