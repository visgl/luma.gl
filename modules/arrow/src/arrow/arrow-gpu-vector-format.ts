// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SignedDataType} from '@luma.gl/core';
import type {GPUVectorFormat} from '@luma.gl/tables';
import {DataType, Precision} from 'apache-arrow';

/** Returns the GPUVector memory format implied by an Arrow data type. */
export function getGPUVectorFormatFromArrowDataType(type: DataType): GPUVectorFormat {
  const isVertexList = DataType.isList(type);
  const elementType = isVertexList ? type.children[0].type : type;
  const scalarType = DataType.isFixedSizeList(elementType)
    ? elementType.children[0].type
    : elementType;
  const size = DataType.isFixedSizeList(elementType) ? elementType.listSize : 1;

  if (!Number.isInteger(size) || size < 1 || size > 4) {
    throw new Error(`Cannot synthesize a GPUVector format for Arrow type ${type}`);
  }

  const signedDataType = getSignedArrowDataType(scalarType);
  if (signedDataType === 'float16' && size === 3) {
    throw new Error('Cannot synthesize a float16x3 GPUVector format');
  }

  const elementFormat =
    size === 1
      ? signedDataType
      : size === 3 && isWebGLOnlyIntegerFormat(signedDataType)
        ? `${signedDataType}x3-webgl`
        : `${signedDataType}x${size}`;

  return isVertexList
    ? (`vertex-list<${elementFormat}>` as GPUVectorFormat)
    : (elementFormat as GPUVectorFormat);
}

function getSignedArrowDataType(type: DataType): SignedDataType {
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

function isWebGLOnlyIntegerFormat(signedDataType: SignedDataType): boolean {
  switch (signedDataType) {
    case 'uint8':
    case 'sint8':
    case 'uint16':
    case 'sint16':
      return true;
    default:
      return false;
  }
}
