// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SignedDataType, BigTypedArray} from '@luma.gl/core';
import * as arrow from 'apache-arrow';

/** Numeric Apache Arrow scalar types that can be represented as GPU vertex attributes. */
export type NumericArrowType = arrow.Int | arrow.Float;

/** Attribute-compatible Arrow column type with one to four numeric values per row. */
export type AttributeArrowType = NumericArrowType | arrow.FixedSizeList<NumericArrowType>;

/** Mesh-compatible Arrow column type with a list of attribute-compatible values per row. */
export type MeshArrowType = arrow.List<NumericArrowType | arrow.FixedSizeList<NumericArrowType>>;

/** Arrow column shape and numeric type information needed to derive a GPU vertex format. */
export type ArrowColumnInfo = {
  /** Whether values advance per instance or per vertex. */
  stepMode: 'instance' | 'vertex';
  /** luma.gl signed data type for the scalar values in the column. */
  signedDataType: SignedDataType;
  /** Number of scalar values per logical attribute. */
  components: 1 | 2 | 3 | 4;
  /** Underlying Arrow value buffers for this column. */
  values: BigTypedArray[];
  /** Nested list offsets for variable-length mesh columns. */
  offsets: Uint32Array[][];
};

/** Returns true when an Arrow type is an integer or floating point scalar type. */
export function isNumericArrowType(type: arrow.DataType): type is arrow.Int | arrow.Float {
  return arrow.DataType.isFloat(type) || arrow.DataType.isInt(type);
}

/** Returns true when an Arrow type can provide one scalar/vector attribute per row. */
export function isInstanceArrowType(type: arrow.DataType): type is AttributeArrowType {
  return (
    isNumericArrowType(type) ||
    (arrow.DataType.isFixedSizeList(type) && isNumericArrowType(type.children[0].type))
    // TODO - check listSize?
  );
}

/** Returns true when an Arrow type can provide multiple scalar/vector attributes per row. */
export function isVertexArrowType(type: arrow.DataType): type is MeshArrowType {
  return arrow.DataType.isList(type) && isInstanceArrowType(type.children[0].type);
}

/** Returns the luma.gl signed data type corresponding to a numeric Arrow type. */
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
