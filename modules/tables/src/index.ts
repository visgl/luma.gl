// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {
  GPUData,
  type GPUDataFromBufferProps,
  type GPUDataReadbackMetadata
} from './table/gpu-data';
export {
  GPUVector,
  type GPUVectorBufferProps,
  type GPUVectorCreateProps,
  type GPUVectorDynamicBufferProps,
  type GPUVectorFromAppendableProps,
  type GPUVectorFromBufferProps,
  type GPUVectorFromDataProps,
  type GPUVectorFromInterleavedProps
} from './table/gpu-vector';
export {
  getGPUVectorBuffer,
  getGPUVectorData,
  getRequiredGPUVector
} from './table/gpu-vector-utils';
export {
  getGPUVectorElementFormat,
  getGPUVectorFormatInfo,
  isGPUVectorFormatCompatibleWithShaderType,
  isValueListGPUVectorFormat,
  isVertexListGPUVectorFormat,
  type GPUVectorFormat,
  type GPUVectorFormatInfo,
  type ValueList,
  type VertexList
} from './table/gpu-vector-format';
export {
  GPU_TABLE_INDEX_COLUMN_NAME,
  isGPUTableIndexColumnName,
  type GPUField,
  type GPUSchema,
  type GPUTypeMap
} from './table/gpu-schema';
export {
  createGPUVectorCollection,
  type GPUVectorCollection,
  type GPUVectorCollectionProps
} from './table/gpu-vector-collection';
export {
  GPURecordBatch,
  type GPURecordBatchFromVectorsProps,
  type GPURecordBatchProps,
  type GPURecordBatchSourceInfo
} from './table/gpu-record-batch';
export {
  GPUTable,
  type GPUTableDetachBatchesOptions,
  type GPUTableFromBatchesProps,
  type GPUTableFromVectorsProps,
  type GPUTablePackBatchesOptions,
  type GPUTableProps
} from './table/gpu-table';
export {
  GPUTableGeometry,
  type GPUTableGeometryProps
} from './engine/gpu-table-geometry';
export {
  GPUTableModel,
  type GPUTableModelCount,
  type GPUTableModelDrawBatchesOptions,
  type GPUTableModelProps
} from './engine/gpu-table-model';
export {GPURenderable} from './engine/gpu-renderable';
export {
  TableTransform,
  type TableTransformBatchOptions,
  type TableTransformOutputCopyMap,
  type TableTransformProps
} from './engine/gpu-table-transform';
export {
  GPUTableComputation,
  type GPUTableComputationBatch,
  type GPUTableComputationProps
} from './engine/gpu-table-computation';
export {
  GPUTableBufferPlanner,
  type GPUTableBufferGroupKind,
  type GPUTablePlannedColumn,
  type GPUTableBufferGroup,
  type GPUTableBufferMapping,
  type GPUTableBufferPlan,
  type GPUTableBufferPlannerMode,
  type GPUTableBufferPlannerModelInfo,
  type GPUTableBufferPlannerProps,
  type GPUTableColumnDescriptor,
  type GPUTableColumnPriority
} from './utils/gpu-table-buffer-planner';
export {
  getGeneratedBufferBatchByteLimit,
  planGeneratedBufferBatches,
  type GeneratedBufferBatch,
  type GeneratedBufferBatchPlannerProps
} from './utils/generated-buffer-batches';
export {
  getDataTypeByteLength,
  getDataTypeFromTypedArray,
  getTypedArrayFromDataType
} from '@luma.gl/core';
export {
  assertModelGPUVectorInputs,
  type ModelGPUInputDeclaration,
  type ModelGPUInputKind,
  type ModelGPUInputSchema,
  type ModelGPUInputSource,
  type ModelGPUInputVectors
} from './engine/gpu-table-model-input-schema';
export {
  AttributePathModel,
  ARROW_PATH_GPU_INPUT_SCHEMA,
  type AttributePathModelProps,
  type AttributePathModelState,
  type PathRenderBatchState,
  type PathSegmentLayout
} from './models/path/attribute-path-model';
export {
  StoragePathModel,
  ARROW_STORAGE_PATH_GPU_INPUT_SCHEMA,
  createStoragePathState,
  type StoragePathBatchState,
  type StoragePathInputProps,
  type StoragePathModelProps,
  type StoragePathRenderBatchState,
  type StoragePathState
} from './models/path/storage-path-model';
export {
  StorageTripsPathModel,
  ARROW_STORAGE_TRIPS_PATH_GPU_INPUT_SCHEMA,
  type StorageTripsPathModelProps
} from './models/path/storage-trips-path-model';
export {
  resolveStoragePathInputs,
  type StoragePathBatchInputs,
  type StoragePathInputs
} from './models/path/gpu/storage-path-gpu-inputs';
export {
  AttributePolygonModel,
  type AttributePolygonModelProps
} from './models/polygon/attribute-polygon-model';
export {
  StoragePolygonModel,
  type StoragePolygonModelProps
} from './models/polygon/storage-polygon-model';
export {
  POLYGON_GPU_INPUT_SCHEMA,
  type PolygonBatchProps,
  type PolygonGPUTypeMap,
  type PolygonGPUVectors
} from './models/polygon/polygon-gpu-inputs';
export {
  createPolygonShaderInputs,
  ATTRIBUTE_POLYGON_SHADER_LAYOUT,
  ATTRIBUTE_POLYGON_VS_GLSL,
  ATTRIBUTE_POLYGON_WGSL_SHADER,
  POLYGON_FS_GLSL,
  POLYGON_PICKING_FS_GLSL,
  polygonViewport,
  STORAGE_POLYGON_SHADER_LAYOUT,
  STORAGE_POLYGON_WGSL_SHADER,
  type PolygonShaderInputs,
  type PolygonViewportUniforms
} from './models/polygon/polygon-shaders';
