// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  getGPUQueryBatchSegments,
  type GPUQueryBatchSegment
} from '../../src/gpu-dataframe/gpu-query-compiler';

type Chunk = {buffer: object; byteOffset: number; byteStride: number; rowByteLength: number};

const LARGE_LIMITS = {maxStorageBufferBindingSize: 1 << 27, maxBufferSize: 1 << 28};

/** Slices one buffer into packed uint32 batch views starting at `firstRow`. */
function makeSharedChunks(buffer: object, rowCounts: readonly number[], firstRow = 0): Chunk[] {
  let row = firstRow;
  return rowCounts.map(rowCount => {
    const chunk = {buffer, byteOffset: row * 4, byteStride: 4, rowByteLength: 4};
    row += rowCount;
    return chunk;
  });
}

function makeBatches(rowCounts: readonly number[]) {
  return rowCounts.map(numRows => ({numRows, sourceInfo: undefined}));
}

/** Summarizes segments as [firstBatchIndex, batchCount]; single-batch segments have one batch. */
function getSegmentRanges(segments: readonly GPUQueryBatchSegment[]): number[][] {
  return segments.map(segment =>
    segment.type === 'batch'
      ? [segment.batchIndex, 1]
      : [segment.firstBatchIndex, segment.rowStarts.length]
  );
}

it('getGPUQueryBatchSegments fuses contiguous shared-buffer batches into one segment', () => {
  const rowCounts = [3, 0, 700, 5];
  const segments = getGPUQueryBatchSegments(
    makeBatches(rowCounts),
    [makeSharedChunks({}, rowCounts, 7)],
    LARGE_LIMITS
  );
  expect(segments, 'one segment with local row starts and running source starts').toEqual([
    {
      type: 'fused',
      firstBatchIndex: 0,
      rowStarts: [0, 3, 3, 703],
      rowCount: 708,
      sourceStarts: [0, 3, 3, 703]
    }
  ]);
});

it('getGPUQueryBatchSegments keeps trailing empty batches out of fused segments', () => {
  const rowCounts = [0, 2, 3, 0, 0];
  const segments = getGPUQueryBatchSegments(
    makeBatches(rowCounts),
    [makeSharedChunks({}, rowCounts)],
    LARGE_LIMITS
  );
  expect(segments, 'a fused segment ends at its last nonempty batch').toEqual([
    {type: 'fused', firstBatchIndex: 0, rowStarts: [0, 0, 2], rowCount: 5, sourceStarts: [0, 0, 2]},
    {type: 'batch', batchIndex: 3, numRows: 0, sourceStart: 5},
    {type: 'batch', batchIndex: 4, numRows: 0, sourceStart: 5}
  ]);
});

it('getGPUQueryBatchSegments keeps queries without inputs and single batches per batch', () => {
  expect(
    getSegmentRanges(getGPUQueryBatchSegments(makeBatches([2, 3]), [], LARGE_LIMITS)),
    'queries without predicate inputs keep independent per-batch buffers'
  ).toEqual([
    [0, 1],
    [1, 1]
  ]);
  expect(
    getSegmentRanges(
      getGPUQueryBatchSegments(makeBatches([4]), [makeSharedChunks({}, [4])], LARGE_LIMITS)
    ),
    'a single batch keeps the per-batch path'
  ).toEqual([[0, 1]]);
  expect(getGPUQueryBatchSegments([], [[]], LARGE_LIMITS), 'empty tables have no segments').toEqual(
    []
  );
});

it('getGPUQueryBatchSegments splits runs at buffer, offset, and stride boundaries', () => {
  const first = {};
  const second = {};
  const rowCounts = [2, 0, 3, 4, 5, 6, 1];
  const chunks = [
    ...makeSharedChunks(first, [2, 0, 3]),
    // Starts a new buffer.
    ...makeSharedChunks(second, [4, 5]),
    // Same buffer, but leaves a one-row gap after the previous batch.
    {buffer: second, byteOffset: (4 + 5 + 1) * 4, byteStride: 4, rowByteLength: 4},
    // Strided rows can never share a fused binding.
    {buffer: second, byteOffset: 0, byteStride: 8, rowByteLength: 4}
  ];
  expect(
    getSegmentRanges(getGPUQueryBatchSegments(makeBatches(rowCounts), [chunks], LARGE_LIMITS))
  ).toEqual([
    [0, 3],
    [3, 2],
    [5, 1],
    [6, 1]
  ]);
});

