// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';

import {makeGPUAnalyticsTableFromArrowTable} from '@luma.gl/arrow';
import {Buffer, type BufferProps} from '@luma.gl/core';
import {GPUData, GPURecordBatch, GPUTable, GPUVector} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import {describe, expect, test, vi} from 'vitest';

type AnalyticsDictionaryIndex = arrow.Int32 | arrow.Uint32;
type AnalyticsDictionaryType = arrow.Dictionary<arrow.Utf8, AnalyticsDictionaryIndex>;

describe('makeGPUAnalyticsTableFromArrowTable package boundaries', () => {
  test('keeps Arrow ingestion in its adapter package without introducing experimental cycles', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    ) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };

    expect(typeof makeGPUAnalyticsTableFromArrowTable).toBe('function');
    expect(packageJson.dependencies?.['apache-arrow']).toBeDefined();
    expect(packageJson.dependencies?.['@luma.gl/tables']).toBeDefined();
    expect(packageJson.dependencies?.['@luma.gl/experimental']).toBeUndefined();
    expect(packageJson.peerDependencies?.['@luma.gl/experimental']).toBeUndefined();
  });
});

describe('makeGPUAnalyticsTableFromArrowTable source preservation', () => {
  test('uploads analytics columns without shader metadata while preserving source batches', async () => {
    const device = new NullDevice({id: 'arrow-analytics-source'});
    const source = createAnalyticsTable();
    const submit = vi.spyOn(device, 'submit');
    const createCommandEncoder = vi.spyOn(device, 'createCommandEncoder');
    const result = makeGPUAnalyticsTableFromArrowTable(device, source);

    expect(result.table).toBeInstanceOf(GPUTable);
    expect(result.table.numRows).toBe(5);
    expect(result.table.numCols).toBe(4);
    expect(result.table.batches).toHaveLength(3);
    expect(result.table.batches.every(batch => batch instanceof GPURecordBatch)).toBe(true);
    expect(result.table.batches.map(batch => batch.numRows)).toEqual([2, 0, 3]);
    expect(result.table.batches.map(batch => batch.sourceInfo)).toEqual([
      {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 2},
      {sourceBatchIndex: 1, sourceRowIndexOffset: 2, sourceRowCount: 0},
      {sourceBatchIndex: 2, sourceRowIndexOffset: 2, sourceRowCount: 3}
    ]);
    expect(
      result.table.schema.fields.map(field => [field.name, field.format, field.nullable])
    ).toEqual([
      ['fare', 'float32', true],
      ['distance', 'sint32', false],
      ['category', 'sint32', true],
      ['zone', 'uint32', false]
    ]);
    expect(result.table.bufferLayout.map(layout => layout.name)).toEqual([
      'fare',
      'distance',
      'category',
      'zone'
    ]);
    expect(result.table.gpuVectors['fare']).toBeInstanceOf(GPUVector);
    expect(result.table.gpuVectors['fare'].data.map(data => data.length)).toEqual([2, 0, 3]);
    expect(result.table.gpuVectors['category'].dataType).toBeInstanceOf(arrow.Dictionary);
    expect(result.table.gpuVectors['fare'].data[1].buffer.byteLength).toBeGreaterThanOrEqual(4);

    for (const batch of result.table.batches) {
      for (const data of Object.values(batch.gpuData)) {
        expect(data).toBeInstanceOf(GPUData);
        expect(data.ownsBuffer).toBe(true);
        expect(data.buffer.usage & Buffer.STORAGE).not.toBe(0);
      }
    }

    expect(await readWords(result.table.gpuVectors['zone'])).toEqual([[7, 8], [], [9, 10, 11]]);
    expect(submit).not.toHaveBeenCalled();
    expect(createCommandEncoder).not.toHaveBeenCalled();

    submit.mockRestore();
    createCommandEncoder.mockRestore();
    destroyAnalyticsResult(result);
  });

  test('keeps table, field, and source-batch metadata independent', () => {
    const device = new NullDevice({id: 'arrow-analytics-metadata'});
    const source = createAnalyticsTable();
    const result = makeGPUAnalyticsTableFromArrowTable(device, source);

    expect(result.table.schema.metadata.get('dataset')).toBe('taxi-rides');
    expect(result.table.schema.metadata.get('scope')).toBe('table');
    expect(result.table.batches.map(batch => batch.schema.metadata.get('batch'))).toEqual([
      '0',
      '1',
      '2'
    ]);
    expect(result.table.schema.fields[0]?.metadata?.get('unit')).toBe('USD');

    result.table.schema.metadata.set('scope', 'projected');
    result.table.schema.fields[0]?.metadata?.set('unit', 'changed');
    result.table.batches[0].schema.metadata.set('batch', 'changed');

    expect(source.schema.metadata.get('scope')).toBe('table');
    expect(source.schema.fields[0]?.metadata.get('unit')).toBe('USD');
    expect(source.batches[0].schema.metadata.get('batch')).toBe('0');
    expect(result.table.batches[1].schema.metadata.get('batch')).toBe('1');

    destroyAnalyticsResult(result);
  });

  test('preserves caller-selected column ordering and supports zero-column batches', () => {
    const device = new NullDevice({id: 'arrow-analytics-selection'});
    const source = createAnalyticsTable();
    const selected = makeGPUAnalyticsTableFromArrowTable(device, source, {
      columns: ['category', 'fare']
    });
    const empty = makeGPUAnalyticsTableFromArrowTable(device, source, {columns: []});

    expect(selected.table.schema.fields.map(field => field.name)).toEqual(['category', 'fare']);
    expect(Object.keys(selected.table.gpuVectors)).toEqual(['category', 'fare']);
    expect(Object.keys(selected.validity)).toEqual(['category', 'fare']);
    expect(Object.keys(selected.dictionaries)).toEqual(['category']);
    expect(selected.nullCounts).toEqual({category: [1, 0, 1], fare: [1, 0, 1]});

    expect(empty.table.numRows).toBe(5);
    expect(empty.table.numCols).toBe(0);
    expect(empty.table.batches.map(batch => batch.numRows)).toEqual([2, 0, 3]);
    expect(empty.table.batches.map(batch => Object.keys(batch.gpuData))).toEqual([[], [], []]);
    expect(empty.validity).toEqual({});
    expect(empty.dictionaries).toEqual({});
    expect(empty.nullCounts).toEqual({});

    destroyAnalyticsResult(selected);
    destroyAnalyticsResult(empty);
  });

  test('distinguishes an empty schema-only Arrow table from an explicit empty source batch', () => {
    const device = new NullDevice({id: 'arrow-analytics-empty'});
    const source = createAnalyticsTable();
    const createBuffer = vi.spyOn(device, 'createBuffer');
    const schemaOnly = makeGPUAnalyticsTableFromArrowTable(device, new arrow.Table(source.schema));

    expect(schemaOnly.table.numRows).toBe(0);
    expect(schemaOnly.table.batches).toEqual([]);
    expect(schemaOnly.table.schema.fields.map(field => field.name)).toEqual([
      'fare',
      'distance',
      'category',
      'zone'
    ]);
    expect(schemaOnly.table.schema.metadata.get('dataset')).toBe('taxi-rides');
    expect(schemaOnly.validity).toEqual({});
    expect(schemaOnly.dictionaries).toEqual({});
    expect(createBuffer).not.toHaveBeenCalled();

    const explicitEmpty = makeGPUAnalyticsTableFromArrowTable(
      device,
      new arrow.Table(source.schema, [source.batches[1]])
    );
    expect(explicitEmpty.table.batches).toHaveLength(1);
    expect(explicitEmpty.table.batches[0].numRows).toBe(0);
    expect(explicitEmpty.table.gpuVectors['fare'].data[0].length).toBe(0);
    expect(explicitEmpty.table.gpuVectors['fare'].data[0].buffer.byteLength).toBeGreaterThanOrEqual(
      4
    );
    expect(explicitEmpty.validity['fare']?.data[0].length).toBe(0);
    expect(explicitEmpty.validity['fare']?.data[0].buffer.byteLength).toBeGreaterThanOrEqual(4);

    createBuffer.mockRestore();
    destroyAnalyticsResult(schemaOnly);
    destroyAnalyticsResult(explicitEmpty);
  });
});

