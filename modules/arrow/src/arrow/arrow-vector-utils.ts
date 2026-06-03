// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Data,
  DataType,
  Field,
  FixedSizeList,
  Int,
  Precision,
  Vector,
  makeData,
  makeVector
} from 'apache-arrow';
import {getArrowVectorBufferSource} from './arrow-gpu-data';
import {isNumericArrowType, type AttributeArrowType, type NumericArrowType} from './arrow-types';

type IntegerTypedArray =
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array;

/** Row indices accepted when expanding compact Arrow rows into aligned rows. */
export type ArrowVectorRowMapping = IntegerTypedArray | Vector<Int>;

/**
 * Constant value used when `expandArrowVector()` maps a null source row.
 *
 * Scalar numeric vectors accept a number. FixedSizeList numeric vectors accept an array-like value
 * with exactly one entry per list component.
 */
export type ArrowVectorNullValue = number | ArrayLike<number>;

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
 * Returns the byte length of the buffers owned by an Arrow vector.
 *
 * Apache Arrow's Vector.byteLength counts the vector Data buffers, but dictionary vectors
 * reference their dictionary values separately. This helper walks each Data chunk, its
 * children, and any dictionary vectors so callers can account for dictionary-encoded columns.
 */
export function getArrowVectorByteLength(vector: Vector): number {
  return getArrowVectorBufferByteLength(vector, new Set<Vector>());
}

function getArrowVectorBufferByteLength(vector: Vector, countedVectors: Set<Vector>): number {
  if (countedVectors.has(vector)) {
    return 0;
  }
  countedVectors.add(vector);

  let byteLength = 0;
  for (const data of vector.data) {
    byteLength += getArrowDataBufferByteLength(data, countedVectors);
  }
  return byteLength;
}

function getArrowDataBufferByteLength(data: Data, countedVectors: Set<Vector>): number {
  let byteLength = 0;
  for (const buffer of data.buffers as unknown as unknown[]) {
    byteLength += getBufferByteLength(buffer);
  }
  for (const childData of data.children) {
    byteLength += getArrowDataBufferByteLength(childData, countedVectors);
  }
  if (data.dictionary) {
    byteLength += getArrowVectorBufferByteLength(data.dictionary, countedVectors);
  }
  return byteLength;
}

function getBufferByteLength(buffer: unknown): number {
  if (!buffer) {
    return 0;
  }
  if (ArrayBuffer.isView(buffer)) {
    return buffer.byteLength;
  }
  if (buffer instanceof ArrayBuffer) {
    return buffer.byteLength;
  }
  if (typeof SharedArrayBuffer !== 'undefined' && buffer instanceof SharedArrayBuffer) {
    return buffer.byteLength;
  }
  if (typeof buffer === 'object' && 'byteLength' in buffer) {
    const {byteLength} = buffer as {byteLength?: unknown};
    return typeof byteLength === 'number' ? byteLength : 0;
  }
  return 0;
}

/**
 * Gather scalar or FixedSizeList Arrow rows into a new contiguous vector.
 *
 * This is useful when compact table data needs to be expanded into vertex-aligned data.
 * If `nullValue` is supplied, mapped null source rows expand to that constant value; otherwise
 * null rows preserve the existing values-buffer copy behavior.
 */
export function expandArrowVector<T extends AttributeArrowType>(
  vector: Vector<T>,
  rowMapping: ArrowVectorRowMapping,
  nullValue?: ArrowVectorNullValue
): Vector<T> {
  const {numericType, rowStride} = getExpansionVectorInfo(vector);
  const sourceValues = getArrowVectorBufferSource(vector);
  const rowIndices = getRowIndices(rowMapping);
  const nullValueRow = normalizeNullValue(vector, rowStride, sourceValues, nullValue);
  if (nullValueRow && DataType.isFixedSizeList(vector.type)) {
    assertFixedSizeListChildValuesAreNonNullable(vector);
  }
  const expandedValues = createTypedArrayLike(
    sourceValues,
    rowIndices.length * rowStride
  ) as NumericArrowType['TArray'];

  for (let targetRowIndex = 0; targetRowIndex < rowIndices.length; targetRowIndex++) {
    const sourceRowIndex = Number(rowIndices[targetRowIndex]);
    validateRowIndex(sourceRowIndex, vector.length);

    const sourceOffset = sourceRowIndex * rowStride;
    const targetOffset = targetRowIndex * rowStride;
    const sourceRow = isArrowVectorRowValid(vector, sourceRowIndex)
      ? sourceValues.subarray(sourceOffset, sourceOffset + rowStride)
      : nullValueRow;
    if (!sourceRow) {
      expandedValues.set(
        sourceValues.subarray(sourceOffset, sourceOffset + rowStride) as never,
        targetOffset
      );
      continue;
    }
    expandedValues.set(sourceRow as never, targetOffset);
  }

  if (DataType.isFixedSizeList(vector.type)) {
    return makeFixedSizeListVector(
      numericType,
      rowStride as 1 | 2 | 3 | 4,
      expandedValues
    ) as unknown as Vector<T>;
  }

  const data = makeNumericData({
    type: numericType,
    length: rowIndices.length,
    data: expandedValues as never
  });
  return makeVector(data) as Vector<T>;
}

