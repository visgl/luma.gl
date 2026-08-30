// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUDataFrame} from '@luma.gl/experimental/gpu-dataframe';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';

type GPUDataFrameFixture = {
  table: GPUTable;
  buffers: Buffer[];
};

test('GPUDataFrame preserves GPU source batches through borrowed projections', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createGPUDataFrameFixture(device);
  const sourceBatchInfo = fixture.table.batches.map(batch => batch.sourceInfo);
  const createBufferSpy = vi.spyOn(device, 'createBuffer');
  const createCommandEncoderSpy = vi.spyOn(device, 'createCommandEncoder');
  const submitSpy = vi.spyOn(device, 'submit');
  let frame: GPUDataFrame | undefined;
  const projections: GPUDataFrame[] = [];

  try {
    frame = new GPUDataFrame({table: fixture.table, ownership: 'borrowed'});
    const geographicProjection = frame.select(['longitude', 'fare']);
    const categoricalProjection = frame.select(['category']);
    const emptyProjection = frame.select([]);
    const nestedProjection = geographicProjection.select(['longitude']);
    projections.push(
      geographicProjection,
      categoricalProjection,
      emptyProjection,
      nestedProjection
    );

    testContext.equal(frame.table, fixture.table, 'the source table remains borrowed directly');
    testContext.equal(frame.numRows, 5, 'source rows remain available without GPU readback');
    testContext.equal(frame.numCols, 3, 'the complete source schema remains visible');
    testContext.deepEqual(
      frame.columnNames,
      ['longitude', 'category', 'fare'],
      'source columns retain their original order'
    );
    testContext.equal(
      frame.column('longitude'),
      fixture.table.gpuVectors.longitude,
      'source-column inspection reuses the existing aggregate vector'
    );
    testContext.deepEqual(
      frame.sourceInfo,
      sourceBatchInfo,
      'the dataframe publishes stable source-batch row identities'
    );

    testContext.notEqual(
      geographicProjection.table,
      fixture.table,
      'projection creates a separate logical table view'
    );
    testContext.equal(geographicProjection.ownership, 'borrowed', 'projections borrow source data');
    testContext.deepEqual(
      geographicProjection.schema.fields.map(field => field.name),
      ['longitude', 'fare'],
      'projection retains the requested schema and column order'
    );
    testContext.deepEqual(
      categoricalProjection.columnNames,
      ['category'],
      'sibling projections retain independent selected columns'
    );
    testContext.deepEqual(
      nestedProjection.columnNames,
      ['longitude'],
      'nested projections refine their parent without changing its schema'
    );
    testContext.deepEqual(
      fixture.table.schema.fields.map(field => field.name),
      ['longitude', 'category', 'fare'],
      'projection never invokes destructive GPUTable.select on the source'
    );

    for (const projection of projections) {
      testContext.equal(projection.numRows, 5, 'every view retains the full logical row count');
      testContext.deepEqual(
        projection.batches.map(batch => batch.numRows),
        [2, 0, 3],
        'uneven and empty source batches are preserved'
      );
      testContext.deepEqual(
        projection.batches.map(batch => batch.sourceInfo),
        sourceBatchInfo,
        'projection preserves every batch source index and row offset'
      );
      testContext.deepEqual(
        projection.sourceInfo,
        sourceBatchInfo,
        'stable row identity remains available on projected views'
      );
    }

    for (const [batchIndex, projectedBatch] of geographicProjection.batches.entries()) {
      const sourceBatch = fixture.table.batches[batchIndex];
      testContext.notEqual(
        projectedBatch,
        sourceBatch,
        'projected batches are logical borrowed views'
      );
      testContext.deepEqual(
        Object.keys(projectedBatch.gpuData),
        ['longitude', 'fare'],
        'projected batches contain only their selected columns'
      );
      for (const columnName of ['longitude', 'fare'] as const) {
        testContext.equal(
          projectedBatch.gpuData[columnName].buffer,
          sourceBatch.gpuData[columnName].buffer,
          'projected chunks retain their exact source GPU allocation'
        );
        testContext.notOk(
          projectedBatch.gpuData[columnName].ownsBuffer,
          'projected GPUData never claims ownership of borrowed storage'
        );
      }
    }

    testContext.equal(emptyProjection.numCols, 0, 'zero-column projection has an empty schema');
    testContext.deepEqual(
      emptyProjection.batches.map(batch => Object.keys(batch.gpuData)),
      [[], [], []],
      'zero-column projection retains every source partition without data aliases'
    );

    frame.destroy();
    testContext.notOk(
      fixture.buffers.some(buffer => buffer.destroyed),
      'destroying a borrowed source frame leaves every caller-owned buffer intact'
    );
    testContext.equal(
      geographicProjection.table.gpuVectors.longitude.data[0].buffer,
      fixture.table.gpuVectors.longitude.data[0].buffer,
      'a sibling view remains usable after its borrowed parent is destroyed'
    );

    geographicProjection.destroy();
    categoricalProjection.destroy();
    emptyProjection.destroy();
    testContext.equal(
      nestedProjection.table.gpuVectors.longitude.data.length,
      3,
      'a nested view outlives its immediate parent and retains all source chunks'
    );
    nestedProjection.destroy();
    frame.destroy();

    testContext.notOk(
      fixture.buffers.some(buffer => buffer.destroyed),
      'destroying borrowed projections never releases caller-owned source buffers'
    );
    testContext.equal(
      createBufferSpy.mock.calls.length,
      0,
      'dataframe construction and projections never allocate GPU buffers'
    );
    testContext.equal(
      createCommandEncoderSpy.mock.calls.length,
      0,
      'query planning never creates or encodes GPU commands'
    );
    testContext.equal(submitSpy.mock.calls.length, 0, 'query planning never submits GPU work');
  } finally {
    for (const projection of projections) projection.destroy();
    frame?.destroy();
    createBufferSpy.mockRestore();
    createCommandEncoderSpy.mockRestore();
    submitSpy.mockRestore();
    fixture.table.destroy();
  }

  testContext.end();
});

