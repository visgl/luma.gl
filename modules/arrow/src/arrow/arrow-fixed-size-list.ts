// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Data,
  DataType,
  Field,
  FixedSizeList,
  Float16,
  Float32,
  Int16,
  Int32,
  Int8,
  Uint16,
  Uint32,
  Uint8,
  Vector,
  makeData,
  makeVector,
  util,
  vectorFromArray
} from 'apache-arrow';
import {getArrowVectorBufferSource} from './arrow-gpu-data';
import {isNumericArrowType, type NumericArrowType} from './arrow-types';

export {getArrowDataBufferSource, getArrowVectorBufferSource} from './arrow-gpu-data';

const makeNumericData = makeData as <T extends NumericArrowType>(props: {
  type: T;
  length: number;
  data: T['TArray'];
}) => Data<T>;

const makeFixedSizeListData = makeData as <T extends NumericArrowType>(props: {
  type: FixedSizeList<T>;
  length: number;
  nullCount: number;
  nullBitmap: null;
  child: Data<T>;
}) => Data<FixedSizeList<T>>;

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
): Vector<FixedSizeList<T>>;
export function makeArrowVectorFromArray<T extends DataType>(
  values: readonly unknown[],
  type: T
): Vector<T>;
export function makeArrowVectorFromArray(
  values: readonly unknown[] | NumericArrowType['TArray'],
  type: DataType,
  listSize?: 1 | 2 | 3 | 4
): Vector {
  if (listSize === undefined) {
    return vectorFromArray(Array.from(values as readonly unknown[]), type);
  }
  if (!isNumericArrowType(type)) {
    throw new Error('FixedSizeList array vectors require a numeric Arrow child type');
  }

  const typedValues = Array.isArray(values)
    ? getArrowVectorBufferSource(vectorFromArray(values, type))
    : values;
  const makeNumericFixedSizeListVector = makeArrowFixedSizeListVector as <
    T extends NumericArrowType
  >(
    childType: T,
    fixedListSize: 1 | 2 | 3 | 4,
    childValues: T['TArray']
  ) => Vector<FixedSizeList<T>>;
  return makeNumericFixedSizeListVector(type, listSize, typedValues as NumericArrowType['TArray']);
}

export function makeArrowFixedSizeListVector(
  childType: Float16,
  listSize: 1 | 2 | 3 | 4,
  values: Float16['TArray']
): Vector<FixedSizeList<Float16>>;
export function makeArrowFixedSizeListVector(
  childType: Float32,
  listSize: 1 | 2 | 3 | 4,
  values: Float32Array
): Vector<FixedSizeList<Float32>>;
export function makeArrowFixedSizeListVector(
  childType: Int8,
  listSize: 1 | 2 | 3 | 4,
  values: Int8Array
): Vector<FixedSizeList<Int8>>;
export function makeArrowFixedSizeListVector(
  childType: Int16,
  listSize: 1 | 2 | 3 | 4,
  values: Int16Array
): Vector<FixedSizeList<Int16>>;
export function makeArrowFixedSizeListVector(
  childType: Int32,
  listSize: 1 | 2 | 3 | 4,
  values: Int32Array
): Vector<FixedSizeList<Int32>>;
export function makeArrowFixedSizeListVector(
  childType: Uint8,
  listSize: 1 | 2 | 3 | 4,
  values: Uint8Array
): Vector<FixedSizeList<Uint8>>;
export function makeArrowFixedSizeListVector(
  childType: Uint16,
  listSize: 1 | 2 | 3 | 4,
  values: Uint16Array
): Vector<FixedSizeList<Uint16>>;
export function makeArrowFixedSizeListVector(
  childType: Uint32,
  listSize: 1 | 2 | 3 | 4,
  values: Uint32Array
): Vector<FixedSizeList<Uint32>>;

/** Create a FixedSizeList vector from a flat typed array of numeric child values. */
export function makeArrowFixedSizeListVector<T extends NumericArrowType>(
  childType: T,
  listSize: 1 | 2 | 3 | 4,
  values: T['TArray']
): Vector<FixedSizeList<T>> {
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
  const listType = new FixedSizeList(listSize, new Field('value', childType));
  const listData = makeFixedSizeListData({
    type: listType,
    length: values.length / listSize,
    nullCount: 0,
    nullBitmap: null,
    child: childData
  });

  return makeVector(listData);
}

/** Check whether a vector is a FixedSizeList vector with the requested child type and list size. */
export function isArrowFixedSizeListVector<T extends NumericArrowType>(
  vector: Vector,
  childType: T,
  listSize: number
): vector is Vector<FixedSizeList<T>> {
  return (
    DataType.isFixedSizeList(vector.type) &&
    vector.type.listSize === listSize &&
    util.compareTypes(childType, vector.type.children[0].type)
  );
}

/** Return the flat child value array from a FixedSizeList vector. */
export function getArrowFixedSizeListValues<T extends NumericArrowType>(
  vector: Vector<FixedSizeList<T>>
): T['TArray'] {
  return getArrowVectorBufferSource(vector);
}