function normalizeNullValue<T extends AttributeArrowType>(
  vector: Vector<T>,
  rowStride: number,
  sourceValues: NumericArrowType['TArray'],
  nullValue: ArrowVectorNullValue | undefined
): NumericArrowType['TArray'] | undefined {
  if (nullValue === undefined) {
    return undefined;
  }
  const typedNullValue = createTypedArrayLike(sourceValues, rowStride);
  if (DataType.isFixedSizeList(vector.type)) {
    if (typeof nullValue === 'number') {
      throw new Error('expandArrowVector FixedSizeList nullValue must be an array');
    }
    if (nullValue.length !== rowStride) {
      throw new Error(
        `expandArrowVector FixedSizeList nullValue length ${nullValue.length} must match listSize ${rowStride}`
      );
    }
    for (let component = 0; component < rowStride; component++) {
      typedNullValue[component] = nullValue[component] ?? 0;
    }
    return typedNullValue;
  }

  if (typeof nullValue !== 'number') {
    throw new Error('expandArrowVector scalar nullValue must be a number');
  }
  typedNullValue[0] = nullValue;
  return typedNullValue;
}

function assertFixedSizeListChildValuesAreNonNullable<T extends AttributeArrowType>(
  vector: Vector<T>
): void {
  for (const data of vector.data) {
    const childData = data.children[0];
    if (
      !DataType.isFixedSizeList(data.type) ||
      !childData ||
      childData.nullCount === 0 ||
      !childData.nullBitmap
    ) {
      continue;
    }
    for (let localRowIndex = 0; localRowIndex < data.length; localRowIndex++) {
      if (!isArrowDataRowValid(data, localRowIndex)) {
        continue;
      }
      for (let component = 0; component < data.type.listSize; component++) {
        const childRowIndex = localRowIndex * data.type.listSize + component;
        if (!isArrowDataRowValid(childData, childRowIndex)) {
          throw new Error('expandArrowVector does not support nullable FixedSizeList child values');
        }
      }
    }
  }
}

function isArrowVectorRowValid<T extends AttributeArrowType>(
  vector: Vector<T>,
  rowIndex: number
): boolean {
  let rowStart = 0;
  for (const data of vector.data) {
    const rowEnd = rowStart + data.length;
    if (rowIndex < rowStart || rowIndex >= rowEnd) {
      rowStart = rowEnd;
      continue;
    }
    const localRowIndex = rowIndex - rowStart;
    return isArrowDataRowValid(data, localRowIndex);
  }
  return true;
}

function isArrowDataRowValid(data: Data, localRowIndex: number): boolean {
  if (data.nullCount === 0 || !data.nullBitmap) {
    return true;
  }
  const bitmapIndex = (data.offset ?? 0) + localRowIndex;
  const bitmapByte = data.nullBitmap[bitmapIndex >> 3] ?? 0;
  return (bitmapByte & (1 << (bitmapIndex & 7))) !== 0;
}

function makeFixedSizeListVector<T extends NumericArrowType>(
  numericType: T,
  rowStride: 1 | 2 | 3 | 4,
  values: T['TArray']
): Vector<FixedSizeList<T>> {
  const childData = makeNumericData({
    type: numericType,
    length: values.length,
    data: values
  });
  const listType = new FixedSizeList(rowStride, new Field('value', numericType));
  const listData = makeFixedSizeListData({
    type: listType,
    length: values.length / rowStride,
    nullCount: 0,
    nullBitmap: null,
    child: childData
  });

  return makeVector(listData);
}

function getExpansionVectorInfo<T extends AttributeArrowType>(
  vector: Vector<T>
): {numericType: NumericArrowType; rowStride: number} {
  if (DataType.isFixedSizeList(vector.type)) {
    const numericType = vector.type.children[0].type;
    if (!isSupportedExpansionNumericType(numericType)) {
      throw new Error(`expandArrowVector does not support Arrow type ${numericType}`);
    }
    if (vector.type.listSize < 1 || vector.type.listSize > 4) {
      throw new Error('expandArrowVector only supports FixedSizeList sizes between 1 and 4');
    }
    return {numericType, rowStride: vector.type.listSize};
  }

  if (!isSupportedExpansionNumericType(vector.type)) {
    throw new Error(`expandArrowVector does not support Arrow type ${vector.type}`);
  }
  return {numericType: vector.type, rowStride: 1};
}

function isSupportedExpansionNumericType(type: DataType): type is NumericArrowType {
  if (!isNumericArrowType(type)) {
    return false;
  }
  if (DataType.isInt(type)) {
    return type.bitWidth <= 32;
  }
  return type.precision !== Precision.DOUBLE;
}

function getRowIndices(rowMapping: ArrowVectorRowMapping): IntegerTypedArray {
  if (isIntegerTypedArray(rowMapping)) {
    return rowMapping;
  }

  if (!DataType.isInt(rowMapping.type) || rowMapping.type.bitWidth > 32) {
    throw new Error('expandArrowVector row mapping must use 8, 16, or 32-bit integers');
  }

  return getArrowVectorBufferSource(rowMapping) as IntegerTypedArray;
}

function isIntegerTypedArray(value: unknown): value is IntegerTypedArray {
  return (
    value instanceof Int8Array ||
    value instanceof Int16Array ||
    value instanceof Int32Array ||
    value instanceof Uint8Array ||
    value instanceof Uint16Array ||
    value instanceof Uint32Array
  );
}

function validateRowIndex(rowIndex: number, rowCount: number): void {
  if (!Number.isInteger(rowIndex)) {
    throw new Error('expandArrowVector row mapping must contain integers');
  }
  if (rowIndex < 0) {
    throw new Error('expandArrowVector row mapping cannot contain negative indices');
  }
  if (rowIndex >= rowCount) {
    throw new Error(
      `expandArrowVector row mapping index ${rowIndex} is outside vector length ${rowCount}`
    );
  }
}

function createTypedArrayLike(
  source: NumericArrowType['TArray'],
  length: number
): NumericArrowType['TArray'] {
  const TypedArrayConstructor = source.constructor as {
    new (typedArrayLength: number): NumericArrowType['TArray'];
  };
  return new TypedArrayConstructor(length);
}
