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
  getArrowMatrixVectorInfo,
  makeArrowMatrixVector,
  makeArrowMatrix2x2Vector,
  makeArrowMatrix2x3Vector,
  makeArrowMatrix3x2Vector,
  makeArrowMatrix3x3Vector,
  makeArrowMatrix4x3Vector,
  makeArrowMatrix3x4Vector,
  makeArrowMatrix4x4Vector,
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
  type ArrowMatrixVectorInfo,
  type ArrowMatrixVectorOptions
} from './arrow/arrow-matrix-vector';
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
  type ArrowGPUTableProps
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
  type ArrowPathModelProps,
  type ArrowPathRenderBatchState,
  type ArrowPathSegmentLayout,
  type ArrowPathSegmentTable,
  type ArrowPathSourceVectors
} from './arrow/arrow-path-model';
export {
  ArrowStoragePathModel,
  createArrowStoragePathState,
  type ArrowStoragePathBatchState,
  type ArrowStoragePathInputProps,
  type ArrowStoragePathModelProps,
  type ArrowStoragePathRenderBatchState,
  type ArrowStoragePathState
} from './arrow/arrow-storage-path-model';
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
