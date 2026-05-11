// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {NumericArrowType} from './arrow-types';

const makeNumericData = arrow.makeData as <T extends NumericArrowType>(props: {
  type: T;
  length: number;
  data: T['TArray'];
}) => arrow.Data<T>;

const makeFixedSizeListData = arrow.makeData as <T extends NumericArrowType>(props: {
  type: arrow.FixedSizeList<T>;
  length: number;
  nullCount: number;
  nullBitmap: null;
  child: arrow.Data<T>;
}) => arrow.Data<arrow.FixedSizeList<T>>;

export function makeArrowFixedSizeListVector(
  childType: arrow.Float16,
  listSize: 1 | 2 | 3 | 4,
  values: arrow.Float16['TArray']
): arrow.Vector<arrow.FixedSizeList<arrow.Float16>>;
export function makeArrowFixedSizeListVector(
  childType: arrow.Float32,
  listSize: 1 | 2 | 3 | 4,
  values: Float32Array
): arrow.Vector<arrow.FixedSizeList<arrow.Float32>>;
export function makeArrowFixedSizeListVector(
  childType: arrow.Int8,
  listSize: 1 | 2 | 3 | 4,
  values: Int8Array
): arrow.Vector<arrow.FixedSizeList<arrow.Int8>>;
export function makeArrowFixedSizeListVector(
  childType: arrow.Int16,
  listSize: 1 | 2 | 3 | 4,
  values: Int16Array
): arrow.Vector<arrow.FixedSizeList<arrow.Int16>>;
export function makeArrowFixedSizeListVector(
  childType: arrow.Int32,
  listSize: 1 | 2 | 3 | 4,
  values: Int32Array
): arrow.Vector<arrow.FixedSizeList<arrow.Int32>>;
export function makeArrowFixedSizeListVector(
  childType: arrow.Uint8,
  listSize: 1 | 2 | 3 | 4,
  values: Uint8Array
): arrow.Vector<arrow.FixedSizeList<arrow.Uint8>>;
export function makeArrowFixedSizeListVector(
  childType: arrow.Uint16,
  listSize: 1 | 2 | 3 | 4,
  values: Uint16Array
): arrow.Vector<arrow.FixedSizeList<arrow.Uint16>>;
export function makeArrowFixedSizeListVector(
  childType: arrow.Uint32,
  listSize: 1 | 2 | 3 | 4,
  values: Uint32Array
): arrow.Vector<arrow.FixedSizeList<arrow.Uint32>>;

/** Create a FixedSizeList vector from a flat typed array of numeric child values. */
export function makeArrowFixedSizeListVector<T extends NumericArrowType>(
  childType: T,
  listSize: 1 | 2 | 3 | 4,
  values: T['TArray']
): arrow.Vector<arrow.FixedSizeList<T>> {
  if (values.length % listSize !== 0) {
    throw new Error(
      `FixedSizeList values length ${values.length} must be divisible by list size ${listSize}`
    );
  }

  const childData = makeNumericData({
    type: childType,
    length: values.length,
    data: values
  });
  const listType = new arrow.FixedSizeList(listSize, new arrow.Field('value', childType));
  const listData = makeFixedSizeListData({
    type: listType,
    length: values.length / listSize,
    nullCount: 0,
    nullBitmap: null,
    child: childData
  });

  return arrow.makeVector(listData);
}

/** Check whether a vector is a FixedSizeList vector with the requested child type and list size. */
export function isArrowFixedSizeListVector<T extends NumericArrowType>(
  vector: arrow.Vector,
  childType: T,
  listSize: number
): vector is arrow.Vector<arrow.FixedSizeList<T>> {
  return (
    arrow.DataType.isFixedSizeList(vector.type) &&
    vector.type.listSize === listSize &&
    arrow.util.compareTypes(childType, vector.type.children[0].type)
  );
}

/** Return the flat child value array from a FixedSizeList vector. */
export function getArrowFixedSizeListValues<T extends NumericArrowType>(
  vector: arrow.Vector<arrow.FixedSizeList<T>>
): T['TArray'] {
  const values = vector.getChildAt(0)?.data[0]?.values;
  if (!values) {
    throw new Error('Arrow FixedSizeList vector has no child values');
  }
  return values as T['TArray'];
}

export function getArrowVectorBufferSource<T extends NumericArrowType>(
  vector: arrow.Vector<T>
): T['TArray'];
export function getArrowVectorBufferSource<T extends NumericArrowType>(
  vector: arrow.Vector<arrow.FixedSizeList<T>>
): T['TArray'];
/** Return a typed array that can be passed directly to `device.createBuffer()`. */
export function getArrowVectorBufferSource(vector: arrow.Vector): NumericArrowType['TArray'] {
  if (arrow.DataType.isFixedSizeList(vector.type)) {
    return getArrowFixedSizeListValues(
      vector as arrow.Vector<arrow.FixedSizeList<NumericArrowType>>
    );
  }

  const values = vector.data[0]?.values;
  if (!values) {
    throw new Error('Arrow vector has no values');
  }
  return values as NumericArrowType['TArray'];
}
