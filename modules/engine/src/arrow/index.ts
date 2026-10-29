// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  makeGPUSplatDataFromArrow,
  makeGPUSplatDataFromArrowStream,
  type GPUSplatArrowRecordBatchLike,
  type GPUSplatArrowSource,
  type GPUSplatArrowTableLike,
  type MakeGPUSplatDataFromArrowOptions
} from './renderers/splats/conversion/make-gpu-splat-data-from-arrow';
export {
  makeGPUTextDataFromArrow,
  makeGPUTextDataFromArrowStream,
  type GPUTextArrowStreamBatch,
  type MakeGPUTextDataFromArrowStreamOptions,
  type MakeGPUTextDataFromArrowProps
} from './renderers/text/conversion/make-gpu-text-data-from-arrow';
export {
  resolveArrowPathSourceVectors,
  type ArrowPathMappedSourceVectors,
  type ArrowPathSourceData,
  type ArrowPathSourceMappingModel,
  type ArrowPathSourceVectorSelectors,
  type ResolveArrowPathSourceVectorsProps
} from './renderers/path/source/arrow-path-source-mapping';
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
  isArrowUtf8TextInputVector,
  isArrowUtf8TextVector,
  isArrowUtf8ViewDictionaryType,
  isArrowUtf8ViewDictionaryVector,
  isArrowUtf8ViewType,
  isArrowUtf8ViewVector,
  isArrowUtf8Vector,
  normalizeArrowUtf8TextVector,
  populateUtf8TextIndices,
  type ArrowUtf8Dictionary,
  type ArrowUtf8DictionaryIndexType,
  type ArrowUtf8Chunk,
  type ArrowUtf8TextAccessorContext,
  type ArrowUtf8TextIndexAccessor,
  type ArrowUtf8TextInputType,
  type ArrowUtf8TextInputVector,
  type ArrowUtf8TextType,
  type ArrowUtf8TextVector,
  type ArrowUtf8View,
  type ArrowUtf8ViewDictionary,
  type Utf8TextIndexTarget
} from './renderers/text/conversion/arrow-text';
export {
  buildArrowTextGlyphTable,
  createArrowTextAttributeState,
  createArrowTextDictionaryStorageState,
  createArrowTextStorageState,
  createTextStorageStateFromGPUVectors,
  packTextStorageClipRects,
  type ArrowTextAttributeInputProps,
  type ArrowTextAttributeState,
  type ArrowTextDictionaryStorageInputProps,
  type ArrowTextDictionaryStorageSourceVectors,
  type ArrowTextStorageInputProps,
  type ArrowTextStorageSourceVectors,
  type ArrowTextStorageState,
  type ArrowTextGlyphTable,
  type ArrowTextModelProps,
  type ArrowTextRenderBatchState,
  type ArrowTextSourceVectors,
  type GPUVectorTextStorageBatch,
  type GPUVectorTextStorageInputProps
} from './renderers/text/conversion/convert-arrow-text-vectors';
export {
  convertArrowTextToAttribute,
  convertArrowTextToAttributeModelProps,
  convertArrowTextToAttributeState,
  type ArrowTextConversionColumns,
  type ConvertedArrowTextData,
  type ConvertArrowTextProps
} from './renderers/text/conversion/convert-arrow-text-to-attribute';
export {
  convertArrowTextToStorage,
  convertArrowTextToStorageModelProps,
  convertArrowTextToStorageState
} from './renderers/text/conversion/convert-arrow-text-to-storage';
export {
  convertArrowTextToDictionary,
  convertArrowTextToDictionaryModelProps,
  convertArrowTextToDictionaryState
} from './renderers/text/conversion/convert-arrow-text-to-dictionary';
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
} from './renderers/text/renderers/arrow-text-renderer';
export {
  resolveArrowTextSourceVectors,
  type ArrowTextColumnSelector,
  type ArrowTextMappedSourceVectors,
  type ArrowTextSourceData,
  type ArrowTextSourceVectorSelectors,
  type OptionalArrowTextColumnSelector,
  type ResolveArrowTextSourceVectorsProps
} from './renderers/text/source/index';
export {
  createArrowTextPickingManager,
  createArrowTextPickingModel,
  drawArrowTextPickingPass,
  getArrowTextRenderModules,
  supportsTextIndexPicking
} from './renderers/text/renderers/arrow-text-picking';
export {
  createArrowTextShaderInputs,
  type ArrowTextShaderInputs
} from './renderers/text/renderers/arrow-text-shaders';
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
} from './arrow-picking';
export {
  ArrowTableGeometry,
  makeGPUGeometryFromArrow,
  type ArrowTableGeometryProps
} from './arrow-geometry';
export type {
  ArrowMeshAttribute,
  ArrowMeshTable,
  ArrowMeshTopology
} from './arrow-mesh-types';
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
} from './renderers/path/renderers/arrow-path-renderer';
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
} from './renderers/polygon/renderers/arrow-polygon-renderer';
export {
  resolveArrowPolygonSourceVectors,
  type ArrowPolygonColumnSelector,
  type ArrowPolygonSourceData,
  type ArrowPolygonSourceVectorSelectors,
  type OptionalArrowPolygonColumnSelector,
  type ResolveArrowPolygonSourceVectorsProps
} from './renderers/polygon/source/arrow-polygon-source-mapping';
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
} from './renderers/polygon/conversion/arrow-polygon-gpu-vectors';
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
} from './renderers/arrow-renderer-utils';

export {closeArrowPaths} from './renderers/path/transforms/close-arrow-paths';
