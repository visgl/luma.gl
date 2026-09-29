// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeGPUAnalyticsTableFromArrowTable} from '@luma.gl/arrow';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {type GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {
  GPUDataFrame,
  column,
  literal,
  type GPUDataFrameQueryParameters
} from '@luma.gl/experimental/gpu-dataframe';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import {expect, it} from 'vitest';
import {vi} from 'vitest';

it('Arrow analytics ingestion preserves WebGPU batches, sliced validity, and dictionaries', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const source = createBrowserAnalyticsTable();
  const submit = vi.spyOn(device, 'submit');
  const createCommandEncoder = vi.spyOn(device, 'createCommandEncoder');
  const result = makeGPUAnalyticsTableFromArrowTable(device, source);

  try {
    expect(
      result.table.batches.map(batch => batch.numRows),
      'preserves uneven and empty Arrow record batches'
    ).toEqual([2, 0, 3]);
    expect(
      result.table.batches.map(batch => batch.sourceInfo),
      'retains stable source identities without reading rows'
    ).toEqual([
      {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 2},
      {sourceBatchIndex: 1, sourceRowIndexOffset: 2, sourceRowCount: 0},
      {sourceBatchIndex: 2, sourceRowIndexOffset: 2, sourceRowCount: 3}
    ]);
    expect(
      result.table.schema.fields.map(field => [field.name, field.format]),
      'uploads portable numerical values and dictionary indices'
    ).toEqual([
      ['fare', 'float32'],
      ['category', 'uint32']
    ]);
    expect(
      result.dictionaries['category'],
      'retains dictionary labels exclusively as adapter-owned metadata'
    ).toEqual({values: ['economy', 'premium'], ordered: true});
    expect(result.nullCounts, 'retains accurate per-column and per-batch null counts').toEqual({
      fare: [1, 0, 1],
      category: [0, 0, 0]
    });

    for (const [batchIndex, batch] of result.table.batches.entries()) {
      for (const [columnName, data] of Object.entries(batch.gpuData)) {
        expect(
          Boolean(data.buffer.usage & Buffer.STORAGE),
          'source chunks support GPU analytics'
        ).toBe(true);
        expect(Boolean(data.ownsBuffer), 'source chunks retain explicit GPU ownership').toBe(true);
        expect(
          result.validity[columnName]?.data[batchIndex].buffer,
          'validity occupies a separate GPU-backed sidecar'
        ).not.toBe(data.buffer);
        if (batch.numRows === 0) {
          expect(
            Boolean(data.buffer.byteLength >= 4),
            'empty source batches retain bindable nonzero physical allocations'
          ).toBe(true);
          expect(
            Boolean((result.validity[columnName]?.data[batchIndex].buffer.byteLength ?? 0) >= 4),
            'empty validity chunks retain bindable nonzero physical allocations'
          ).toBe(true);
        }
      }
    }

    expect(submit.mock.calls.length, 'ingestion never submits GPU command work').toBe(0);
    expect(createCommandEncoder.mock.calls.length, 'ingestion never creates command encoders').toBe(
      0
    );

    submit.mockRestore();
    createCommandEncoder.mockRestore();

    expect(
      await readGPUValidity(result.validity['fare']!),
      'normalizes sliced Arrow bitmaps to per-row WebGPU validity masks'
    ).toEqual([[0, 1], [], [0, 1, 1]]);
    expect(
      await readGPUValidity(result.validity['category']!),
      'materializes all-valid nullable dictionary sidecars'
    ).toEqual([[1, 1], [], [1, 1, 1]]);
  } finally {
    submit.mockRestore();
    createCommandEncoder.mockRestore();
    const ownedBuffers = [
      ...result.table.batches.flatMap(batch =>
        Object.values(batch.gpuData).map(data => data.buffer)
      ),
      ...Object.values(result.validity).flatMap(vector => vector!.data.map(data => data.buffer))
    ];
    result.table.destroy();
    for (const validity of Object.values(result.validity)) validity?.destroy();
    expect(
      Boolean(ownedBuffers.every(buffer => buffer.destroyed)),
      'source chunks and independent validity sidecars release exactly their owned allocations'
    ).toBe(true);
  }

  void 0;
});

