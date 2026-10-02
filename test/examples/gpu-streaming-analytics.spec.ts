// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import type {GPUIncrementalBatch} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  StreamingAnalytics,
  type StreamingAnalyticsBatch
} from '../../examples/experimental/gpu-data-analysis/src/streaming-analytics';
import {expect, test} from 'vitest';

type TestBatch = GPUIncrementalBatch<StreamingAnalyticsBatch> & {
  values: number[];
  rows: number[];
  groups: number[];
};

function createBatch(device: Device, id: string, values: number[], firstRow: number): TestBatch {
  const column = (numbers: number[], split: number) => ({
    format: 'uint32' as const,
    length: numbers.length,
    data: [numbers.slice(0, split), [], numbers.slice(split)].map(
      chunk =>
        new GPUData({
          buffer: device.createBuffer({
            data: Uint32Array.from(chunk.length ? chunk : [0]),
            usage: Buffer.STORAGE | Buffer.COPY_DST
          }),
          format: 'uint32' as const,
          length: chunk.length,
          ownsBuffer: true
        })
    )
  });
  const rows = values.map((_, index) => firstRow + index);
  const groups = values.map((_, index) => (firstRow + index) % 4);
  return {
    id,
    revision: 0,
    values,
    rows,
    groups,
    data: {values: column(values, 2), groups: column(groups, 1), rowIds: column(rows, 3)}
  };
}

async function read(data: GPUData<'uint32'>): Promise<number[]> {
  const bytes = await data.buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, data.length));
}

async function check(analytics: StreamingAnalytics, batches: TestBatch[], maximum = 100) {
  const values = batches.flatMap(batch => batch.values);
  const groups = batches.flatMap(batch => batch.groups);
  const rows = batches.flatMap(batch => batch.rows);
  const histogram = Array(10).fill(0);
  const counts = Array(4).fill(0);
  values.forEach(value => {
    if (value <= maximum) histogram[Math.min(9, Math.floor((value / maximum) * 10))]++;
  });
  groups.forEach(group => {
    counts[group]++;
  });
  const top = values
    .map((value, index) => ({value, row: rows[index]}))
    .sort((left, right) => right.value - left.value)
    .slice(0, analytics.limit);
  expect(await read(analytics.outputs.sum)).toEqual([
    values.reduce((sum, value) => sum + value, 0) >>> 0
  ]);
  expect(await read(analytics.outputs.histogram)).toEqual(histogram);
  expect(await read(analytics.outputs.groups)).toEqual(counts);
  expect(await read(analytics.outputs.topValues)).toEqual([
    ...top.map(row => row.value),
    ...Array(analytics.limit - top.length).fill(0)
  ]);
  expect(await read(analytics.outputs.topRows)).toEqual([
    ...top.map(row => row.row),
    ...Array(analytics.limit - top.length).fill(0)
  ]);
  expect(analytics.topCount).toBe(top.length);
}

test('live incremental analytics matches a fresh CPU result through append, replace, remove, reorder, revision and empty snapshots', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const analytics = new StreamingAnalytics(device, 3);
  const first = createBatch(device, 'a', [9, 80, 80, 2], 100);
  const second = createBatch(device, 'b', [80, 4, 100, 31, 20], 200);
  const replacement = createBatch(device, 'a', [12, 7], 300);
  const empty = createBatch(device, 'empty', [], 400);
  const all = [first, second, replacement, empty];
  const sourceBuffer = first.data.values.data[0].buffer;
  try {
    analytics.update([]);
    await check(analytics, []);
    analytics.update([first]);
    await check(analytics, [first]);
    const append = analytics.update([first, second, empty]);
    expect(append.computedBatchIds).toEqual(['b', 'empty']);
    expect(append.reusedBatchIds).toEqual(['a']);
    expect(first.data.values.data[0].buffer).toBe(sourceBuffer);
    await check(analytics, [first, second, empty]);
    expect(analytics.update([first, second, empty])).toMatchObject({
      submitted: false,
      batchNodeCount: 0,
      mergeNodeCount: 0
    });
    expect(analytics.update([second, first, empty])).toMatchObject({
      batchNodeCount: 0,
      computedBatchIds: []
    });
    await check(analytics, [second, first, empty]);
    expect(analytics.update([replacement, second])).toMatchObject({
      computedBatchIds: ['a'],
      removedBatchIds: ['empty'],
      reusedBatchIds: ['b']
    });
    await check(analytics, [replacement, second]);
    replacement.data.values.data[0].buffer.write(Uint32Array.from([99, 1]));
    replacement.values = [99, 1];
    const changed = {...replacement, revision: 1};
    expect(analytics.update([changed, second]).computedBatchIds).toEqual(['a']);
    await check(analytics, [changed, second]);
    analytics.setDomain([0, 50]);
    expect(analytics.update([changed, second])).toMatchObject({
      computedBatchIds: ['a', 'b'],
      invalidation: 'revision'
    });
    await check(analytics, [changed, second], 50);
    expect(analytics.update([second])).toMatchObject({
      batchNodeCount: 0,
      computedBatchIds: [],
      removedBatchIds: ['a']
    });
    await check(analytics, [second], 50);
    expect(analytics.update([])).toMatchObject({batchNodeCount: 0, cachedByteLength: 0});
    await check(analytics, [], 50);
    expect(sourceBuffer.destroyed).toBe(false);
  } finally {
    analytics.destroy();
    all.forEach(batch =>
      Object.values(batch.data).forEach(vector => vector.data.forEach(data => data.destroy()))
    );
  }
});
