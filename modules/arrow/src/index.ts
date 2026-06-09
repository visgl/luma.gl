// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {NumericArrowType, ArrowColumnInfo} from './arrow/arrow-utils/arrow-types';
export {
  getArrowListNestingLevel,
  isNumericArrowType
  // isInstanceArrowType,
  // isVertexArrowType,
} from './arrow/arrow-utils/arrow-types';

export {
  getArrowPaths,
  getArrowDataByPath,
  getArrowVectorByPath
} from './arrow/arrow-utils/arrow-paths';

export {analyzeArrowTable, getArrowColumnInfo} from './arrow/arrow-utils/arrow-column-info';

export {
  makeArrowVectorFromArray,
  makeArrowFixedSizeListVector,
  isArrowFixedSizeListVector,
  getArrowFixedSizeListValues,
  getArrowVectorBufferSource
} from './arrow/vectors/arrow-fixed-size-list';
export {
  prepareArrowMatrixGPUVector,
  type PreparedArrowMatrixGPUVector,
  type PrepareArrowMatrixGPUVectorOptions
} from './arrow/vectors/arrow-matrix-gpu-vector';
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
} from './arrow/vectors/arrow-matrix-vector';
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
} from './arrow/vectors/arrow-temporal-gpu-vector';
export {
  expandArrowVector,
  getArrowVectorByteLength,
  type ArrowVectorNullValue,
  type ArrowVectorRowMapping
} from './arrow/vectors/arrow-vector-utils';
export {
  assertModelGPUVectorInputs,
  type ModelGPUInputDeclaration,
  type ModelGPUInputKind,
  type ModelGPUInputSchema,
  type ModelGPUInputSource,
  type ModelGPUInputVectors
} from '@luma.gl/tables';
export {
  resolveArrowPathSourceVectors,
  type ArrowPathMappedSourceVectors,
  type ArrowPathSourceData,
  type ArrowPathSourceMappingModel,
  type ArrowPathSourceVectorSelectors,
  type ResolveArrowPathSourceVectorsProps
} from './arrow/renderers/path/source/arrow-path-source-mapping';

export {
  makeGPUDataFromArrowData,
  makeGPURecordBatchFromArrowRecordBatch,
  makeGPUTableFromArrowTable,
  makeGPUVectorFromArrow,
  readArrowGPUDataAsync,
  readArrowGPUVectorAsync,
  type GPURecordBatchFromArrowRecordBatchProps,
  type GPUTableFromArrowTableProps,
  type GPUVectorFromArrowProps,
  type GPUVectorFormatForArrowType
} from './arrow/gpu/arrow-gpu-table-adapters';
export {
  clearArrowPickingState,
  createArrowPickingManager,
  getArrowPickingModule,
  getArrowPickingModules,
  getArrowPickingSourceInfo,
  makeArrowRecordBatchSourceInfo,
  makeArrowRowIndexGPUVector,
  makeArrowRowIndexVector,
  resolveArrowPickInfo,
  runArrowPickingPass,
  supportsArrowIndexPicking,
  type ArrowPickingInfo,
  type ArrowPickingSource,
  type ArrowRowIndexGPUVectorOptions,
  type ArrowRowIndexVectorOptions
} from './arrow/engine/arrow-picking';
export {
  ArrowTableGeometry,
  makeGPUGeometryFromArrow,
  type ArrowTableGeometryProps
} from './arrow/engine/arrow-geometry';
export type {
  ArrowMeshAttribute,
  ArrowMeshTable,
  ArrowMeshTopology
} from './arrow/engine/arrow-mesh-types';
export {
  AttributePathModel,
  ARROW_PATH_GPU_INPUT_SCHEMA,
  type AttributePathModelProps,
  type AttributePathModelState,
  type PathRenderBatchState,
  type PathSegmentLayout
} from '@luma.gl/tables';
export {
  ArrowPathRenderer,
  buildArrowPathSegmentTable,
  convertArrowPathsToAttribute,
  convertArrowPathsToStorage,
  convertArrowTripsToStorage,
  createArrowPathPreparedState,
  makeAttributePathModelProps,
  prepareArrowPathGPUVectors,
  prepareArrowStoragePathGPUVectors,
  type ArrowPathPreparedGPUVectorProps,
  type ArrowPathPreparedState,
  type ArrowPathRendererModel,
  type ArrowPathRendererProps,
  type ArrowPathSegmentTable,
  type ArrowPathSourceVectors,
  type ArrowPathViewOriginUpdateProps,
  type PreparedArrowPathGPUVectors,
  type PreparedArrowPathRendererGPUVectors,
  type PreparedStoragePathGPUVectors,
  type PrepareArrowPathGPUVectorsOptions,
  type PrepareArrowPathRendererGPUVectorsOptions
} from './arrow/renderers/path/renderers/arrow-path-renderer';
export {
  convertGeoArrowTableToDenseUnion,
  convertGeoArrowVectorToDenseUnion,
  type GeoArrowDenseUnionTableOptions,
  type GeoArrowDenseUnionVectorOptions,
  type GeoArrowSerializedEncoding,
  convertGeoArrowTableToInterleaved,
  convertGeoArrowTableToInterleavedAsync,
  convertGeoArrowVectorToInterleaved,
  type GeoArrowInterleaveOptions,
  type GeoArrowNativeEncoding
} from '@math.gl/geoarrow';

