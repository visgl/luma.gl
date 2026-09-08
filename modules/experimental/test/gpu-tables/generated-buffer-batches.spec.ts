// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {NullDevice} from '@luma.gl/test-utils';
import {
  getGeneratedBufferBatchByteLimit,
  planGeneratedBufferBatches
} from '@luma.gl/experimental/gpu-tables';

it('planGeneratedBufferBatches splits row-preserving generated buffers', () => {
  const device = makeLimitedDevice(64);
  const byteLimit = getGeneratedBufferBatchByteLimit(device, 12);
  const batches = planGeneratedBufferBatches({
    device,
    recordOffsets: [0, 2, 2, 4, 5],
    recordByteStride: 12,
    resourceLabel: 'test generated buffer'
  });

  expect(byteLimit, '95% headroom aligns down to the record stride').toBe(60);
  expect(batches, 'exact-fit rows and zero-output rows stay in one batch').toEqual([
    {rowStart: 0, rowEnd: 4, recordStart: 0, recordEnd: 5, recordCount: 5, byteLength: 60}
  ]);
  void 0;
});

it('planGeneratedBufferBatches emits multiple contiguous row batches', () => {
  const device = makeLimitedDevice(64);
  const batches = planGeneratedBufferBatches({
    device,
    recordOffsets: [0, 3, 5, 6],
    recordByteStride: 12
  });

  expect(batches, 'batch boundaries are chosen between source rows').toEqual([
    {rowStart: 0, rowEnd: 2, recordStart: 0, recordEnd: 5, recordCount: 5, byteLength: 60},
    {rowStart: 2, rowEnd: 3, recordStart: 5, recordEnd: 6, recordCount: 1, byteLength: 12}
  ]);
  void 0;
});

it('planGeneratedBufferBatches honors stricter generated-buffer byte ceilings', () => {
  const device = makeLimitedDevice(256);
  const byteLimit = getGeneratedBufferBatchByteLimit(device, 12, 48);
  const batches = planGeneratedBufferBatches({
    device,
    recordOffsets: [0, 3, 4],
    recordByteStride: 12,
    maxBatchByteLength: 48
  });

  expect(byteLimit, 'the stricter byte ceiling gets headroom and stride alignment').toBe(36);
  expect(batches, 'batching follows the stricter generated-output cap').toEqual([
    {rowStart: 0, rowEnd: 1, recordStart: 0, recordEnd: 3, recordCount: 3, byteLength: 36},
    {rowStart: 1, rowEnd: 2, recordStart: 3, recordEnd: 4, recordCount: 1, byteLength: 12}
  ]);
  void 0;
});

it('planGeneratedBufferBatches rejects one oversize source row', () => {
  const device = makeLimitedDevice(64);

  expect(
    () =>
      planGeneratedBufferBatches({
        device,
        recordOffsets: [0, 6],
        recordByteStride: 12,
        resourceLabel: 'oversize glyph data'
      }),
    'one unsplittable row reports a clear buffer-limit error'
  ).toThrow(/oversize glyph data row 0 requires 72 bytes/);
  void 0;
});

function makeLimitedDevice(maxBufferSize: number): NullDevice {
  const device = new NullDevice({});
  Object.defineProperty(device.limits, 'maxBufferSize', {value: maxBufferSize});
  return device;
}
