// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Buffer} from '@luma.gl/core';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, it, vi} from 'vitest';

it('GPUTable.detachBatches gives every view of a shared buffer its own reference', () => {
  const device = new NullDevice({});
  const {table, buffer} = makeSharedPositionsTable(device, [2, 3, 4]);
  const destroy = vi.spyOn(buffer, 'destroy');

  const detachedBatches = table.detachBatches({last: 1});
  expect(
    [...detachedBatches, ...table.batches].map(batch => batch.gpuData.positions.ownsBuffer),
    'every view of the shared buffer owns a reference'
  ).toEqual([true, true, true]);

  for (const batch of detachedBatches) {
    batch.destroy();
  }
  expect(buffer.destroyed, 'destroying the detached group keeps the shared buffer').toBe(false);
  table.destroy();
  expect(destroy, 'the last view releases the shared buffer exactly once').toHaveBeenCalledTimes(1);
});

it('GPUTable.detachBatches lets single batches of either group be destroyed first', () => {
  const device = new NullDevice({});
  const {table, buffer} = makeSharedPositionsTable(device, [2, 3, 4, 5]);
  const destroy = vi.spyOn(buffer, 'destroy');

  // The former sole owner is retained; the detached group only borrowed the buffer before.
  const [detachedSecond, detachedThird] = table.detachBatches({first: 1, last: 3});
  const [retainedFirst, retainedLast] = table.batches;

  retainedFirst.destroy();
  detachedSecond.destroy();
  expect(buffer.destroyed, 'siblings keep the buffer after single-batch destruction').toBe(false);
  retainedLast.destroy();
  expect(buffer.destroyed, 'the remaining detached batch still keeps the buffer').toBe(false);
  detachedThird.destroy();
  detachedThird.destroy();
  expect(destroy, 'the last view releases the buffer exactly once').toHaveBeenCalledTimes(1);
});

it.each([
  0, 1
])('GPUTable detached batch %i survives repeated detach and table destruction', first => {
  const device = new NullDevice({});
  const {table, buffer} = makeSharedPositionsTable(device, [2, 3, 4]);
  const [firstDetached] = table.detachBatches({first, last: first + 1});
  const [secondDetached] = table.detachBatches({last: 1});
  table.destroy();
  expect(buffer.destroyed).toBe(false);
  firstDetached.destroy();
  firstDetached.destroy();
  expect(buffer.destroyed).toBe(false);
  secondDetached.destroy();
  expect(buffer.destroyed).toBe(true);
});

it('GPUTable.detachBatches leaves ownership alone when no buffer spans both groups', () => {
  const device = new NullDevice({});
  const {table, buffer} = makeSharedPositionsTable(device, [2, 3]);

  const detachedBatches = table.detachBatches();
  expect(
    detachedBatches.map(batch => batch.gpuData.positions.ownsBuffer),
    'an unsplit owner and borrower keep their roles'
  ).toEqual([true, false]);
  for (const batch of detachedBatches) {
    batch.destroy();
  }
  expect(buffer.destroyed, 'the owner releases an unshared buffer').toBe(true);
});

it('GPUTable.detachBatches leaves externally borrowed buffers caller-owned', () => {
  const device = new NullDevice({});
  const {table, buffer} = makeSharedPositionsTable(device, [2, 3], {ownsBuffer: false});

  const detachedBatches = table.detachBatches({last: 1});
  expect(
    [...detachedBatches, ...table.batches].map(batch => batch.gpuData.positions.ownsBuffer)
  ).toEqual([false, false]);
  for (const batch of detachedBatches) {
    batch.destroy();
  }
  table.destroy();
  expect(buffer.destroyed, 'borrowed buffers are never destroyed by table views').toBe(false);
  buffer.destroy();
});

it('GPUTable.packBatches keeps shared buffers alive for batches left unpacked', () => {
  const device = new NullDevice({});
  const {table, buffer} = makeSharedPositionsTable(device, [1, 1, 3]);

  // Groups [1, 1] into one packed batch and leaves the 3-row batch as is.
  table.packBatches({minBatchSize: 2});
  expect(table.batches.map(batch => batch.numRows)).toEqual([2, 3]);
  expect(buffer.destroyed, 'destroying superseded owners keeps the shared buffer').toBe(false);
  expect(
    table.batches[1].gpuData.positions.ownsBuffer,
    'the unpacked view owns its own reference'
  ).toBe(true);
  table.destroy();
  expect(buffer.destroyed, 'the unpacked view releases the shared buffer').toBe(true);
});

/** Slices one buffer into per-batch views owned by the first view, like packed uploads. */
function makeSharedPositionsTable(
  device: NullDevice,
  rowCounts: number[],
  {ownsBuffer = true}: {ownsBuffer?: boolean} = {}
): {table: GPUTable; buffer: Buffer} {
  const rowCount = rowCounts.reduce((total, count) => total + count, 0);
  const buffer = device.createBuffer({data: new Float32Array(rowCount * 2)});
  const rowByteLength = Float32Array.BYTES_PER_ELEMENT * 2;
  let rowOffset = 0;
  const batches = rowCounts.map((batchRowCount, batchIndex) => {
    const batch = new GPURecordBatch({
      gpuData: {
        positions: new GPUData({
          buffer,
          format: 'float32x2',
          length: batchRowCount,
          stride: 2,
          byteOffset: rowOffset * rowByteLength,
          byteStride: rowByteLength,
          ownsBuffer: ownsBuffer && batchIndex === 0
        })
      }
    });
    rowOffset += batchRowCount;
    return batch;
  });
  return {table: new GPUTable({batches}), buffer};
}
