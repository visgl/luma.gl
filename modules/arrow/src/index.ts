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
