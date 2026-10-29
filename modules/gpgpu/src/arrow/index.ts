// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type {NumericArrowType, ArrowColumnInfo} from './arrow-utils/arrow-types';
export {
  getArrowListNestingLevel,
  isNumericArrowType
  // isInstanceArrowType,
  // isVertexArrowType,
} from './arrow-utils/arrow-types';
export {
  getArrowPaths,
  getArrowDataByPath,
  getArrowVectorByPath
} from './arrow-utils/arrow-paths';
export {analyzeArrowTable, getArrowColumnInfo} from './arrow-utils/arrow-column-info';
export {
  makeArrowVectorFromArray,
  makeArrowFixedSizeListVector,
  isArrowFixedSizeListVector,
  getArrowFixedSizeListValues,
  getArrowVectorBufferSource
} from './vectors/arrow-fixed-size-list';
export {
  convertArrowMatrixToGPUVector,
  type PreparedArrowMatrixGPUVector,
  type ConvertArrowMatrixToGPUVectorOptions
} from './vectors/arrow-matrix-gpu-vector';
export {
  canConvertColors,
  convertColors,
  convertArrowColors,
  convertArrowColorsToArrow,
  type ArrowColorType
} from './arrow-colors';
export {
  getArrowMatrixVectorInfo,
  makeArrowMatrixVector,
  makeArrowMatrix2x2Vector,
  makeArrowMatrix2x3Vector,
  makeArrowMatrix3x2Vector,
  makeArrowMatrix3x3Vector,
  makeArrowMatrix4x3Vector,
  makeArrowMatrix3x4Vector,
  makeArrowMatrix4x4Vector,
  MATRIX_LAYOUT_METADATA_KEY,
  MATRIX_ORDER_METADATA_KEY,
  MATRIX_SHAPE_METADATA_KEY,
  type ArrowFloat32Matrix2x2,
  type ArrowFloat32Matrix2x3,
  type ArrowFloat32Matrix3x2,
  type ArrowFloat32Matrix3x3,
  type ArrowFloat32Matrix4x3,
  type ArrowFloat32Matrix3x4,
  type ArrowFloat32Matrix4x4,
  type ArrowMatrixLayout,
  type ArrowMatrixOrder,
  type ArrowMatrixShape,
  type ArrowMatrixValueType,
  type ArrowMatrixVectorInfo,
  type ArrowMatrixVectorOptions
} from './vectors/arrow-matrix-vector';
export {
  getArrowTemporalVectorInfo,
  convertArrowTemporalToGPUVector,
  convertArrowTemporalToGPUVectors,
  TEMPORAL_KIND_METADATA_KEY,
  TEMPORAL_ORIGIN_METADATA_KEY,
  TEMPORAL_ORIGIN_POLICY_METADATA_KEY,
  TEMPORAL_TIMEZONE_METADATA_KEY,
  TEMPORAL_UNIT_METADATA_KEY,
  type ArrowRelativeTemporalType,
  type ArrowTemporalColumnType,
  type ArrowTemporalKind,
  type ArrowTemporalOriginPolicy,
  type ArrowTemporalType,
  type ArrowTemporalUnit,
  type ArrowTemporalVectorInfo,
  type PreparedArrowTemporalGPUVector,
  type ConvertArrowTemporalToGPUVectorOptions,
  type ConvertArrowTemporalToGPUVectorsOptions
} from './vectors/arrow-temporal-gpu-vector';
export {
  expandArrowVector,
  getArrowVectorByteLength,
  type ArrowVectorNullValue,
  type ArrowVectorRowMapping
} from './vectors/arrow-vector-utils';
export {
  convertArrowToGPUVector,
  planArrowGPUConversion,
  type ArrowGPUConversionBackend,
  type ArrowGPUConversionCost,
  type ArrowGPUConversionOptions,
  type ArrowGPUConversionPlan,
  type ArrowGPUConversionPolicy,
  type ArrowGPUConversionSemantic,
  type ArrowGPUConversionSource,
  type ArrowGPUConversionStrategy,
  type PreparedArrowGPUVector
} from './gpu/arrow-gpu-vector-conversion';
export {
  getRequiredArrowGPUVectorDataType,
  getGPUVectorFormatFromArrowDataType,
  makeGPUDataFromArrowData,
  makeGPUVectorFromArrow,
  readArrowGPUDataAsync,
  readArrowGPUVectorAsync,
  type GPUVectorFromArrowProps,
  type GPUVectorFormatForArrowType
} from './gpu/arrow-gpu-vector-adapters';
export {
  getArrowVertexFormat,
  getArrowBufferLayout,
  type ArrowVertexFormatOptions,
  type ArrowBufferLayoutOptions
} from './gpu/arrow-shader-layout';
