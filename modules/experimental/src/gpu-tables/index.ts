// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  GPU_TABLE_INDEX_COLUMN_NAME,
  isGPUTableIndexColumnName,
  type GPUField,
  type GPUSchema,
  type GPUTypeMap
} from './table/gpu-schema';
export {
  GPURecordBatch,
  type GPUDataMap,
  type GPURecordBatchFromDataProps,
  type GPURecordBatchProps,
  type GPURecordBatchSourceInfo
} from './table/gpu-record-batch';
export {
  GPUTable,
  type GPUColumn,
  type GPUColumnMap,
  type GPUTableDetachBatchesOptions,
  type GPUTableFromBatchesProps,
  type GPUTableFromColumnsProps,
  type GPUTableFromSchemaProps,
  type GPUTableFromVectorsProps,
  type GPUTablePackBatchesOptions,
  type GPUTableProps
} from './table/gpu-table';
export {GPUTableGeometry, type GPUTableGeometryProps} from './engine/gpu-table-geometry';
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
  getGPUInputAttributeNames,
  validateGPUInputVectors,
  type GPUInputColumns,
  type GPUInputDeclaration,
  type GPUInputKind,
  type GPUInputSchema,
  type GPUInputVectors
} from './engine/gpu-input-schema';
export {
  GPUTableShaderBindings,
  getGPUTableRowMultiplierFieldName,
  type GPUTableShaderBindingBatch,
  type GPUTableShaderBindingsProps
} from './engine/gpu-table-shader-bindings';
export {
  makeGPUSceneFromCPUScene,
  makeGPUScenePartitionsFromGPUTable,
  type GPUSceneCPUAdapterContext,
  type GPUSceneCPUAdapterProps,
  type GPUSceneTableAdapterProps,
  type GPUSceneTableAdapterResult,
  type GPUSceneTableAdapterStats,
  type GPUSceneTableColumnNames,
  type GPUSceneTablePartition
} from './engine/gpu-scene-adapters';
export {
  GPUTableBufferPlanner,
  type GPUTableBufferGroup,
  type GPUTableBufferGroupKind,
  type GPUTableBufferMapping,
  type GPUTableBufferPlan,
  type GPUTableBufferPlannerMode,
  type GPUTableBufferPlannerModelInfo,
  type GPUTableBufferPlannerProps,
  type GPUTableColumnDescriptor,
  type GPUTableColumnPriority,
  type GPUTablePlannedColumn
} from './utils/gpu-table-buffer-planner';
export {
  getGeneratedBufferBatchByteLimit,
  planGeneratedBufferBatches,
  type GeneratedBufferBatch,
  type GeneratedBufferBatchPlannerProps
} from './utils/generated-buffer-batches';
