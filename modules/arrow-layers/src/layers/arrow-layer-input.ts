// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getArrowPaths,
  getArrowRecordBatchAsyncIterator,
  type ArrowRecordBatchSource
} from '@luma.gl/arrow';
import {GPUVector, type GPUVectorFormat} from '@luma.gl/tables';
import {RecordBatch, Table, type DataType, type Vector} from 'apache-arrow';

/** Arrow or GPU-resident column accepted by a deck Arrow layer input. */
export type ArrowLayerColumnSource<
  ArrowType extends DataType = DataType,
  GPUFormat extends GPUVectorFormat = GPUVectorFormat
> = string | Vector<ArrowType> | GPUVector<GPUFormat>;

/** One semantic layer input supplied as a constant, source, or source with an explicit null value. */
export type ArrowLayerInput<Value, Source> =
  | Value
  | Source
  | {
      source: Source;
      nullValue: Value;
    };

/** Returns whether a value is a caller-owned GPU vector. */
export function isArrowLayerGPUVector(value: unknown): value is GPUVector {
  return value instanceof GPUVector;
}

/** Validates a caller-owned GPU vector before a layer borrows it. */
export function assertArrowLayerGPUVector(
  ownerName: string,
  vector: GPUVector,
  formats: readonly GPUVectorFormat[],
  expectedLength?: number
): void {
  if (!vector.format || !formats.includes(vector.format)) {
    throw new Error(
      `${ownerName} GPUVector.format "${vector.format ?? 'undefined'}" must be one of ${formats.join(', ')}`
    );
  }
  if (expectedLength !== undefined && vector.length !== expectedLength) {
    throw new Error(
      `${ownerName} GPUVector rows must match source rows (${vector.length} !== ${expectedLength})`
    );
  }
  for (const data of vector.data) {
    if (data.nullBitmap && hasNullRows(data.nullBitmap, data.length)) {
      throw new Error(
        `${ownerName} direct GPUVector "${vector.name}" contains null rows; replace nulls before passing a GPUVector`
      );
    }
  }
}

function hasNullRows(nullBitmap: Uint8Array, length: number): boolean {
  for (let rowIndex = 0; rowIndex < length; rowIndex++) {
    if ((nullBitmap[rowIndex >> 3] & (1 << (rowIndex & 7))) === 0) {
      return true;
    }
  }
  return false;
}

/** Returns whether a semantic input explicitly supplies a source and null replacement value. */
export function isArrowLayerInputWithNullValue<Value, Source>(
  value: ArrowLayerInput<Value, Source> | undefined,
  isConstant: (candidate: unknown) => candidate is Value
): value is {source: Source; nullValue: Value} {
  return Boolean(
    value &&
      !isConstant(value) &&
      typeof value === 'object' &&
      'source' in value &&
      'nullValue' in value
  );
}

/** Resolves the column portion of one semantic input, if it is not a constant. */
export function getArrowLayerInputSource<Value, Source>(
  value: ArrowLayerInput<Value, Source> | undefined,
  isConstant: (candidate: unknown) => candidate is Value
): Source | undefined {
  if (value === undefined || isConstant(value)) {
    return undefined;
  }
  return isArrowLayerInputWithNullValue(value, isConstant) ? value.source : (value as Source);
}

/** Resolves the constant or null replacement value for one semantic input. */
export function getArrowLayerInputNullValue<Value, Source>(
  value: ArrowLayerInput<Value, Source> | undefined,
  defaultValue: Value,
  isConstant: (candidate: unknown) => candidate is Value
): Value {
  if (value === undefined) {
    return defaultValue;
  }
  if (isConstant(value)) {
    return value;
  }
  return isArrowLayerInputWithNullValue(value, isConstant) ? value.nullValue : defaultValue;
}

/** Returns whether a named column exists in one materialized Arrow source batch. */
export function hasArrowLayerColumn(
  data: Table | RecordBatch | null | undefined,
  columnPath: string
): boolean {
  return Boolean(data && getArrowPaths(data).includes(columnPath));
}

/**
 * Inspects the first batch of a possibly streamed source and returns a replayable source.
 * Record-batch streams are expected to preserve one schema, so the first batch determines column
 * availability.
 */
export async function inspectArrowLayerColumn(
  data: ArrowRecordBatchSource,
  columnPath: string
): Promise<{data: ArrowRecordBatchSource; hasColumn: boolean; cancel: () => Promise<void>}> {
  if (data instanceof Table || data instanceof RecordBatch) {
    return {
      data,
      hasColumn: hasArrowLayerColumn(data, columnPath),
      cancel: async () => {}
    };
  }

  const iterator = getArrowRecordBatchAsyncIterator(data);
  const firstResult = await iterator.next();
  const cancel = async (): Promise<void> => {
    await iterator.return?.();
  };
  if (firstResult.done) {
    return {
      data: replayArrowLayerRecordBatches(undefined, iterator),
      hasColumn: false,
      cancel
    };
  }
  return {
    data: replayArrowLayerRecordBatches(firstResult.value, iterator),
    hasColumn: hasArrowLayerColumn(firstResult.value, columnPath),
    cancel
  };
}

async function* replayArrowLayerRecordBatches(
  firstRecordBatch: RecordBatch | undefined,
  iterator: AsyncIterator<RecordBatch>
): AsyncGenerator<RecordBatch> {
  try {
    if (firstRecordBatch) {
      yield firstRecordBatch;
    }
    for (let result = await iterator.next(); !result.done; result = await iterator.next()) {
      yield result.value;
    }
  } finally {
    await iterator.return?.();
  }
}

/** Returns whether a semantic color value is a constant RGBA tuple. */
export function isArrowLayerColor(value: unknown): value is [number, number, number, number] {
  return Array.isArray(value) && value.length === 4 && value.every(Number.isFinite);
}

/** Returns whether a semantic scalar value is a finite constant. */
export function isArrowLayerScalar(value: unknown): value is number {
  return Number.isFinite(value);
}
