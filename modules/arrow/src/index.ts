// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {NumericArrowType, ArrowColumnInfo} from './arrow/arrow-types';
export {
  isNumericArrowType
  // isInstanceArrowType,
  // isVertexArrowType,
} from './arrow/arrow-types';

export {getArrowPaths, getArrowDataByPath, getArrowVectorByPath} from './arrow/arrow-paths';

export {getArrowColumnInfo} from './arrow/arrow-column-info';

export {
  makeArrowVectorFromArray,
  makeArrowFixedSizeListVector,
  isArrowFixedSizeListVector,
  getArrowFixedSizeListValues,
  getArrowVectorBufferSource
} from './arrow/arrow-fixed-size-list';
export {
  prepareArrowMatrixGPUVector,
  type PreparedArrowMatrixGPUVector,
  type PrepareArrowMatrixGPUVectorOptions
} from './arrow/arrow-matrix-gpu-vector';
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
} from './arrow/arrow-matrix-vector';
export {
  getArrowTemporalVectorInfo,
  prepareArrowTemporalGPUVector,
  prepareArrowTemporalGPUVectors,
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
  type PrepareArrowTemporalGPUVectorOptions,
  type PrepareArrowTemporalGPUVectorsOptions
} from './arrow/arrow-temporal-gpu-vector';
export {
  expandArrowVector,
  getArrowVectorByteLength,
  type ArrowVectorRowMapping
} from './arrow/arrow-vector-utils';

