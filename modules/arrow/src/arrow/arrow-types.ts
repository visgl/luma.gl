// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SignedDataType, BigTypedArray} from '@luma.gl/core';
import * as arrow from 'apache-arrow';

export type NumericArrowType = arrow.Int | arrow.Float;

/** An instance attribute-compatible column - has 1-4 (fixed) numeric values per row */
export type AttributeArrowType = NumericArrowType | arrow.FixedSizeList<NumericArrowType>;

/** A non-instance attribute compatible column - has a list of 1-4 (fixed) numeric values per row */
export type MeshArrowType = arrow.List<NumericArrowType | arrow.FixedSizeList<NumericArrowType>>;

/** Extracted information required to populate a mesh */
export type ArrowColumnInfo = {
  stepMode: 'instance' | 'vertex';
  signedDataType: SignedDataType;
  components: 1 | 2 | 3 | 4;
  values: BigTypedArray[];
  offsets: Uint32Array[][];
};

export function isNumericArrowType(type: arrow.DataType): type is arrow.Int | arrow.Float {
  return arrow.DataType.isFloat(type) || arrow.DataType.isInt(type);
}

/** Instance = One "vec1-vec4 value" per step */
export function isInstanceArrowType(type: arrow.DataType): type is AttributeArrowType {
  return (
    isNumericArrowType(type) ||
    (arrow.DataType.isFixedSizeList(type) && isNumericArrowType(type.children[0].type))
    // TODO - check listSize?
  );
}

/** Vertex = Multiple "vec1-vec4 values" per step */
export function isVertexArrowType(type: arrow.DataType): type is MeshArrowType {
  return arrow.DataType.isList(type) && isInstanceArrowType(type.children[0].type);
}

/** Get the luma.gl signed shader type corresponding to an Apache Arrow type */
export function getSignedShaderType(
  arrowType: NumericArrowType,
  size: 1 | 2 | 3 | 4
): SignedDataType {
  if (arrow.DataType.isInt(arrowType)) {
    switch (arrowType.bitWidth) {
      case 8:
        return arrowType.isSigned ? 'sint8' : 'uint8';
      case 16:
        return arrowType.isSigned ? 'sint16' : 'uint16';
      case 32:
        return arrowType.isSigned ? 'sint32' : 'uint32';
      case 64:
        throw new Error('64-bit integers are not supported in shaders');
    }
  }

  if (arrow.DataType.isFloat(arrowType)) {
    switch (arrowType.precision) {
      case arrow.Precision.HALF:
        return 'float16';
      case arrow.Precision.SINGLE:
        return 'float32';
      case arrow.Precision.DOUBLE:
        throw new Error('Double precision floats are not supported in shaders');
    }
  }

  throw new Error(`Unsupported arrow type ${arrowType}`);
}
