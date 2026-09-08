// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUDataFrame} from '@luma.gl/experimental/gpu-dataframe';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';
import {vi} from 'vitest';

type GPUDataFrameFixture = {
  table: GPUTable;
  buffers: Buffer[];
};

it('GPUDataFrame preserves GPU source batches through borrowed projections', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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

    expect(frame.table, 'the source table remains borrowed directly').toBe(fixture.table);
    expect(frame.numRows, 'source rows remain available without GPU readback').toBe(5);
    expect(frame.numCols, 'the complete source schema remains visible').toBe(3);
    expect(frame.columnNames, 'source columns retain their original order').toEqual([
      'longitude',
      'category',
      'fare'
    ]);
    expect(
      frame.column('longitude'),
      'source-column inspection reuses the existing aggregate vector'
    ).toBe(fixture.table.gpuVectors.longitude);
    expect(frame.sourceInfo, 'the dataframe publishes stable source-batch row identities').toEqual(
      sourceBatchInfo
    );

    expect(geographicProjection.table, 'projection creates a separate logical table view').not.toBe(
      fixture.table
    );
    expect(geographicProjection.ownership, 'projections borrow source data').toBe('borrowed');
    expect(
      geographicProjection.schema.fields.map(field => field.name),
      'projection retains the requested schema and column order'
    ).toEqual(['longitude', 'fare']);
    expect(
      categoricalProjection.columnNames,
      'sibling projections retain independent selected columns'
    ).toEqual(['category']);
    expect(
      nestedProjection.columnNames,
      'nested projections refine their parent without changing its schema'
    ).toEqual(['longitude']);
    expect(
      fixture.table.schema.fields.map(field => field.name),
      'projection never invokes destructive GPUTable.select on the source'
    ).toEqual(['longitude', 'category', 'fare']);

    for (const projection of projections) {
      expect(projection.numRows, 'every view retains the full logical row count').toBe(5);
      expect(
        projection.batches.map(batch => batch.numRows),
        'uneven and empty source batches are preserved'
      ).toEqual([2, 0, 3]);
      expect(
        projection.batches.map(batch => batch.sourceInfo),
        'projection preserves every batch source index and row offset'
      ).toEqual(sourceBatchInfo);
      expect(
        projection.sourceInfo,
        'stable row identity remains available on projected views'
      ).toEqual(sourceBatchInfo);
    }

    for (const [batchIndex, projectedBatch] of geographicProjection.batches.entries()) {
      const sourceBatch = fixture.table.batches[batchIndex];
      expect(projectedBatch, 'projected batches are logical borrowed views').not.toBe(sourceBatch);
      expect(
        Object.keys(projectedBatch.gpuData),
        'projected batches contain only their selected columns'
      ).toEqual(['longitude', 'fare']);
      for (const columnName of ['longitude', 'fare'] as const) {
        expect(
          projectedBatch.gpuData[columnName].buffer,
          'projected chunks retain their exact source GPU allocation'
        ).toBe(sourceBatch.gpuData[columnName].buffer);
        expect(
          Boolean(projectedBatch.gpuData[columnName].ownsBuffer),
          'projected GPUData never claims ownership of borrowed storage'
        ).toBe(false);
      }
    }

    expect(emptyProjection.numCols, 'zero-column projection has an empty schema').toBe(0);
    expect(
      emptyProjection.batches.map(batch => Object.keys(batch.gpuData)),
      'zero-column projection retains every source partition without data aliases'
    ).toEqual([[], [], []]);

    frame.destroy();
    expect(
      Boolean(fixture.buffers.some(buffer => buffer.destroyed)),
      'destroying a borrowed source frame leaves every caller-owned buffer intact'
    ).toBe(false);
    expect(
      geographicProjection.table.gpuVectors.longitude.data[0].buffer,
      'a sibling view remains usable after its borrowed parent is destroyed'
    ).toBe(fixture.table.gpuVectors.longitude.data[0].buffer);

    geographicProjection.destroy();
    categoricalProjection.destroy();
    emptyProjection.destroy();
    expect(
      nestedProjection.table.gpuVectors.longitude.data.length,
      'a nested view outlives its immediate parent and retains all source chunks'
    ).toBe(3);
    nestedProjection.destroy();
    frame.destroy();

    expect(
      Boolean(fixture.buffers.some(buffer => buffer.destroyed)),
      'destroying borrowed projections never releases caller-owned source buffers'
    ).toBe(false);
    expect(
      createBufferSpy.mock.calls.length,
      'dataframe construction and projections never allocate GPU buffers'
    ).toBe(0);
    expect(
      createCommandEncoderSpy.mock.calls.length,
      'query planning never creates or encodes GPU commands'
    ).toBe(0);
    expect(submitSpy.mock.calls.length, 'query planning never submits GPU work').toBe(0);
  } finally {
    for (const projection of projections) projection.destroy();
    frame?.destroy();
    createBufferSpy.mockRestore();
    createCommandEncoderSpy.mockRestore();
    submitSpy.mockRestore();
    fixture.table.destroy();
  }

  void 0;
});

it('GPUDataFrame defers owned GPU destruction until its last borrowed view', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const fixture = createGPUDataFrameFixture(device);
  const destroyTableSpy = vi.spyOn(fixture.table, 'destroy');
  const frame = new GPUDataFrame({table: fixture.table, ownership: 'owned'});
  const geographicProjection = frame.select(['longitude']);
  const categoricalProjection = frame.select(['category']);

  try {
    frame.destroy();
    expect(
      destroyTableSpy.mock.calls.length,
      'destroying the owner defers source destruction while projections remain'
    ).toBe(0);
    expect(
      Boolean(fixture.buffers.some(buffer => buffer.destroyed)),
      'source GPU allocations remain alive for both borrowed views'
    ).toBe(false);
    expect(
      geographicProjection.table.gpuVectors.longitude.data[2].length,
      'a borrowed view remains usable after its owning parent is destroyed'
    ).toBe(3);

    geographicProjection.destroy();
    expect(
      destroyTableSpy.mock.calls.length,
      'the remaining sibling keeps the shared source lease alive'
    ).toBe(0);
    expect(
      Boolean(fixture.buffers.some(buffer => buffer.destroyed)),
      'destroying one sibling never invalidates another borrowed projection'
    ).toBe(false);

    categoricalProjection.destroy();
    expect(
      destroyTableSpy.mock.calls.length,
      'the final borrowed view releases the owned source table exactly once'
    ).toBe(1);
    expect(
      Boolean(fixture.buffers.every(buffer => buffer.destroyed)),
      'owned source chunks release every underlying WebGPU buffer'
    ).toBe(true);

    frame.destroy();
    geographicProjection.destroy();
    categoricalProjection.destroy();
    expect(
      destroyTableSpy.mock.calls.length,
      'repeated destruction never releases an owned source twice'
    ).toBe(1);
  } finally {
    frame.destroy();
    geographicProjection.destroy();
    categoricalProjection.destroy();
    destroyTableSpy.mockRestore();
    fixture.table.destroy();
  }

  void 0;
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
