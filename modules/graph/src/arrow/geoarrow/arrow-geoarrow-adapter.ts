// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {DataType, Vector} from 'apache-arrow';
import {
  makeGeoArrowColumnFromArrowVector as makeGeoArrowColumn,
  type MakeGeoArrowColumnFromArrowVectorOptions
} from '@math.gl/arrow/geoarrow';
import {
  getGeoArrowRowView,
  iterateGeoArrowBatches,
  type GeoArrowBatchView,
  type GeoArrowColumn,
  type GeoArrowRowView
} from '@math.gl/arrow/geoarrow-utils';

export type {MakeGeoArrowColumnFromArrowVectorOptions} from '@math.gl/arrow/geoarrow';
export {
  makeArrowVectorFromGeoArrowColumn,
  inferGeoArrowEncodingFromArrowType,
  inferGeoArrowDimensionFromArrowType,
  inferGeoArrowCoordinateLayoutFromArrowType
} from '@math.gl/arrow/geoarrow';

/** Adapts borrowed Arrow buffers using math.gl's shared GeoArrow adapter. */
export function makeGeoArrowColumnFromArrowVector<T extends DataType>(
  vector: Vector<T>,
  options: MakeGeoArrowColumnFromArrowVectorOptions = {}
): GeoArrowColumn {
  return makeGeoArrowColumn(vector, options);
}

/** Iterates borrowed batch views while retaining Arrow chunk boundaries and buffers. */
export function iterateGeoArrowBatchesFromArrowVector<T extends DataType>(
  vector: Vector<T>,
  options: MakeGeoArrowColumnFromArrowVectorOptions = {}
): IterableIterator<GeoArrowBatchView> {
  return iterateGeoArrowBatches(makeGeoArrowColumnFromArrowVector(vector, options));
}

/** Gets a borrowed row view by logical index across Arrow chunks. */
export function getGeoArrowRowViewFromArrowVector<T extends DataType>(
  vector: Vector<T>,
  rowIndex: number,
  options: MakeGeoArrowColumnFromArrowVectorOptions = {}
): GeoArrowRowView {
  return getGeoArrowRowView(makeGeoArrowColumnFromArrowVector(vector, options), rowIndex);
}