describe('makeGPUAnalyticsTableFromArrowTable GPU validity', () => {
  test('expands sliced Arrow validity bitmaps into separate source-aligned uint32 vectors', async () => {
    const device = new NullDevice({id: 'arrow-analytics-validity'});
    const source = createAnalyticsTable();
    const result = makeGPUAnalyticsTableFromArrowTable(device, source);

    expect(source.nullCount).toBe(0);
    expect(source.batches.map(batch => batch.nullCount)).toEqual([0, 0, 0]);
    expect(Object.keys(result.validity)).toEqual(['fare', 'category']);
    expect(result.validity['fare']?.format).toBe('uint32');
    expect(result.validity['fare']?.data.map(data => data.length)).toEqual([2, 0, 3]);
    expect(result.validity['category']?.data.map(data => data.length)).toEqual([2, 0, 3]);
    expect(await readWords(result.validity['fare']!)).toEqual([[0, 1], [], [0, 1, 1]]);
    expect(await readWords(result.validity['category']!)).toEqual([[1, 0], [], [1, 0, 1]]);
    expect(result.nullCounts).toEqual({
      fare: [1, 0, 1],
      distance: [0, 0, 0],
      category: [1, 0, 1],
      zone: [0, 0, 0]
    });

    for (const [columnName, validity] of Object.entries(result.validity)) {
      for (const [batchIndex, data] of validity!.data.entries()) {
        expect(data.ownsBuffer).toBe(true);
        expect(data.buffer.usage & Buffer.STORAGE).not.toBe(0);
        expect(data.buffer).not.toBe(result.table.batches[batchIndex].gpuData[columnName].buffer);
      }
    }

    destroyAnalyticsResult(result);
  });

  test('materializes all-valid masks for nullable fields even when no bitmap was allocated', async () => {
    const device = new NullDevice({id: 'arrow-analytics-all-valid'});
    const field = new arrow.Field('fare', new arrow.Float32(), true);
    const schema = new arrow.Schema([field]);
    const values = arrow.makeVector(new Float32Array([10, 20, 30]));
    const batch = new arrow.RecordBatch(
      schema,
      arrow.makeData({
        type: new arrow.Struct(schema.fields),
        length: values.length,
        children: [values.data[0]]
      })
    );
    const source = new arrow.Table(schema, [batch]);
    const result = makeGPUAnalyticsTableFromArrowTable(device, source);

    expect(source.schema.fields[0]?.nullable).toBe(true);
    expect(result.validity['fare']).toBeInstanceOf(GPUVector);
    expect(await readWords(result.validity['fare']!)).toEqual([[1, 1, 1]]);
    expect(result.nullCounts['fare']).toEqual([0]);

    destroyAnalyticsResult(result);
  });

  test('rejects positive null counts when Arrow validity bytes are missing or inconsistent', () => {
    const device = new NullDevice({id: 'arrow-analytics-malformed-validity'});
    const type = new arrow.Float32();
    const missingBitmap = arrow.makeData({
      type,
      length: 3,
      data: new Float32Array([1, 2, 3]),
      nullCount: 1
    });
    const wrongCount = arrow.makeData({
      type,
      length: 3,
      data: new Float32Array([1, 2, 3]),
      nullBitmap: new Uint8Array([0b00000111]),
      nullCount: 1
    });

    for (const data of [missingBitmap, wrongCount]) {
      const source = new arrow.Table([new arrow.RecordBatch({fare: data})]);
      expect(() => makeGPUAnalyticsTableFromArrowTable(device, source)).toThrow(
        /validity|bitmap|null/i
      );
    }
  });

  test('rejects source null values declared through a nonnullable schema field', () => {
    const device = new NullDevice({id: 'arrow-analytics-invalid-nonnullable'});
    const field = new arrow.Field('fare', new arrow.Float32(), false);
    const schema = new arrow.Schema([field]);
    const data = arrow.vectorFromArray([1, null, 3], new arrow.Float32()).data[0];
    const batch = new arrow.RecordBatch(
      schema,
      arrow.makeData({type: new arrow.Struct(schema.fields), length: 3, children: [data]})
    );

    expect(() =>
      makeGPUAnalyticsTableFromArrowTable(device, new arrow.Table(schema, [batch]))
    ).toThrow(/nullable|null|validity/i);
  });
});