export {
  appendArrowBatchToGPUTable,
  appendArrowDataToGPUVector,
  appendArrowRecordBatchToGPURecordBatch,
  appendArrowVectorToGPUVector,
  makeAppendableArrowGPUVector,
  makeAppendableArrowGPURecordBatch,
  makeAppendableArrowGPUTable,
  makeArrowGPUData,
  makeArrowGPURecordBatch,
  makeArrowGPUTable,
  makeArrowGPUVector,
  readArrowGPUDataAsync,
  readArrowGPUVectorAsync,
  type AppendableArrowGPUVectorProps,
  type AppendableArrowGPURecordBatchProps,
  type AppendableArrowGPUTableProps,
  type ArrowGPURecordBatchProps,
  type ArrowGPUTableProps,
  type ArrowGPUVectorProps
} from './arrow/arrow-gpu-table-adapters';
export {
  ArrowGeometry,
  ArrowTableGeometry,
  makeGPUGeometryFromArrow,
  type ArrowGeometryProps,
  type ArrowTableGeometryProps
} from './arrow/arrow-geometry';
export type {ArrowMeshAttribute, ArrowMeshTable, ArrowMeshTopology} from './arrow/arrow-mesh-types';
export {ArrowModel, type ArrowModelGPUTable, type ArrowModelProps} from './arrow/arrow-model';
export {
  ArrowPathModel,
  buildArrowPathSegmentTable,
  createArrowPathPreparedState,
  prepareArrowPathGPUVectors,
  type ArrowPathModelProps,
  type ArrowPathPreparedState,
  type ArrowPathRenderBatchState,
  type ArrowPathSegmentLayout,
  type ArrowPathSegmentTable,
  type ArrowPathSourceVectors,
  type ArrowPathViewOriginUpdateProps,
  type PreparedArrowPathGPUVectors,
  type PrepareArrowPathGPUVectorsOptions
} from './arrow/arrow-path-model';
export {
  AttributePathModel,
  buildArrowPathSegmentTable as buildAttributePathSegmentTable,
  createArrowPathPreparedState as createAttributePathPreparedState,
  type AttributePathModelProps,
  type AttributePathPreparedState,
  type AttributePathRenderBatchState,
  type AttributePathSegmentLayout,
  type AttributePathSegmentTable,
  type AttributePathViewOriginUpdateProps
} from './arrow/attribute-path-model';
export {
  convertArrowPathsToAttribute,
  type ArrowPathSourceVectors as ConvertArrowPathsToAttributeSourceVectors,
  type PreparedArrowPathGPUVectors as ConvertedArrowAttributePathData,
  type PrepareArrowPathGPUVectorsOptions as ConvertArrowPathsToAttributeOptions
} from './arrow/convert-arrow-paths-to-attribute';
export {
  ArrowStoragePathModel,
  createArrowStoragePathState,
  prepareArrowStoragePathGPUVectors,
  type ArrowStoragePathBatchState,
  type ArrowStoragePathInputProps,
  type ArrowStoragePathModelProps,
  type ArrowStoragePathRenderBatchState,
  type ArrowStoragePathState,
  type PreparedArrowStoragePathGPUVectors
} from './arrow/arrow-storage-path-model';
export {
  StoragePathModel,
  createArrowStoragePathState as createStoragePathState,
  type StoragePathBatchState,
  type StoragePathInputProps,
  type StoragePathModelProps,
  type StoragePathRenderBatchState,
  type StoragePathState
} from './arrow/storage-path-model';
export {
  convertArrowPathsToStorage,
  type ArrowPathSourceVectors as ConvertArrowPathsToStorageSourceVectors,
  type PreparedArrowStoragePathGPUVectors as ConvertedArrowStoragePathData,
  type PrepareArrowPathGPUVectorsOptions as ConvertArrowPathsToStorageOptions
} from './arrow/convert-arrow-paths-to-storage';
export {
  ArrowStorageTripsPathModel,
  type ArrowStorageTripsPathModelProps
} from './arrow/arrow-storage-trips-path-model';
export {
  StorageTripsPathModel,
  type StorageTripsPathModelProps
} from './arrow/storage-trips-path-model';
export {
  convertArrowTripsToStorage,
  type ArrowPathSourceVectors as ConvertArrowTripsToStorageSourceVectors,
  type PreparedArrowStoragePathGPUVectors as ConvertedArrowStorageTripsPathData,
  type PrepareArrowPathGPUVectorsOptions as ConvertArrowTripsToStorageOptions
} from './arrow/convert-arrow-trips-to-storage';
export {
  getDggsUint64Words,
  packDggsA5CellKey,
  packDggsGeohashKey,
  packDggsH3CellKey,
  packDggsQuadkeyKey,
  packDggsS2CellKey,
  prepareDggsCellKeyGPUVector,
  prepareDggsCellPathGPUVector,
  type DggsCellEncoding,
  type DggsCellKeyGPUVectorOptions,
  type DggsCellPathGPUVectorOptions,
  type PreparedDggsCellKeyGPUVector,
  type PreparedDggsCellPathGPUVector
} from './arrow/dggs-gpu-polygons';
export {
  getArrowVertexFormat,
  getArrowBufferLayout,
  type ArrowVertexFormatOptions,
  type ArrowBufferLayoutOptions
} from './arrow/arrow-shader-layout';

export {analyzeArrowTable} from './arrow/analyze-arrow-table';

export {getArrowListNestingLevel} from './arrow/arrow-utils';

// GEOARROW

export {
  findGeometryColumnIndex,
  isColumnReference,
  getGeometryVector,
  validateVectorAccessors,
  validateColorVector,
  isPointVector,
  isLineStringVector,
  isPolygonVector,
  isMultiPointVector,
  isMultiLineStringVector,
  isMultiPolygonVector,
  validatePointType,
  validateLineStringType,
  validatePolygonType,
  validateMultiPointType,
  validateMultiLineStringType,
  validateMultiPolygonType,
  getPointChild,
  getLineStringChild,
  getPolygonChild,
  getMultiPointChild,
  getMultiLineStringChild,
  getMultiPolygonChild
} from './geoarrow/geoarrow';

export {
  getMultiLineStringResolvedOffsets,
  getPolygonResolvedOffsets,
  getMultiPolygonResolvedOffsets
} from './geoarrow/geoarrow-transform';

export {expandArrayToCoords, invertOffsets} from './attribute-utils/attribute-utils';

//   assignAccessor,