test('GPUDataFrame defers owned GPU destruction until its last borrowed view', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const fixture = createGPUDataFrameFixture(device);
  const destroyTableSpy = vi.spyOn(fixture.table, 'destroy');
  const frame = new GPUDataFrame({table: fixture.table, ownership: 'owned'});
  const geographicProjection = frame.select(['longitude']);
  const categoricalProjection = frame.select(['category']);

  try {
    frame.destroy();
    testContext.equal(
      destroyTableSpy.mock.calls.length,
      0,
      'destroying the owner defers source destruction while projections remain'
    );
    testContext.notOk(
      fixture.buffers.some(buffer => buffer.destroyed),
      'source GPU allocations remain alive for both borrowed views'
    );
    testContext.equal(
      geographicProjection.table.gpuVectors.longitude.data[2].length,
      3,
      'a borrowed view remains usable after its owning parent is destroyed'
    );

    geographicProjection.destroy();
    testContext.equal(
      destroyTableSpy.mock.calls.length,
      0,
      'the remaining sibling keeps the shared source lease alive'
    );
    testContext.notOk(
      fixture.buffers.some(buffer => buffer.destroyed),
      'destroying one sibling never invalidates another borrowed projection'
    );

    categoricalProjection.destroy();
    testContext.equal(
      destroyTableSpy.mock.calls.length,
      1,
      'the final borrowed view releases the owned source table exactly once'
    );
    testContext.ok(
      fixture.buffers.every(buffer => buffer.destroyed),
      'owned source chunks release every underlying WebGPU buffer'
    );

    frame.destroy();
    geographicProjection.destroy();
    categoricalProjection.destroy();
    testContext.equal(
      destroyTableSpy.mock.calls.length,
      1,
      'repeated destruction never releases an owned source twice'
    );
  } finally {
    frame.destroy();
    geographicProjection.destroy();
    categoricalProjection.destroy();
    destroyTableSpy.mockRestore();
    fixture.table.destroy();
  }

  testContext.end();
});

function createGPUDataFrameFixture(device: Device): GPUDataFrameFixture {
  const longitudeValues = [
    Float32Array.from([-73.9, -73.7]),
    new Float32Array(0),
    Float32Array.from([-73.5, -73.3, -73.1])
  ];
  const categoryValues = [
    Uint32Array.from([1, 0]),
    new Uint32Array(0),
    Uint32Array.from([1, 2, 0])
  ];
  const fareValues = [
    Float32Array.from([10, 20]),
    new Float32Array(0),
    Float32Array.from([30, 40, 50])
  ];
  const buffers: Buffer[] = [];
  let sourceRowIndexOffset = 40;

  const batches = longitudeValues.map((longitude, batchIndex) => {
    const category = categoryValues[batchIndex];
    const fare = fareValues[batchIndex];
    const gpuData = {
      longitude: createOwnedGPUData(device, buffers, `longitude-${batchIndex}`, longitude),
      category: createOwnedGPUData(device, buffers, `category-${batchIndex}`, category),
      fare: createOwnedGPUData(device, buffers, `fare-${batchIndex}`, fare)
    };
    const batch = new GPURecordBatch({
      gpuData,
      sourceInfo: {
        sourceBatchIndex: batchIndex + 4,
        sourceRowIndexOffset,
        sourceRowCount: longitude.length
      }
    });
    sourceRowIndexOffset += longitude.length;
    return batch;
  });

  return {table: new GPUTable({batches}), buffers};
}

function createOwnedGPUData(
  device: Device,
  buffers: Buffer[],
  identifier: string,
  values: Float32Array | Uint32Array
): GPUData<'float32' | 'uint32'> {
  const buffer = device.createBuffer({
    id: identifier,
    byteLength: Math.max(values.byteLength, 4),
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST,
    ...(values.byteLength > 0 ? {data: values} : {})
  });
  buffers.push(buffer);

  return new GPUData({
    buffer,
    format: values instanceof Float32Array ? 'float32' : 'uint32',
    length: values.length,
    ownsBuffer: true
  });
}
