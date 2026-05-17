// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {getArrowVectorBufferSource} from './arrow-gpu-data';
import {isNumericArrowType, type NumericArrowType} from './arrow-types';

export {getArrowDataBufferSource, getArrowVectorBufferSource} from './arrow-gpu-data';

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

/**
 * Create Arrow vectors from JS arrays, with an optional flat FixedSizeList form for numeric rows.
 *
 * `makeArrowVectorFromArray(values, type)` mirrors Apache Arrow's scalar/string helper.
 * `makeArrowVectorFromArray(values, childType, listSize)` packs flat numeric values into
 * `FixedSizeList<childType>[listSize]` rows.
 */
export function makeArrowVectorFromArray<T extends NumericArrowType>(
  values: readonly number[] | T['TArray'],
  childType: T,
  listSize: 1 | 2 | 3 | 4
): arrow.Vector<arrow.FixedSizeList<T>>;
export function makeArrowVectorFromArray<T extends arrow.DataType>(
  values: readonly unknown[],
  type: T
): arrow.Vector<T>;
export function makeArrowVectorFromArray(
  values: readonly unknown[] | NumericArrowType['TArray'],
  type: arrow.DataType,
  listSize?: 1 | 2 | 3 | 4
): arrow.Vector {
  if (listSize === undefined) {
    return arrow.vectorFromArray(Array.from(values as readonly unknown[]), type);
  }
  if (!isNumericArrowType(type)) {
    throw new Error('FixedSizeList array vectors require a numeric Arrow child type');
  }

  const typedValues = Array.isArray(values)
    ? getArrowVectorBufferSource(arrow.vectorFromArray(values, type))
    : values;
  const makeNumericFixedSizeListVector = makeArrowFixedSizeListVector as <
    T extends NumericArrowType
  >(
    childType: T,
    fixedListSize: 1 | 2 | 3 | 4,
    childValues: T['TArray']
  ) => arrow.Vector<arrow.FixedSizeList<T>>;
  return makeNumericFixedSizeListVector(type, listSize, typedValues as NumericArrowType['TArray']);
}

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
  return getArrowVectorBufferSource(vector);
}
