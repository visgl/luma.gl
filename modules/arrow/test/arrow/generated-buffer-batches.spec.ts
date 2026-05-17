// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {NullDevice} from '@luma.gl/test-utils';
import {getGeneratedBufferBatchByteLimit, planGeneratedBufferBatches} from '../../src/index';

test('planGeneratedBufferBatches splits row-preserving generated buffers', t => {
  const device = makeLimitedDevice(64);
  const byteLimit = getGeneratedBufferBatchByteLimit(device, 12);
  const batches = planGeneratedBufferBatches({
    device,
    recordOffsets: [0, 2, 2, 4, 5],
    recordByteStride: 12,
    resourceLabel: 'test generated buffer'
  });

  t.equal(byteLimit, 60, '95% headroom aligns down to the record stride');
  t.deepEqual(
    batches,
    [{rowStart: 0, rowEnd: 4, recordStart: 0, recordEnd: 5, recordCount: 5, byteLength: 60}],
    'exact-fit rows and zero-output rows stay in one batch'
  );
  t.end();
});

test('planGeneratedBufferBatches emits multiple contiguous row batches', t => {
  const device = makeLimitedDevice(64);
  const batches = planGeneratedBufferBatches({
    device,
    recordOffsets: [0, 3, 5, 6],
    recordByteStride: 12
  });

  t.deepEqual(
    batches,
    [
      {rowStart: 0, rowEnd: 2, recordStart: 0, recordEnd: 5, recordCount: 5, byteLength: 60},
      {rowStart: 2, rowEnd: 3, recordStart: 5, recordEnd: 6, recordCount: 1, byteLength: 12}
    ],
    'batch boundaries are chosen between source rows'
  );
  t.end();
});

test('planGeneratedBufferBatches honors stricter generated-buffer byte ceilings', t => {
  const device = makeLimitedDevice(256);
  const byteLimit = getGeneratedBufferBatchByteLimit(device, 12, 48);
  const batches = planGeneratedBufferBatches({
    device,
    recordOffsets: [0, 3, 4],
    recordByteStride: 12,
    maxBatchByteLength: 48
  });

  t.equal(byteLimit, 36, 'the stricter byte ceiling gets headroom and stride alignment');
  t.deepEqual(
    batches,
    [
      {rowStart: 0, rowEnd: 1, recordStart: 0, recordEnd: 3, recordCount: 3, byteLength: 36},
      {rowStart: 1, rowEnd: 2, recordStart: 3, recordEnd: 4, recordCount: 1, byteLength: 12}
    ],
    'batching follows the stricter generated-output cap'
  );
  t.end();
});

test('planGeneratedBufferBatches rejects one oversize source row', t => {
  const device = makeLimitedDevice(64);

  t.throws(
    () =>
      planGeneratedBufferBatches({
        device,
        recordOffsets: [0, 6],
        recordByteStride: 12,
        resourceLabel: 'oversize glyph data'
      }),
    /oversize glyph data row 0 requires 72 bytes/,
    'one unsplittable row reports a clear buffer-limit error'
  );
  t.end();
});

function makeLimitedDevice(maxBufferSize: number): NullDevice {
  const device = new NullDevice({});
  Object.defineProperty(device.limits, 'maxBufferSize', {value: maxBufferSize});
  return device;
}
