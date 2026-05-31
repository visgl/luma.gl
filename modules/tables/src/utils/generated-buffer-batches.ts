// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';

const GENERATED_BUFFER_BATCH_HEADROOM_RATIO = 0.95;

/** One contiguous source-row span whose generated records fit one GPU buffer. */
export type GeneratedBufferBatch = {
  /** First source row included in this generated batch. */
  rowStart: number;
  /** Source row after the last included row. */
  rowEnd: number;
  /** First generated output record covered by this batch. */
  recordStart: number;
  /** Generated output record after the last covered record. */
  recordEnd: number;
  /** Number of generated output records in this batch. */
  recordCount: number;
  /** Byte size of this batch's generated GPU buffer. */
  byteLength: number;
};

/** Inputs for {@link planGeneratedBufferBatches}. */
export type GeneratedBufferBatchPlannerProps = {
  /** Device whose buffer allocation limit constrains the generated output. */
  device: Device;
  /** Cumulative generated-record offsets, length = sourceRowCount + 1. */
  recordOffsets: readonly number[] | ArrayLike<number>;
  /** Bytes per generated output record. */
  recordByteStride: number;
  /** Optional stricter byte ceiling, such as a storage-buffer binding limit. */
  maxBatchByteLength?: number;
  /** Optional resource name included in oversize-row errors. */
  resourceLabel?: string;
};

/**
 * Split row-oriented generated output into contiguous GPU buffer batches.
 *
 * Rows remain indivisible. Zero-output rows stay in row order and are grouped
 * with adjacent rows whenever possible.
 */
export function planGeneratedBufferBatches({
  device,
  recordOffsets,
  recordByteStride,
  maxBatchByteLength,
  resourceLabel = 'Generated GPU buffer'
}: GeneratedBufferBatchPlannerProps): GeneratedBufferBatch[] {
  if (!Number.isInteger(recordByteStride) || recordByteStride <= 0) {
    throw new Error(
      'Generated buffer batch planning requires a positive integer record byte stride'
    );
  }
  if (recordOffsets.length === 0) {
    throw new Error('Generated buffer batch planning requires at least one record offset');
  }

  const generatedBufferBatchByteLimit = getGeneratedBufferBatchByteLimit(
    device,
    recordByteStride,
    maxBatchByteLength
  );
  const rowCount = recordOffsets.length - 1;
  const batches: GeneratedBufferBatch[] = [];
  let batchRowStart = 0;
  let batchRecordStart = getRecordOffset(recordOffsets, 0);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rowRecordStart = getRecordOffset(recordOffsets, rowIndex);
    const rowRecordEnd = getRecordOffset(recordOffsets, rowIndex + 1);
    if (rowRecordEnd < rowRecordStart) {
      throw new Error('Generated buffer record offsets must be monotonically increasing');
    }

    const rowByteLength = (rowRecordEnd - rowRecordStart) * recordByteStride;
    if (rowByteLength > generatedBufferBatchByteLimit) {
      throw new Error(
        `${resourceLabel} row ${rowIndex} requires ${rowByteLength} bytes, ` +
          `but the generated buffer batch limit is ${generatedBufferBatchByteLimit} bytes`
      );
    }

    const candidateByteLength = (rowRecordEnd - batchRecordStart) * recordByteStride;
    if (candidateByteLength > generatedBufferBatchByteLimit && rowIndex > batchRowStart) {
      batches.push(
        createGeneratedBufferBatch(
          batchRowStart,
          rowIndex,
          batchRecordStart,
          rowRecordStart,
          recordByteStride
        )
      );
      batchRowStart = rowIndex;
      batchRecordStart = rowRecordStart;
    }
  }

  batches.push(
    createGeneratedBufferBatch(
      batchRowStart,
      rowCount,
      batchRecordStart,
      getRecordOffset(recordOffsets, rowCount),
      recordByteStride
    )
  );

  return batches;
}

/** Effective generated-output byte budget after headroom and stride alignment. */
export function getGeneratedBufferBatchByteLimit(
  device: Device,
  recordByteStride: number,
  maxBatchByteLength?: number
): number {
  const maxBufferSize = device.limits.maxBufferSize;
  if (!Number.isFinite(maxBufferSize) || maxBufferSize <= 0) {
    throw new Error('Generated buffer batch planning requires device.limits.maxBufferSize');
  }
  if (
    maxBatchByteLength !== undefined &&
    (!Number.isFinite(maxBatchByteLength) || maxBatchByteLength <= 0)
  ) {
    throw new Error('Generated buffer batch planning requires a positive maxBatchByteLength');
  }
  const effectiveLimit =
    maxBatchByteLength === undefined ? maxBufferSize : Math.min(maxBufferSize, maxBatchByteLength);
  const headroomLimit = Math.floor(effectiveLimit * GENERATED_BUFFER_BATCH_HEADROOM_RATIO);
  const alignedLimit = Math.floor(headroomLimit / recordByteStride) * recordByteStride;
  return Math.max(recordByteStride, alignedLimit);
}

function createGeneratedBufferBatch(
  rowStart: number,
  rowEnd: number,
  recordStart: number,
  recordEnd: number,
  recordByteStride: number
): GeneratedBufferBatch {
  const recordCount = recordEnd - recordStart;
  return {
    rowStart,
    rowEnd,
    recordStart,
    recordEnd,
    recordCount,
    byteLength: recordCount * recordByteStride
  };
}

function getRecordOffset(
  recordOffsets: readonly number[] | ArrayLike<number>,
  index: number
): number {
  const offset = Number(recordOffsets[index] ?? 0);
  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error('Generated buffer record offsets must be non-negative integers');
  }
  return offset;
}
