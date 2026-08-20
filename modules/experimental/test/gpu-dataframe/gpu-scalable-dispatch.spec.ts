// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUDataFrame,
  column,
  literal,
  type GPUDataFrameQueryParameters
} from '@luma.gl/experimental/gpu-dataframe';
import {GPUData, type GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, test, vi} from 'vitest';

type ScalableSource = {value: 'float32'; category: 'uint32'};

test('GPUDataFrame filters, reduces, groups, bins, sorts, and joins across bounded 3D dispatches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const originalLimits = device.limits;
  Object.defineProperty(device, 'limits', {
    configurable: true,
    value: new Proxy(originalLimits, {
      get(target, property) {
        return property === 'maxComputeWorkgroupsPerDimension'
          ? 2
          : Reflect.get(target, property, target);
      }
    })
  });
  const dispatch = vi.spyOn(Computation.prototype, 'dispatch');
  const left = createScalableFrame(device, 1_025, 100);
  const right = createScalableFrame(device, 3, 500, Uint32Array.from([0, 512, 1_024]));
  const ownedQueries: {destroy(): void}[] = [];

  try {
    const filter = left
      .withColumn('adjusted', column('value').add(literal(1)), {format: 'float32'})
      .filter(column('adjusted').greaterThan(literal(0)))
      .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {id: 'bounded-filter'}));
    ownedQueries.push(filter);
    const reduction = left
      .aggregate({count: 'count', total: {sum: 'value'}, maximum: {max: 'value'}})
      .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {id: 'bounded-reduction'}));
    ownedQueries.push(reduction);
    const groups = left
      .groupBy('category', {groupCount: 1_025})
      .aggregate({count: 'count', mean: {mean: 'value'}})
      .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {id: 'bounded-groups'}));
    ownedQueries.push(groups);
    const histogram = left
      .histogram('value', {bins: 1_025, domain: [0, 1_025]})
      .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {id: 'bounded-histogram'}));
    ownedQueries.push(histogram);
    const sorting = left
      .topK('value', 3)
      .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {id: 'bounded-sorting'}));
    ownedQueries.push(sorting);
    const join = left
      .innerJoin(right, {leftOn: 'category', rightOn: 'category', capacity: 3})
      .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {id: 'bounded-join'}));
    ownedQueries.push(join);

    const encoder = device.createCommandEncoder({id: 'bounded-dataframe-workloads'});
    for (const compiled of [filter, reduction, groups, histogram, sorting, join]) {
      compiled.encode(encoder);
    }
    device.submit(encoder.finish());

    expect(await readUnsigned(filter.selectedCounts)).toEqual([1_025]);
    expect(await readUnsigned(reduction.table.gpuVectors.count)).toEqual([1_025]);
    expect(await readFloating(reduction.table.gpuVectors.total)).toEqual([524_800]);
    expect(await readFloating(reduction.table.gpuVectors.maximum)).toEqual([1_024]);

    const groupedCounts = await readUnsigned(groups.table.gpuVectors.count);
    expect(groupedCounts).toHaveLength(1_025);
    expect(groupedCounts.every(count => count === 1)).toBe(true);
    expect(await readUnsigned(groups.table.gpuVectors.category, 5)).toEqual([0, 1, 2, 3, 4]);

    const histogramCounts = await readUnsigned(histogram.table.gpuVectors.count);
    expect(histogramCounts).toHaveLength(1_025);
    expect(histogramCounts.every(count => count === 1)).toBe(true);
    expect(await readUnsigned(histogram.table.gpuVectors.bin, 5)).toEqual([0, 1, 2, 3, 4]);

    expect(await readUnsigned(sorting.selectedCounts)).toEqual([3]);
    expect(await readUnsigned(sorting.rowIndices, 3)).toEqual([1_124, 1_123, 1_122]);
    expect(await readUnsigned(join.selectedCounts)).toEqual([3]);
    expect(await readUnsigned(join.rowIndices, 3)).toEqual([100, 612, 1_124]);
    expect(await readUnsigned(join.rightRowIndices, 3)).toEqual([500, 501, 502]);

    const boundedPasses = dispatch.mock.calls.filter(
      ([, horizontal, vertical, depth]) => horizontal === 2 && vertical === 2 && depth === 2
    );
    expect(boundedPasses.length).toBeGreaterThan(10);
  } finally {
    for (const query of ownedQueries) {
      query.destroy();
    }
    left.destroy();
    right.destroy();
    dispatch.mockRestore();
    Object.defineProperty(device, 'limits', {configurable: true, value: originalLimits});
  }
}, 60_000);

function createScalableFrame(
  device: Device,
  rowCount: number,
  sourceRowIndexOffset: number,
  keys = Uint32Array.from({length: rowCount}, (_, index) => index)
): GPUDataFrame<ScalableSource> {
  const values = Float32Array.from(keys);
  const batch = new GPURecordBatch<ScalableSource>({
    gpuData: {
      value: createScalableData(device, values, 'float32'),
      category: createScalableData(device, keys, 'uint32')
    },
    fields: [
      {name: 'value', format: 'float32', nullable: false},
      {name: 'category', format: 'uint32', nullable: false}
    ],
    sourceInfo: {sourceBatchIndex: 0, sourceRowIndexOffset, sourceRowCount: rowCount}
  });
  return new GPUDataFrame({table: new GPUTable({batches: [batch]}), ownership: 'owned'});
}

function createScalableData<Format extends 'float32' | 'uint32'>(
  device: Device,
  values: Float32Array | Uint32Array,
  format: Format
): GPUData<Format> {
  const buffer = device.createBuffer({
    data: values,
    usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  return new GPUData({buffer, format, length: values.length, ownsBuffer: true});
}

async function readUnsigned(
  vector: GPUVector<'uint32'>,
  length = vector.length
): Promise<number[]> {
  const data = vector.data[0];
  const buffer = data.buffer instanceof Buffer ? data.buffer : data.buffer.buffer;
  const bytes = await buffer.readAsync(0, length * Uint32Array.BYTES_PER_ELEMENT);
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

async function readFloating(
  vector: GPUVector<'float32'>,
  length = vector.length
): Promise<number[]> {
  const data = vector.data[0];
  const buffer = data.buffer instanceof Buffer ? data.buffer : data.buffer.buffer;
  const bytes = await buffer.readAsync(0, length * Float32Array.BYTES_PER_ELEMENT);
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}