it('Arrow analytics ingestion packs 2048-row streamed batches into one WebGPU batch', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  // DuckDB-Wasm and other streamed producers emit 2048-row batches; only one batch has nulls.
  const {table: source, values, valid} = createStreamedAnalyticsTable([2048, 2048, 2048, 1000]);
  const expectedSelected = values.filter((value, row) => valid[row] && value > 0.5).length;
  const packed = makeGPUAnalyticsTableFromArrowTable(device, source, {packBatches: true});
  const preserved = makeGPUAnalyticsTableFromArrowTable(device, source);

  try {
    expect(packed.table.batches.map(batch => batch.numRows)).toEqual([7144]);
    expect(packed.table.batches[0].sourceInfo).toEqual({
      sourceBatchIndex: 0,
      sourceRowIndexOffset: 0,
      sourceRowCount: 7144
    });
    expect(packed.validity['value']?.data).toHaveLength(1);

    const packedData = packed.table.gpuVectors['value'].data[0];
    const packedBytes = await packedData.buffer.readAsync(0, packedData.length * 4);
    expect(
      Array.from(new Float32Array(packedBytes.buffer, packedBytes.byteOffset, packedData.length)),
      'every source chunk is written at its row offset'
    ).toEqual(Array.from(values));
    expect(await readGPUValidity(packed.validity['value']!)).toEqual([Array.from(valid)]);

    const packedFilter = await readSelectedCount(device, new GPUDataFrame({...packed}));
    const preservedFilter = await readSelectedCount(device, new GPUDataFrame({...preserved}));
    expect(packedFilter.outputChunks, 'packed filters dispatch one batch').toBe(1);
    expect(preservedFilter.outputChunks, 'preserved filters dispatch per source batch').toBe(4);
    expect(packedFilter.selected).toBe(expectedSelected);
    expect(preservedFilter.selected).toBe(expectedSelected);
  } finally {
    for (const result of [packed, preserved]) {
      result.table.destroy();
      for (const validity of Object.values(result.validity)) validity?.destroy();
    }
  }
});

function createStreamedAnalyticsTable(batchRowCounts: readonly number[]): {
  table: arrow.Table<{value: arrow.Float32}>;
  values: Float32Array;
  valid: Uint32Array;
} {
  const rowCount = batchRowCounts.reduce((total, batchRowCount) => total + batchRowCount, 0);
  const values = new Float32Array(rowCount);
  const valid = new Uint32Array(rowCount).fill(1);
  for (let row = 0; row < rowCount; row++) values[row] = ((row * 7919) % 1000) / 1000;

  const schema = new arrow.Schema<{value: arrow.Float32}>([
    new arrow.Field('value', new arrow.Float32(), true)
  ]);
  let start = 0;
  const batches = batchRowCounts.map((length, batchIndex) => {
    let nullBitmap: Uint8Array | undefined;
    let nullCount = 0;
    if (batchIndex === 1) {
      nullBitmap = new Uint8Array(Math.ceil(length / 8)).fill(0xff);
      for (let row = 0; row < length; row += 3) {
        nullBitmap[row >> 3] &= ~(1 << (row & 7));
        valid[start + row] = 0;
        nullCount++;
      }
    }
    const child = arrow.makeData({
      type: new arrow.Float32(),
      length,
      data: values.subarray(start, start + length),
      nullBitmap,
      nullCount
    });
    start += length;
    return new arrow.RecordBatch(
      schema,
      arrow.makeData({type: new arrow.Struct(schema.fields), length, children: [child]})
    );
  });
  return {table: new arrow.Table(schema, batches), values, valid};
}

async function readSelectedCount(
  device: Device,
  dataFrame: GPUDataFrame<{value: 'float32'}>
): Promise<{selected: number; outputChunks: number}> {
  const compiled = dataFrame.filter(column('value').greaterThan(literal(0.5))).compile(
    new GPUCommandGraph<GPUDataFrameQueryParameters>(device, {
      id: 'arrow-analytics-packed-filter'
    })
  );
  try {
    const commandEncoder = device.createCommandEncoder({id: 'arrow-analytics-packed-filter'});
    compiled.encode(commandEncoder);
    device.submit(commandEncoder.finish());
    let selected = 0;
    for (const data of compiled.selectedCounts.data) {
      const bytes = await data.buffer.readAsync(data.byteOffset, 4);
      selected += new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0];
    }
    return {selected, outputChunks: compiled.selectedCounts.data.length};
  } finally {
    compiled.destroy();
  }
}

function createBrowserAnalyticsTable(): arrow.Table {
  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Uint32(), 12, true);
  const dictionary = arrow.vectorFromArray(['economy', 'premium'], new arrow.Utf8());
  const fields = [
    new arrow.Field('fare', new arrow.Float32(), true),
    new arrow.Field('category', dictionaryType, true)
  ];
  const schema = new arrow.Schema(fields);
  const fares = arrow.vectorFromArray(
    [0, 1, 2, 3, 4, 5, 6, null, 8, null, 10, 11],
    new arrow.Float32()
  );
  const categoryData = arrow.makeData({
    type: dictionaryType,
    length: 12,
    data: new Uint32Array([0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1]),
    dictionary
  });
  const categories = new arrow.Vector([categoryData]);
  const ranges = [
    [7, 9],
    [9, 9],
    [9, 12]
  ] as const;

  const batches = ranges.map(
    ([start, end]) =>
      new arrow.RecordBatch(
        schema,
        arrow.makeData({
          type: new arrow.Struct(schema.fields),
          length: end - start,
          children: [fares.slice(start, end).data[0], categories.slice(start, end).data[0]]
        })
      )
  );

  return new arrow.Table(schema, batches);
}

async function readGPUValidity(vector: GPUVector<'uint32'>): Promise<number[][]> {
  return Promise.all(
    vector.data.map(async data => {
      if (data.length === 0) return [];
      const bytes = await data.buffer.readAsync(data.byteOffset, data.length * data.byteStride);
      return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, data.length));
    })
  );
}