describe('makeGPUAnalyticsTableFromArrowTable categorical dictionaries', () => {
  test.each([
    {indexType: new arrow.Int32(), format: 'sint32'},
    {indexType: new arrow.Uint32(), format: 'uint32'}
  ])('preserves ordered UTF-8 dictionary labels and $format GPU indices', ({indexType, format}) => {
    const device = new NullDevice({id: `arrow-analytics-dictionary-${format}`});
    const source = createAnalyticsTable({dictionaryIndexType: indexType});
    const result = makeGPUAnalyticsTableFromArrowTable(device, source, {columns: ['category']});

    expect(result.table.gpuVectors['category'].format).toBe(format);
    expect(result.dictionaries['category']).toEqual({
      values: ['economy', 'premium', 'business'],
      ordered: true
    });
    expect(result.nullCounts['category']).toEqual([1, 0, 1]);

    destroyAnalyticsResult(result);
  });

  test('rejects dictionaries whose labels change across preserved source batches', () => {
    const device = new NullDevice({id: 'arrow-analytics-dictionary-mismatch'});
    const source = createAnalyticsTable({
      dictionaryLabelsByBatch: [
        ['economy', 'premium', 'business'],
        ['economy', 'premium', 'business'],
        ['premium', 'economy', 'business']
      ]
    });

    expect(() => makeGPUAnalyticsTableFromArrowTable(device, source)).toThrow(
      /dictionary|categorical|labels/i
    );
  });

  test('rejects dictionary labels that would decode apparently valid rows as null', () => {
    const device = new NullDevice({id: 'arrow-analytics-null-dictionary'});
    const labels = arrow.vectorFromArray([null, 'premium'], new arrow.Utf8());
    const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32());
    const data = arrow.makeData({
      type: dictionaryType,
      length: 2,
      data: new Int32Array([0, 1]),
      dictionary: labels
    });
    const source = new arrow.Table([new arrow.RecordBatch({category: data})]);

    expect(() => makeGPUAnalyticsTableFromArrowTable(device, source)).toThrow(
      /dictionary|null|label/i
    );
  });
});

