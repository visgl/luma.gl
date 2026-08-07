// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeGPUAnalyticsTableFromArrowTable} from '@luma.gl/arrow';
import {Buffer} from '@luma.gl/core';
import {type GPUVector} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import test from 'test/utils/vitest-tape';
import {vi} from 'vitest';

test('Arrow analytics ingestion preserves WebGPU batches, sliced validity, and dictionaries', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const source = createBrowserAnalyticsTable();
  const submit = vi.spyOn(device, 'submit');
  const createCommandEncoder = vi.spyOn(device, 'createCommandEncoder');
  const result = makeGPUAnalyticsTableFromArrowTable(device, source);

  try {
    testContext.deepEqual(
      result.table.batches.map(batch => batch.numRows),
      [2, 0, 3],
      'preserves uneven and empty Arrow record batches'
    );
    testContext.deepEqual(
      result.table.batches.map(batch => batch.sourceInfo),
      [
        {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 2},
        {sourceBatchIndex: 1, sourceRowIndexOffset: 2, sourceRowCount: 0},
        {sourceBatchIndex: 2, sourceRowIndexOffset: 2, sourceRowCount: 3}
      ],
      'retains stable source identities without reading rows'
    );
    testContext.deepEqual(
      result.table.schema.fields.map(field => [field.name, field.format]),
      [
        ['fare', 'float32'],
        ['category', 'uint32']
      ],
      'uploads portable numerical values and dictionary indices'
    );
    testContext.deepEqual(
      result.dictionaries['category'],
      {values: ['economy', 'premium'], ordered: true},
      'retains dictionary labels exclusively as adapter-owned metadata'
    );
    testContext.deepEqual(
      result.nullCounts,
      {fare: [1, 0, 1], category: [0, 0, 0]},
      'retains accurate per-column and per-batch null counts'
    );

    for (const [batchIndex, batch] of result.table.batches.entries()) {
      for (const [columnName, data] of Object.entries(batch.gpuData)) {
        testContext.ok(data.buffer.usage & Buffer.STORAGE, 'source chunks support GPU analytics');
        testContext.ok(data.ownsBuffer, 'source chunks retain explicit GPU ownership');
        testContext.notEqual(
          result.validity[columnName]?.data[batchIndex].buffer,
          data.buffer,
          'validity occupies a separate GPU-backed sidecar'
        );
        if (batch.numRows === 0) {
          testContext.ok(
            data.buffer.byteLength >= 4,
            'empty source batches retain bindable nonzero physical allocations'
          );
          testContext.ok(
            (result.validity[columnName]?.data[batchIndex].buffer.byteLength ?? 0) >= 4,
            'empty validity chunks retain bindable nonzero physical allocations'
          );
        }
      }
    }

    testContext.equal(submit.mock.calls.length, 0, 'ingestion never submits GPU command work');
    testContext.equal(
      createCommandEncoder.mock.calls.length,
      0,
      'ingestion never creates command encoders'
    );

    submit.mockRestore();
    createCommandEncoder.mockRestore();

    testContext.deepEqual(
      await readGPUValidity(result.validity['fare']!),
      [[0, 1], [], [0, 1, 1]],
      'normalizes sliced Arrow bitmaps to per-row WebGPU validity masks'
    );
    testContext.deepEqual(
      await readGPUValidity(result.validity['category']!),
      [[1, 1], [], [1, 1, 1]],
      'materializes all-valid nullable dictionary sidecars'
    );
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
    testContext.ok(
      ownedBuffers.every(buffer => buffer.destroyed),
      'source chunks and independent validity sidecars release exactly their owned allocations'
    );
  }

  testContext.end();
});

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
