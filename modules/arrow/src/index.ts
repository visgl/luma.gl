// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {NumericArrowType, ArrowColumnInfo} from './arrow/arrow-utils/arrow-types';
export {
  ArrowTimeline,
  getArrowTimelineDataTypeMismatch,
  getArrowTimelineUnitsPerSecond,
  type ArrowTimelineDataType,
  type ArrowTimelineProps,
  type ArrowTimelineTime,
  type ArrowTimelineUpdate
} from './arrow/animation/arrow-timeline';
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
  convertArrowMatrixToGPUVector,
  type PreparedArrowMatrixGPUVector,
  type ConvertArrowMatrixToGPUVectorOptions
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
} from './arrow/vectors/arrow-temporal-gpu-vector';
export {
  expandArrowVector,
  getArrowVectorByteLength,
  type ArrowVectorNullValue,
  type ArrowVectorRowMapping
} from './arrow/vectors/arrow-vector-utils';
export {
  resolveArrowPathSourceVectors,
  type ArrowPathMappedSourceVectors,
  type ArrowPathSourceData,
  type ArrowPathSourceMappingModel,
  type ArrowPathSourceVectorSelectors,
  type ResolveArrowPathSourceVectorsProps
} from './arrow/renderers/path/source/arrow-path-source-mapping';
export {
  buildArrowGlyphLayout,
  buildArrowUtf8Chunks,
  buildGpuTextDictionaryCompressedStream,
  buildGpuTextDictionaryUtf8Input,
  buildGpuExpandedTextStream,
  buildGpuUtf8TextInput,
  createArrowUtf8TextIndexAccessor,
  decodeArrowUtf8CodePoints,
  isArrowUtf8DictionaryType,
  isArrowUtf8DictionaryVector,
  isArrowUtf8TextVector,
  isArrowUtf8Vector,
  populateUtf8TextIndices,
  type ArrowUtf8Dictionary,
  type ArrowUtf8DictionaryIndexType,
  type ArrowUtf8Chunk,
  type ArrowUtf8TextAccessorContext,
  type ArrowUtf8TextIndexAccessor,
  type ArrowUtf8TextType,
  type ArrowUtf8TextVector,
  type Utf8TextIndexTarget
} from './arrow/renderers/text/conversion/arrow-text';
export {
  buildArrowTextGlyphTable,
  createArrowTextAttributeState,
  createArrowTextDictionaryStorageState,
  createArrowTextStorageState,
  createTextStorageStateFromGPUVectors,
  packTextStorageClipRects,
  type ArrowTextAttributeInputProps,
  type ArrowTextAttributeRenderProps,
  type ArrowTextAttributeState,
  type ArrowTextDictionaryStorageInputProps,
  type ArrowTextDictionaryStorageRenderProps,
  type ArrowTextDictionaryStorageSourceVectors,
  type ArrowTextStorageInputProps,
  type ArrowTextStorageRenderProps,
  type ArrowTextStorageSourceVectors,
  type ArrowTextStorageState,
  type ArrowTextGlyphTable,
  type ArrowTextModelProps,
  type ArrowTextRenderBatchState,
  type ArrowTextSourceVectors,
  type GPUVectorTextStorageBatch,
  type GPUVectorTextStorageInputProps
} from './arrow/renderers/text/conversion/convert-arrow-text-vectors';
export {
  convertArrowTextToAttribute,
  convertArrowTextToAttributeModelProps,
  convertArrowTextToAttributeState,
  type ArrowTextConversionColumns,
  type ConvertedArrowTextData,
  type ConvertArrowTextProps
} from './arrow/renderers/text/conversion/convert-arrow-text-to-attribute';
export {
  convertArrowTextToStorage,
  convertArrowTextToStorageModelProps,
  convertArrowTextToStorageState
} from './arrow/renderers/text/conversion/convert-arrow-text-to-storage';
export {
  convertArrowTextToDictionary,
  convertArrowTextToDictionaryModelProps,
  convertArrowTextToDictionaryState
} from './arrow/renderers/text/conversion/convert-arrow-text-to-dictionary';
export {
  ArrowTextRenderer,
  addArrowTextGPUTableBatch,
  createArrowTextGPUTable,
  createArrowTextGPUTableFromTable,
  prepareArrowTextInput,
  prepareArrowTextInputFromData,
  prepareArrowTextInputFromGPUTable,
  type ArrowTextRendererActiveModel,
  type ArrowTextRendererData,
  type ArrowTextRendererDataBatchUpdate,
  type ArrowTextRendererInput,
  type ArrowTextRendererPrepareDataProps,
  type ArrowTextRendererPrepareGPUTableDataProps,
  type ArrowTextRendererPrepareInputProps,
  type ArrowTextRendererProps,
  type ArrowTextRendererSetPropsResult,
  type ArrowTextRendererSource,
  type CharacterColorDataType,
  type RowColorColumnDataType
} from './arrow/renderers/text/renderers/arrow-text-renderer';
export {
  resolveArrowTextSourceVectors,
  type ArrowTextColumnSelector,
  type ArrowTextMappedSourceVectors,
  type ArrowTextSourceData,
  type ArrowTextSourceVectorSelectors,
  type OptionalArrowTextColumnSelector,
  type ResolveArrowTextSourceVectorsProps
} from './arrow/renderers/text/source/index';
export {
  createArrowTextPickingManager,
  createArrowTextPickingModel,
  drawArrowTextPickingPass,
  getArrowTextRenderModules,
  supportsTextIndexPicking
} from './arrow/renderers/text/renderers/arrow-text-picking';
export {
  createArrowTextShaderInputs,
  type ArrowTextShaderInputs
} from './arrow/renderers/text/renderers/arrow-text-shaders';
export {
  prepareArrowInput,
  type ArrowInputResolveProps,
  type ArrowInputSchema,
  type ArrowInputSourceData,
  type PrepareArrowInputProps
} from './arrow/gpu/arrow-input-schema';
export {
  getRequiredArrowGPUVectorDataType,
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
  ArrowPathRenderer,
  buildArrowPathSegmentTable,
  convertArrowPathsToAttribute,
  convertArrowPathsToStorage,
  convertArrowTripsToStorage,
  createArrowPathPreparedState,
  makePathAttributeModelProps,
  convertArrowPathToGPUVectors,
  convertArrowPathStorageToGPUVectors,
  type ArrowPathPreparedGPUVectorProps,
  type ArrowPathPreparedState,
  type ArrowPathRendererModel,
  type ArrowPathRendererProps,
  type ArrowPathSegmentTable,
  type ArrowPathSourceVectors,
  type ArrowPathViewOriginUpdateProps,
  type PreparedArrowPathGPUVectors,
  type PreparedArrowPathRendererGPUVectors,
  type PreparedPathStorageGPUVectors,
  type ConvertArrowPathToGPUVectorsOptions,
  type ConvertArrowPathRendererGPUVectorsOptions
} from './arrow/renderers/path/renderers/arrow-path-renderer';
export {
  ArrowPolygonRenderer,
  convertArrowPolygonColumnsToGPUVectors,
  prepareArrowPolygonInput,
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
  convertArrowPolygonToGPUVectorsAsync,
  convertArrowPolygonToGPUVectors,
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
  type ConvertArrowPolygonToGPUVectorsOptions
} from './arrow/renderers/polygon/conversion/arrow-polygon-gpu-vectors';
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
} from './arrow/dggs/dggs-gpu-polygons';
export {
  getArrowVertexFormat,
  getArrowBufferLayout,
  type ArrowVertexFormatOptions,
  type ArrowBufferLayoutOptions
} from './arrow/engine/arrow-shader-layout';

//   assignAccessor,