describe('makeGPUAnalyticsTableFromArrowTable unsupported inputs and ownership', () => {
  test.each([
    ['Float64', arrow.vectorFromArray([1, 2], new arrow.Float64())],
    ['Int64', arrow.vectorFromArray([1n, 2n], new arrow.Int64())],
    ['Utf8', arrow.vectorFromArray(['alpha', 'beta'], new arrow.Utf8())],
    ['Int8', arrow.vectorFromArray([1, 2], new arrow.Int8())],
    ['Uint16', arrow.vectorFromArray([1, 2], new arrow.Uint16())]
  ])('rejects unsupported browser-portable analytics type %s before allocating', (_name, vector) => {
    const device = new NullDevice({id: 'arrow-analytics-unsupported'});
    const createBuffer = vi.spyOn(device, 'createBuffer');
    const source = new arrow.Table([new arrow.RecordBatch({unsupported: vector.data[0]})]);

    expect(() => makeGPUAnalyticsTableFromArrowTable(device, source)).toThrow(
      /unsupported|float|int|string|utf/i
    );
    expect(createBuffer).not.toHaveBeenCalled();
    createBuffer.mockRestore();
  });

  test('rejects narrow dictionary indices before allocating GPU storage', () => {
    const device = new NullDevice({id: 'arrow-analytics-narrow-dictionary'});
    const createBuffer = vi.spyOn(device, 'createBuffer');
    const dictionary = arrow.vectorFromArray(['economy', 'premium'], new arrow.Utf8());
    const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int8());
    const data = arrow.makeData({
      type: dictionaryType,
      length: 2,
      data: new Int8Array([0, 1]),
      dictionary
    });

    expect(() =>
      makeGPUAnalyticsTableFromArrowTable(
        device,
        new arrow.Table([new arrow.RecordBatch({category: data})])
      )
    ).toThrow(/unsupported|dictionary|int/i);
    expect(createBuffer).not.toHaveBeenCalled();
    createBuffer.mockRestore();
  });

  test('rejects unknown and duplicated selected columns before allocating', () => {
    const device = new NullDevice({id: 'arrow-analytics-invalid-columns'});
    const source = createAnalyticsTable();
    const createBuffer = vi.spyOn(device, 'createBuffer');

    expect(() =>
      makeGPUAnalyticsTableFromArrowTable(device, source, {columns: ['fare', 'missing']})
    ).toThrow(/column|missing/i);
    expect(() =>
      makeGPUAnalyticsTableFromArrowTable(device, source, {columns: ['fare', 'fare']})
    ).toThrow(/column|duplicate|once/i);
    expect(createBuffer).not.toHaveBeenCalled();

    createBuffer.mockRestore();
  });

  test('rejects shared external buffer handles and incompatible mapped-buffer usage', () => {
    const device = new NullDevice({id: 'arrow-analytics-buffer-ownership'});
    const source = createAnalyticsTable();
    const createBuffer = vi.spyOn(device, 'createBuffer');

    expect(() =>
      makeGPUAnalyticsTableFromArrowTable(device, source, {
        bufferProps: {handle: {external: true}}
      })
    ).toThrow(/handle|borrow|owned|buffer/i);
    expect(() =>
      makeGPUAnalyticsTableFromArrowTable(device, source, {
        bufferProps: {_isHandleBorrowed: true}
      })
    ).toThrow(/handle|borrow|owned|buffer/i);
    expect(() =>
      makeGPUAnalyticsTableFromArrowTable(device, source, {
        bufferProps: {usage: Buffer.MAP_READ}
      })
    ).toThrow(/map|usage|storage/i);
    expect(() =>
      makeGPUAnalyticsTableFromArrowTable(device, source, {
        bufferProps: {usage: Buffer.MAP_WRITE}
      })
    ).toThrow(/map|usage|storage/i);
    expect(() =>
      makeGPUAnalyticsTableFromArrowTable(device, source, {
        bufferProps: {byteOffset: 4}
      })
    ).toThrow(/offset|buffer|layout/i);
    expect(createBuffer).not.toHaveBeenCalled();

    createBuffer.mockRestore();
  });

  test('destroys every already-created GPU allocation if a later upload fails', () => {
    const device = new NullDevice({id: 'arrow-analytics-cleanup'});
    const source = createAnalyticsTable();
    const allocatedBuffers: Buffer[] = [];
    const createBuffer = device.createBuffer.bind(device);
    const createBufferSpy = vi
      .spyOn(device, 'createBuffer')
      .mockImplementation((props: BufferProps) => {
        if (allocatedBuffers.length === 4) {
          throw new Error('injected analytics upload failure');
        }
        const buffer = createBuffer(props);
        allocatedBuffers.push(buffer);
        return buffer;
      });

    expect(() => makeGPUAnalyticsTableFromArrowTable(device, source)).toThrow(/injected/i);
    expect(allocatedBuffers).toHaveLength(4);
    expect(allocatedBuffers.every(buffer => buffer.destroyed)).toBe(true);

    createBufferSpy.mockRestore();
  });
});

