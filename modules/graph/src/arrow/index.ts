// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  convertArrowColumnToGPUVector,
  type ArrowColumnGPUVectorOptions,
  type PreparedArrowColumnGPUVector
} from './gpu/arrow-column-gpu-vector';
export {
  prepareArrowInput,
  type ArrowInputResolveProps,
  type ArrowInputSchema,
  type ArrowInputSourceData,
  type PrepareArrowInputProps
} from './gpu/arrow-input-schema';
export {
  makeGPUAnalyticsTableFromArrowTable,
  type GPUAnalyticsDictionary,
  type GPUAnalyticsTableFromArrowTableProps,
  type GPUAnalyticsTableFromArrowTableResult,
  type GPUAnalyticsTypeMapForArrow
} from './gpu/arrow-gpu-analytics-adapters';
export {
  makeArrowTableFromGPUAnalyticsTable,
  type ArrowTableFromGPUAnalyticsTableProps
} from './gpu/arrow-gpu-analytics-readback';
export {
  convertArrowRecordBatchToGPURecordBatch,
  convertArrowRecordBatchesToGPURecordBatches,
  convertArrowTableToGPUTable,
  planArrowTableGPUConversion,
  type ArrowRecordBatchConversionSource,
  type ArrowGPUTableConversionColumn,
  type ArrowGPUTableConversionPlan,
  type ArrowGPUTableConversionSchema,
  type PreparedArrowGPURecordBatch,
  type PreparedArrowGPUTable
} from './gpu/arrow-gpu-table-conversion';
export {
  makeGPURecordBatchFromArrowRecordBatch,
  makeGPUTableFromArrowTable,
  type ArrowGPUValidityColumn,
  type GPURecordBatchFromArrowRecordBatchProps,
  type GPUTableFromArrowTableProps
} from './gpu/arrow-gpu-table-adapters';
export {
  convertGeoArrowTableToDenseUnion,
  convertGeoArrowTableToInterleaved,
  convertGeoArrowTableToInterleavedAsync,
  convertGeoArrowVectorToDenseUnion,
  convertGeoArrowVectorToInterleaved,
  type GeoArrowDenseUnionTableOptions,
  type GeoArrowDenseUnionVectorOptions,
  type GeoArrowInterleaveOptions,
  type GeoArrowNativeEncoding,
  type GeoArrowSerializedEncoding
} from './geoarrow/arrow-geoarrow-conversion';
export {
  inferGeoArrowCoordinateLayoutFromArrowType,
  inferGeoArrowDimensionFromArrowType,
  inferGeoArrowEncodingFromArrowType,
  makeArrowVectorFromGeoArrowColumn,
  makeGeoArrowColumnFromArrowVector,
  iterateGeoArrowBatchesFromArrowVector,
  getGeoArrowRowViewFromArrowVector,
  type MakeGeoArrowColumnFromArrowVectorOptions
} from './geoarrow/arrow-geoarrow-adapter';
export {
  getDggsUint64Words,
  packDggsA5CellKey,
  packDggsGeohashKey,
  packDggsH3CellKey,
  packDggsQuadkeyKey,
  packDggsS2CellKey,
  convertDggsCellIdsToGPUKeys,
  convertDggsCellKeysToGPUPaths,
  type DggsCellEncoding,
  type DggsCellKeyGPUVectorOptions,
  type DggsCellPathCoordinateFormat,
  type DggsCellPathGPUVectorOptions,
  type PreparedDggsCellKeyGPUVector,
  type PreparedDggsCellPathGPUVector
} from './dggs/dggs-gpu-polygons';

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