it('getGPUQueryBatchSegments requires every input to be contiguous', () => {
  const rowCounts = [2, 3, 4];
  const sharedValues = makeSharedChunks({}, rowCounts);
  const separateValidity = rowCounts.map(() => ({
    buffer: {},
    byteOffset: 0,
    byteStride: 4,
    rowByteLength: 4
  }));
  expect(
    getSegmentRanges(
      getGPUQueryBatchSegments(
        makeBatches(rowCounts),
        [sharedValues, separateValidity],
        LARGE_LIMITS
      )
    ),
    'shared values with separate validity chunks fall back to per-batch passes'
  ).toEqual([
    [0, 1],
    [1, 1],
    [2, 1]
  ]);
});

it('getGPUQueryBatchSegments keeps fused bindings and outputs inside device limits', () => {
  const rowCounts = [3, 0, 700, 5, 300, 200, 100, 0];
  // The shared buffer starts 7 rows (28 bytes) before the first batch.
  const chunks = [makeSharedChunks({}, rowCounts, 7)];
  const segments = getGPUQueryBatchSegments(makeBatches(rowCounts), chunks, {
    maxStorageBufferBindingSize: 4096,
    maxBufferSize: 1 << 28
  });
  // A binding from the aligned offset 28 bytes before the first row fits (4096 - 28) / 4 = 1017
  // rows, so batches 0-4 (1008 rows) fuse. Batch 5 starts at byte 4060, 220 bytes past alignment.
  expect(segments, 'runs split before exceeding the binding size').toEqual([
    {
      type: 'fused',
      firstBatchIndex: 0,
      rowStarts: [0, 3, 3, 703, 708],
      rowCount: 1008,
      sourceStarts: [0, 3, 3, 703, 708]
    },
    {
      type: 'fused',
      firstBatchIndex: 5,
      rowStarts: [0, 200],
      rowCount: 300,
      sourceStarts: [1008, 1208]
    },
    {type: 'batch', batchIndex: 7, numRows: 0, sourceStart: 1308}
  ]);

  const alignedRowCounts = [512, 512];
  expect(
    getSegmentRanges(
      getGPUQueryBatchSegments(
        makeBatches(alignedRowCounts),
        [makeSharedChunks({}, alignedRowCounts)],
        {maxStorageBufferBindingSize: 4096, maxBufferSize: 4096}
      )
    ),
    'an aligned run fills the whole binding size'
  ).toEqual([[0, 2]]);

  expect(
    getSegmentRanges(
      getGPUQueryBatchSegments(makeBatches(rowCounts), chunks, {
        maxStorageBufferBindingSize: 1 << 27,
        // 1024 / 4 = 256 rows per output buffer.
        maxBufferSize: 1024
      })
    ),
    'batches larger than one output buffer keep the per-batch path'
  ).toEqual(rowCounts.map((_, batchIndex) => [batchIndex, 1]));

  expect(
    getSegmentRanges(
      getGPUQueryBatchSegments(makeBatches(rowCounts), chunks, {
        maxStorageBufferBindingSize: 0,
        maxBufferSize: 0
      })
    ),
    'devices without storage bindings never fuse'
  ).toHaveLength(rowCounts.length);
});

it('getGPUQueryBatchSegments rejects source-row IDs that cannot be written as uint32', () => {
  const rowCounts = [2, 2, 2];
  const batches = [0, 0xffffffff, 10].map((sourceRowIndexOffset, sourceBatchIndex) => ({
    numRows: 2,
    sourceInfo: {sourceBatchIndex, sourceRowIndexOffset, sourceRowCount: 2}
  }));
  expect(
    getSegmentRanges(
      getGPUQueryBatchSegments(batches, [makeSharedChunks({}, rowCounts)], LARGE_LIMITS)
    )
  ).toEqual([
    [0, 1],
    [1, 1],
    [2, 1]
  ]);
});

it.each([
  false,
  true
])('getGPUQueryBatchSegments bounds lookup tables with empty batches: %s', empty => {
  const rowCounts = Array.from({length: 256}, (_, index) => (empty && index % 4 ? 0 : 1));
  const segments = getGPUQueryBatchSegments(
    makeBatches(rowCounts),
    [makeSharedChunks({}, rowCounts)],
    {
      maxStorageBufferBindingSize: 1024,
      maxBufferSize: 1024
    }
  );
  expect(segments.length).toBeGreaterThan(1);
  expect(
    getSegmentRanges(segments).reduce((total, [, batchCount]) => total + batchCount, 0),
    'every batch belongs to exactly one segment'
  ).toBe(rowCounts.length);
  for (const segment of segments) {
    if (segment.type === 'fused') {
      // Row starts, the row count, and source starts.
      expect((2 * segment.rowStarts.length + 1) * 4).toBeLessThanOrEqual(1024);
      expect(segment.rowCount * 4).toBeLessThanOrEqual(1024);
    }
  }
});