type AnalyticsTableFixtureOptions = {
  dictionaryIndexType?: AnalyticsDictionaryIndex;
  dictionaryLabelsByBatch?: readonly (readonly string[])[];
};

function createAnalyticsTable({
  dictionaryIndexType = new arrow.Int32(),
  dictionaryLabelsByBatch
}: AnalyticsTableFixtureOptions = {}): arrow.Table {
  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), dictionaryIndexType, 41, true);
  const fields = [
    new arrow.Field('fare', new arrow.Float32(), true, new Map([['unit', 'USD']])),
    new arrow.Field('distance', new arrow.Int32(), false),
    new arrow.Field('category', dictionaryType, true),
    new arrow.Field('zone', new arrow.Uint32(), false)
  ];
  const schema = new arrow.Schema(
    fields,
    new Map([
      ['dataset', 'taxi-rides'],
      ['scope', 'table']
    ])
  );
  const fares = arrow.vectorFromArray(
    [0, 1, 2, 3, 4, 5, 6, null, 8, null, 10, 11, null, 13],
    new arrow.Float32()
  );
  const distances = arrow.vectorFromArray(
    new Int32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
    new arrow.Int32()
  );
  const zones = arrow.vectorFromArray(
    new Uint32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
    new arrow.Uint32()
  );
  const rowRanges = [
    [7, 9],
    [9, 9],
    [9, 12]
  ] as const;

  const batches = rowRanges.map(([start, end], batchIndex) => {
    const labels = dictionaryLabelsByBatch?.[batchIndex] ?? ['economy', 'premium', 'business'];
    const categories = createDictionaryVector(dictionaryType, labels);
    const children = [
      fares.slice(start, end).data[0],
      distances.slice(start, end).data[0],
      categories.slice(start, end).data[0],
      zones.slice(start, end).data[0]
    ];
    const batchSchema = new arrow.Schema(
      fields,
      new Map([
        ['batch', String(batchIndex)],
        ['scope', 'batch']
      ])
    );
    return new arrow.RecordBatch(
      batchSchema,
      arrow.makeData({
        type: new arrow.Struct(batchSchema.fields),
        length: end - start,
        children
      })
    );
  });

  return new arrow.Table(schema, batches);
}

