// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {
  convertArrowColumnsToGPUVectors,
  convertArrowRecordBatchesToGPUColumns
} from '@luma.gl/graph/arrow';
import * as arrow from 'apache-arrow';

test('Arrow column streams record input indexes and cumulative row offsets', async () => {
  const device = new NullDevice({});
  try {
    const first = arrow.vectorFromArray([1, 2], new arrow.Float32());
    const second = arrow.vectorFromArray([3], new arrow.Float32());
    const columnOffsets: number[][] = [];
    for await (const chunk of convertArrowColumnsToGPUVectors(device, [first, second])) {
      columnOffsets.push([chunk.sourceBatchIndex, chunk.sourceRowIndexOffset, chunk.vector.length]);
      chunk.destroy();
    }
    expect(columnOffsets).toEqual([
      [0, 0, 2],
      [1, 2, 1]
    ]);

    const source = [first, second].map(value => new arrow.Table({value}).batches[0]);
    const batchOffsets: number[][] = [];
    for await (const batch of convertArrowRecordBatchesToGPUColumns(device, source, [
      {name: 'renamed', source: 'value'}
    ])) {
      batchOffsets.push([batch.sourceBatchIndex, batch.sourceRowIndexOffset, batch.length]);
      expect(batch.columns.renamed.vector.length).toBe(batch.length);
      batch.destroy();
      batch.destroy();
    }
    expect(batchOffsets).toEqual(columnOffsets);
  } finally {
    device.destroy();
  }
});

test.each([
  {
    first: arrow.vectorFromArray([1], new arrow.Float32()),
    second: arrow.vectorFromArray(
      [[1, 2]],
      new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float32()))
    ),
    error: /"height" value format changed: float32 -> float32x2/
  },
  {
    first: arrow.vectorFromArray([1], new arrow.Float32()),
    second: arrow.vectorFromArray([2], new arrow.Float64()),
    error: /"height" residual format changed: missing -> float32/
  }
])('Arrow column stream rejects a format or companion change and releases its outputs', async ({
  first,
  second,
  error
}) => {
  const device = new NullDevice({});
  const createBuffer = vi.spyOn(device, 'createBuffer');
  try {
    const stream = convertArrowColumnsToGPUVectors(device, [first, second], {name: 'height'});
    const firstResult = (await stream.next()).value;
    await expect(stream.next()).rejects.toThrow(error);
    expect(createBuffer.mock.results[0].value.destroyed).toBe(false);
    expect(createBuffer.mock.results.slice(1).length).toBeGreaterThan(0);
    for (const buffer of createBuffer.mock.results.slice(1))
      expect(buffer.value.destroyed).toBe(true);
    firstResult.destroy();
  } finally {
    device.destroy();
  }
});

test('Arrow record-batch column conversion rejects inconsistent column length', async () => {
  const device = new NullDevice({});
  try {
    const batch = arrow.tableFromArrays({value: new Float32Array([1])}).batches[0];
    vi.spyOn(batch, 'numRows', 'get').mockReturnValue(2);
    const stream = convertArrowRecordBatchesToGPUColumns(device, [batch], [{name: 'value'}]);
    await expect(stream.next()).rejects.toThrow('rows do not match the batch');
  } finally {
    device.destroy();
  }
});

test('Arrow column stream abort interrupts a stalled next and requests cleanup', async () => {
  const device = new NullDevice({});
  try {
    const controller = new AbortController();
    const {promise: reading, resolve: markReading} = Promise.withResolvers<void>();
    const finish = vi.fn(() => new Promise<IteratorResult<arrow.Vector>>(() => {}));
    const source: AsyncIterator<arrow.Vector> = {
      next: () => {
        markReading();
        return new Promise<IteratorResult<arrow.Vector>>(() => {});
      },
      return: finish
    };
    const stream = convertArrowColumnsToGPUVectors(device, source, {}, {signal: controller.signal});
    const pending = stream.next();
    await reading;
    const reason = new Error('stop column stream');
    controller.abort(reason);
    await expect(pending).rejects.toBe(reason);
    expect(finish).toHaveBeenCalledOnce();
  } finally {
    device.destroy();
  }
});

test('Arrow batch column stream releases earlier outputs if a later column fails', async () => {
  const device = new NullDevice({});
  const createBuffer = vi.spyOn(device, 'createBuffer');
  try {
    const batch = arrow.tableFromArrays({value: new Float64Array([1])}).batches[0];
    const stream = convertArrowRecordBatchesToGPUColumns(
      device,
      [batch],
      [{name: 'value', preserveNulls: true}, {name: 'missing'}]
    );
    await expect(stream.next()).rejects.toThrow(/missing/);
    expect(createBuffer.mock.results).toHaveLength(3);
    for (const buffer of createBuffer.mock.results) expect(buffer.value.destroyed).toBe(true);
  } finally {
    device.destroy();
  }
});
