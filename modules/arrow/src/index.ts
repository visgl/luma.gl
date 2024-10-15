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

export {analyzeArrowTable} from './arrow/analyze-arrow-table';

// GEOARROW

export {
  findGeometryColumnIndex,
  isColumnReference,
  expandArrayToCoords,
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
  getListNestingLevels,
  getPointChild,
  getLineStringChild,
  getPolygonChild,
  getMultiPointChild,
  getMultiLineStringChild,
  getMultiPolygonChild,
  getMultiLineStringResolvedOffsets,
  getPolygonResolvedOffsets,
  getMultiPolygonResolvedOffsets,
  invertOffsets
} from './geoarrow/geoarrow';

//   assignAccessor,