function createDictionaryVector(
  dictionaryType: AnalyticsDictionaryType,
  labels: readonly string[]
): arrow.Vector<AnalyticsDictionaryType> {
  const dictionary = arrow.vectorFromArray(labels, new arrow.Utf8());
  const Constructor = dictionaryType.indices instanceof arrow.Uint32 ? Uint32Array : Int32Array;
  const indices = new Constructor([0, 1, 2, 0, 1, 2, 0, 1, 0, 2, 1, 0, 2, 1]);
  const nullBitmap = new Uint8Array([0b11111111, 0b11111010]);
  const data = arrow.makeData({
    type: dictionaryType,
    length: indices.length,
    data: indices,
    nullBitmap,
    nullCount: 2,
    dictionary
  });

  return new arrow.Vector([data]) as arrow.Vector<AnalyticsDictionaryType>;
}

async function readWords(vector: GPUVector): Promise<number[][]> {
  return Promise.all(
    vector.data.map(async data => {
      if (data.length === 0) return [];
      const bytes = await data.buffer.readAsync(data.byteOffset, data.length * data.byteStride);
      const values = new Uint32Array(bytes.buffer, bytes.byteOffset, data.length);
      return Array.from(values);
    })
  );
}

function destroyAnalyticsResult(result: {
  table: GPUTable;
  validity: Partial<Record<string, GPUVector<'uint32'>>>;
}): void {
  result.table.destroy();
  for (const validity of Object.values(result.validity)) validity?.destroy();
}
