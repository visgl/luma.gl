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
  makeArrowFixedSizeListVector,
  isArrowFixedSizeListVector,
  getArrowFixedSizeListValues,
  getArrowVectorBufferSource
} from './arrow/arrow-fixed-size-list';

export {
  GPUData,
  GPUVector,
  type GPUDataFromBufferProps,
  type GPUVectorBufferProps,
  type GPUVectorCreateProps,
  type GPUVectorDynamicBufferProps,
  type GPUVectorFromAppendableProps,
  type GPUVectorFromArrowProps,
  type GPUVectorFromBufferProps,
  type GPUVectorFromDataProps,
  type GPUVectorFromInterleavedProps,
  type GPUVectorProps
} from './arrow/arrow-gpu-vector';
export {
  GPURecordBatch,
  type GPURecordBatchAppendableProps,
  type GPURecordBatchFromVectorsProps,
  type GPURecordBatchProps
} from './arrow/arrow-gpu-record-batch';
export {
  GPUTable,
  type GPUTableAppendableProps,
  type GPUTableDetachBatchesOptions,
  type GPUTableFromVectorsProps,
  type GPUTablePackBatchesOptions,
  type GPUTableProps
} from './arrow/plain-gpu-table';
export {ArrowGeometry, type ArrowGeometryProps} from './arrow/arrow-geometry';
export type {ArrowMeshAttribute, ArrowMeshTable, ArrowMeshTopology} from './arrow/arrow-mesh-types';
export {
  StreamingArrowGPUTable,
  StreamingArrowGPUVector,
  type StreamingArrowAsyncRecordBatchSource,
  type StreamingArrowGPUTableProps,
  type StreamingArrowGPUVectorBufferProps,
  type StreamingArrowGPUVectorProps,
  type StreamingArrowRecordBatchSource
} from './arrow/streaming-arrow-gpu-table';
export {ArrowModel, type ArrowModelGPUTable, type ArrowModelProps} from './arrow/arrow-model';

export {
  getArrowVertexFormat,
  getArrowBufferLayout,
  type ArrowVertexFormatOptions,
  type ArrowBufferLayoutOptions
} from './arrow/arrow-shader-layout';

export {analyzeArrowTable} from './arrow/analyze-arrow-table';

export {getArrowListNestingLevel} from './arrow/arrow-utils';

export {
  TableBufferPlanner,
  type AllocationGroupKind,
  type PlannedColumn,
  type TableBufferGroup,
  type TableBufferMapping,
  type TableBufferPlan,
  type TableBufferPlannerMode,
  type TableBufferPlannerModelInfo,
  type TableBufferPlannerProps,
  type TableColumnDescriptor,
  type TableColumnPriority
} from './arrow/table-buffer-planner';

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