export {
  ArrowPolygonRenderer,
  convertArrowPolygonColumnsToGPUVectors,
  prepareArrowPolygonInput,
  type ArrowPolygonColumns,
  type ArrowPolygonGPUVectors,
  type ArrowPolygonRendererDataBatchUpdate,
  type ArrowPolygonRendererInput,
  type ArrowPolygonRendererMetrics,
  type ArrowPolygonRendererModel,
  type ArrowPolygonRendererModelProps,
  type ArrowPolygonRendererPickingInfo,
  type ArrowPolygonRendererProps,
  type ConvertArrowPolygonColumnsToGPUVectorsOptions
} from './arrow/renderers/polygon/renderers/arrow-polygon-renderer';
export {
  resolveArrowPolygonSourceVectors,
  type ArrowPolygonColumnSelector,
  type ArrowPolygonSourceData,
  type ArrowPolygonSourceVectorSelectors,
  type OptionalArrowPolygonColumnSelector,
  type ResolveArrowPolygonSourceVectorsProps
} from './arrow/renderers/polygon/source/arrow-polygon-source-mapping';
export {
  prepareArrowPolygonGPUVectorsAsync,
  prepareArrowPolygonGPUVectors,
  tesselateAsync,
  tessellateArrowPolygons,
  type ArrowMultiPolygonType,
  type ArrowMultiPolygonVertexColorType,
  type ArrowGeoArrowGeometryType,
  type ArrowPolygonColorType,
  type ArrowPolygonCoordinateType,
  type ArrowPolygonInputType,
  type ArrowPolygonRowColorType,
  type ArrowPolygonSourceVectors,
  type ArrowPolygonTessellationOptions,
  type ArrowPolygonTessellationResult,
  type ArrowPolygonType,
  type ArrowPolygonVertexColorType,
  type ArrowTessellatedPolygonType,
  type ArrowTessellatedPolygonVertexColorType,
  type PreparedArrowPolygonGPUVectors,
  type PrepareArrowPolygonGPUVectorsOptions
} from './arrow/renderers/polygon/preparation/arrow-polygon-gpu-vectors';
export {
  getArrowRecordBatchAsyncIterator,
  getOptionalArrowColumn,
  getRequiredArrowColumn,
  hasArrowTableOrVectorSource,
  loadArrowRecordBatches,
  type ArrowColumnSelector,
  type ArrowRecordBatchLoadContext,
  type ArrowRecordBatchLoadUpdate,
  type ArrowRecordBatchSource,
  type OptionalArrowColumnSelector
} from './arrow/renderers/arrow-renderer-utils';
export {
  AttributePolygonModel,
  createPolygonShaderInputs,
  POLYGON_GPU_INPUT_SCHEMA,
  StoragePolygonModel,
  type AttributePolygonModelProps,
  type PolygonBatchProps,
  type PolygonGPUTypeMap,
  type PolygonGPUVectors,
  type PolygonShaderInputs,
  type StoragePolygonModelProps,
  type PolygonViewportUniforms
} from '@luma.gl/tables';
export {
  StoragePathModel,
  ARROW_STORAGE_PATH_GPU_INPUT_SCHEMA,
  createStoragePathState,
  type StoragePathBatchState,
  type StoragePathInputProps,
  type StoragePathModelProps,
  type StoragePathRenderBatchState,
  type StoragePathState
} from '@luma.gl/tables';
export {
  StorageTripsPathModel,
  ARROW_STORAGE_TRIPS_PATH_GPU_INPUT_SCHEMA,
  type StorageTripsPathModelProps
} from '@luma.gl/tables';
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
  type DggsCellPathCoordinateFormat,
  type DggsCellPathGPUVectorOptions,
  type PreparedDggsCellKeyGPUVector,
  type PreparedDggsCellPathGPUVector
} from './arrow/dggs/dggs-gpu-polygons';
export {
  getArrowVertexFormat,
  getArrowBufferLayout,
  type ArrowVertexFormatOptions,
  type ArrowBufferLayoutOptions
} from './arrow/engine/arrow-shader-layout';

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
