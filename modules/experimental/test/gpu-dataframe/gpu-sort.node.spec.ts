// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  column,
  CompiledGPUDataFrameGlobalSort,
  CompiledGPUDataFrameSort,
  literal,
  GPUDataFrame,
  GPUDataFrameGlobalSortQuery,
  GPUDataFrameSortQuery,
  parameter,
  type GPUDataFrameQueryParameters,
  type GPUDataFrameSortOptions
} from '@luma.gl/experimental/gpu-dataframe';
import {
  GPUConstant,
  GPUData,
  GPURecordBatch,
  GPUTable,
  type GPUField,
  type GPURecordBatchSourceInfo
} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, expectTypeOf, test, vi} from 'vitest';

type SortSourceColumns = {
  score: 'float32';
  signed: 'sint32';
  category: 'uint32';
  coordinates: 'float32x2';
};

type SortSourceFixture = {
  device: NullDevice;
  table: GPUTable<SortSourceColumns>;
  buffers: Buffer[];
};

describe('GPUDataFrame immutable stable scalar sorting', () => {
  test('plans ascending source-batch ordering without GPU allocation or resource retention', () => {
    const fixture = createSortSourceFixture([2, 0, 3]);
    const source = new GPUDataFrame({table: fixture.table, ownership: 'owned'});
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoder = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submit = vi.spyOn(fixture.device, 'submit');
    const tableSelect = vi.spyOn(fixture.table, 'select');

    const sorted = source.sortBy('score');

    expect(sorted).toBeInstanceOf(GPUDataFrameSortQuery);
    expect(sorted.query.source).toBe(source);
    expect(sorted.column).toBe('score');
    expect(sorted.options).toEqual({
      direction: 'ascending',
      nulls: 'last',
      nans: 'last',
      algorithm: 'auto'
    });
    expect(Object.isFrozen(sorted)).toBe(true);
    expect(Object.isFrozen(sorted.options)).toBe(true);
    expect(source.batches.map(batch => batch.numRows)).toEqual([2, 0, 3]);
    expect(source.sourceInfo.map(info => info?.sourceRowIndexOffset)).toEqual([40, 42, 42]);
    expect(createBuffer).not.toHaveBeenCalled();
    expect(createCommandEncoder).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    expect(tableSelect).not.toHaveBeenCalled();

    source.destroy();
    expect(fixture.buffers.every(buffer => buffer.destroyed)).toBe(true);

    createBuffer.mockRestore();
    createCommandEncoder.mockRestore();
    submit.mockRestore();
    tableSelect.mockRestore();
  });

  test('defaults direct top-K to descending while sorted-plan limiting preserves its direction', () => {
    const fixture = createSortSourceFixture([2, 0, 3]);
    const source = new GPUDataFrame({table: fixture.table});

    const largest = source.topK('score', 2);
    const smallest = source.sortBy('score').topK(2);
    const explicit = source.topK('signed', 0, {
      direction: 'ascending',
      nulls: 'first',
      nans: 'first',
      algorithm: 'radix'
    });
    const unchanged = source.sortBy('category', {direction: 'descending', algorithm: 'bitonic'});
    const limited = unchanged.topK(0xffffffff);

    expect(largest.options).toEqual({
      direction: 'descending',
      nulls: 'last',
      nans: 'last',
      algorithm: 'auto',
      limit: 2
    });
    expect(smallest.options).toEqual({
      direction: 'ascending',
      nulls: 'last',
      nans: 'last',
      algorithm: 'auto',
      limit: 2
    });
    expect(explicit.options).toEqual({
      direction: 'ascending',
      nulls: 'first',
      nans: 'first',
      algorithm: 'radix',
      limit: 0
    });
    expect(unchanged.options).not.toHaveProperty('limit');
    expect(limited.options).toEqual({...unchanged.options, limit: 0xffffffff});

    source.destroy();
    fixture.table.destroy();
  });

  test('clones immutable options and keeps precise projected and derived source output types', () => {
    const fixture = createSortSourceFixture([2]);
    const source = new GPUDataFrame({table: fixture.table});
    const options: {direction: 'ascending' | 'descending'; nulls: 'first' | 'last'} = {
      direction: 'descending',
      nulls: 'first'
    };
    const sorted = source.sortBy('score', options);
    options.direction = 'ascending';
    options.nulls = 'last';

    const projected = source
      .filter(column('score').greaterThan(literal(0)))
      .select(['score', 'signed'])
      .sortBy('signed');
    const derived = source
      .withColumn('adjustedScore', column('score').add(literal(2)))
      .select(['score', 'adjustedScore'])
      .topK('adjustedScore', 3);

    expect(sorted.options.direction).toBe('descending');
    expect(sorted.options.nulls).toBe('first');
    expectTypeOf(projected.compile).returns.toEqualTypeOf<
      CompiledGPUDataFrameSort<{score: 'float32'; signed: 'sint32'}>
    >();
    expectTypeOf(derived.compile).returns.toEqualTypeOf<
      CompiledGPUDataFrameSort<{score: 'float32'; adjustedScore: 'float32'}>
    >();

    source.destroy();
    fixture.table.destroy();
  });

  test('preserves interaction parameters, hidden dependencies, and empty source-batch topology', () => {
    for (const batchLengths of [[], [0], [2, 0, 3]] as const) {
      const fixture = createSortSourceFixture(batchLengths, {nullableScore: true});
      const source = new GPUDataFrame({table: fixture.table});
      const filtered = source.filter(column('score').greaterThan(parameter('minimumScore', 10)));
      const adjusted = filtered.withColumn('adjustedScore', column('score').add(literal(2)));
      const sorted = adjusted.select(['signed', 'adjustedScore']).topK('adjustedScore', 2, {
        nulls: 'first',
        nans: 'first'
      });

      expect(sorted.query.predicates[0]).toBe(filtered.predicates[0]);
      expect(sorted.query.derivedColumns.map(({name}) => name)).toEqual(['adjustedScore']);
      expect(sorted.query.selectedColumns).toEqual(['signed', 'adjustedScore']);
      expect(sorted.query.source.batches.map(batch => batch.numRows)).toEqual(batchLengths);
      expect(sorted.options.direction).toBe('descending');

      source.destroy();
      fixture.table.destroy();
    }
  });

  test('rejects unknown, hidden, vector-valued, and constant sort keys before GPU work', () => {
    const fixture = createSortSourceFixture([2]);
    const source = new GPUDataFrame({table: fixture.table});
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');

    expect(() =>
      // @ts-expect-error Sort keys must be selected 32-bit scalar GPU columns.
      source.sortBy('coordinates')
    ).toThrow(/scalar|column/i);
    expect(() =>
      // @ts-expect-error Sort keys must exist in the source dataframe.
      source.sortBy('missing')
    ).toThrow(/selected|column/i);
    const selected = source.filter(column('score').greaterThan(literal(0))).select(['score']);
    expect(() =>
      // @ts-expect-error Hidden source columns cannot supply sort keys.
      selected.sortBy('signed')
    ).toThrow(/selected|column/i);

    const constant = new GPUConstant({format: 'uint32', value: Uint32Array.of(7)});
    const constantTable = new GPUTable<SortSourceColumns & {tier: 'uint32'}>({
      batches: fixture.table.batches,
      constants: {tier: constant}
    });
    const constantSource = new GPUDataFrame({table: constantTable});
    expect(() => constantSource.sortBy('tier')).toThrow(/constant/i);
    expect(createBuffer).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    constantSource.destroy();
    source.destroy();
    constantTable.destroy();
  });

  test('rejects strided scalar sort keys before allocating or planning GPU output buffers', () => {
    const fixture = createSortSourceFixture([2, 0, 3], {stridedScore: true});
    Object.defineProperty(fixture.device, 'type', {value: 'webgpu'});
    const source = new GPUDataFrame({table: fixture.table});
    const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(fixture.device, {
      id: 'gpu-dataframe-strided-sort-key'
    });
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');
    const addComputePass = vi.spyOn(graph, 'addComputePass');
    const score = source.table.gpuVectors['score'];

    expect(score.byteStride).toBe(8);
    expect(score.rowByteLength).toBe(4);
    expect(score.stride).toBe(1);
    expect(score.data.map(chunk => chunk.byteStride)).toEqual([8, 8, 8]);
    expect(() => source.sortBy('score').compile(graph)).toThrow(/packed|stride|aligned/i);
    expect(() => source.sortByGlobal('score').compile(graph)).toThrow(/packed|stride|aligned/i);
    expect(createBuffer).not.toHaveBeenCalled();
    expect(addComputePass).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    addComputePass.mockRestore();
    source.destroy();
    fixture.table.destroy();
  });

  test('rejects non-closed ordering options and non-uint32 per-batch top-K limits', () => {
    const fixture = createSortSourceFixture([2]);
    const source = new GPUDataFrame({table: fixture.table});
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');

    for (const invalid of [
      {direction: 'sideways'},
      {nulls: 'middle'},
      {nans: 'ignore'},
      {algorithm: 'quicksort'}
    ]) {
      expect(() => source.sortBy('score', invalid as GPUDataFrameSortOptions)).toThrow(
        /direction|null|nan|algorithm/i
      );
    }
    expect(() => source.sortBy('score', null as unknown as GPUDataFrameSortOptions)).toThrow(
      /options/i
    );
    for (const limit of [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, 0x1_0000_0000]) {
      expect(() => source.topK('score', limit)).toThrow(/limit|uint32/i);
      expect(() => source.sortBy('score').topK(limit)).toThrow(/limit|uint32/i);
    }
    expect(createBuffer).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    source.destroy();
    fixture.table.destroy();
  });

  test('rejects new sorting and top-K plans after the source dataframe was destroyed', () => {
    const fixture = createSortSourceFixture([2]);
    const source = new GPUDataFrame({table: fixture.table});
    source.destroy();

    expect(() => source.sortBy('score')).toThrow(/destroyed/i);
    expect(() => source.topK('score', 2)).toThrow(/destroyed/i);
    expect(() => source.sortByGlobal('score')).toThrow(/destroyed/i);
    expect(() => source.topKGlobal('score', 2)).toThrow(/destroyed/i);
    fixture.table.destroy();
  });

  test('plans immutable global ordering without flattening batches or allocating GPU resources', () => {
    const fixture = createSortSourceFixture([2, 0, 3]);
    const source = new GPUDataFrame({table: fixture.table, ownership: 'owned'});
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');
    const submit = vi.spyOn(fixture.device, 'submit');

    const sorted = source.sortByGlobal('score', {nulls: 'first', nans: 'first'});
    const highest = source.topKGlobal('signed', 2);
    const lowest = source.sortByGlobal('category').topK(3);

    expect(sorted).toBeInstanceOf(GPUDataFrameGlobalSortQuery);
    expect(sorted).toBeInstanceOf(GPUDataFrameSortQuery);
    expect(sorted.options).toEqual({
      direction: 'ascending',
      nulls: 'first',
      nans: 'first',
      algorithm: 'auto'
    });
    expect(highest.options).toEqual({
      direction: 'descending',
      nulls: 'last',
      nans: 'last',
      algorithm: 'auto',
      limit: 2
    });
    expect(lowest.options.direction).toBe('ascending');
    expect(lowest.options.limit).toBe(3);
    expect(Object.isFrozen(sorted)).toBe(true);
    expect(Object.isFrozen(sorted.options)).toBe(true);
    expect(source.batches.map(batch => batch.numRows)).toEqual([2, 0, 3]);
    expect(createBuffer).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    submit.mockRestore();
    source.destroy();
    expect(fixture.buffers.every(buffer => buffer.destroyed)).toBe(true);
  });

  test('preserves precise projected and derived global output types and validates global limits', () => {
    const fixture = createSortSourceFixture([2, 0, 3]);
    const source = new GPUDataFrame({table: fixture.table});
    const projected = source
      .filter(column('score').greaterThan(literal(0)))
      .select(['score', 'signed'])
      .sortByGlobal('signed');
    const derived = source
      .withColumn('adjustedScore', column('score').add(literal(2)))
      .select(['score', 'adjustedScore'])
      .topKGlobal('adjustedScore', 1);

    expectTypeOf(projected.compile).returns.toEqualTypeOf<
      CompiledGPUDataFrameGlobalSort<{score: 'float32'; signed: 'sint32'}>
    >();
    expectTypeOf(derived.compile).returns.toEqualTypeOf<
      CompiledGPUDataFrameGlobalSort<{score: 'float32'; adjustedScore: 'float32'}>
    >();
    for (const limit of [-1, 0.5, Number.NaN, 0x1_0000_0000]) {
      expect(() => source.topKGlobal('score', limit)).toThrow(/limit|uint32/i);
      expect(() => source.sortByGlobal('score').topK(limit)).toThrow(/limit|uint32/i);
    }

    source.destroy();
    fixture.table.destroy();
  });
});

function createSortSourceFixture(
  batchLengths: readonly number[],
  options: {nullableScore?: boolean; stridedScore?: boolean} = {}
): SortSourceFixture {
  const device = new NullDevice({id: 'gpu-dataframe-stable-sort-node-device'});
  const buffers: Buffer[] = [];
  const fields: GPUField<keyof SortSourceColumns>[] = [
    {name: 'score', format: 'float32', nullable: options.nullableScore ?? false},
    {name: 'signed', format: 'sint32', nullable: false},
    {name: 'category', format: 'uint32', nullable: false},
    {name: 'coordinates', format: 'float32x2', nullable: false}
  ];
  let sourceRowIndexOffset = 40;
  const batches = batchLengths.map((length, sourceBatchIndex) => {
    const sourceInfo: GPURecordBatchSourceInfo = {
      sourceBatchIndex,
      sourceRowIndexOffset,
      sourceRowCount: length
    };
    sourceRowIndexOffset += length;

    return new GPURecordBatch<SortSourceColumns>({
      gpuData: {
        score: makeSortSourceData(
          device,
          buffers,
          length,
          'float32',
          options.stridedScore ? {byteStride: 8, rowByteLength: 4, stride: 1} : undefined
        ),
        signed: makeSortSourceData(device, buffers, length, 'sint32'),
        category: makeSortSourceData(device, buffers, length, 'uint32'),
        coordinates: makeSortSourceData(device, buffers, length, 'float32x2')
      },
      fields,
      numRows: length,
      sourceInfo
    });
  });

  const table =
    batches.length > 0
      ? new GPUTable<SortSourceColumns>({batches})
      : new GPUTable<SortSourceColumns>({
          schema: {fields, metadata: new Map()},
          bufferLayout: [
            {name: 'score', format: 'float32'},
            {name: 'signed', format: 'sint32'},
            {name: 'category', format: 'uint32'},
            {name: 'coordinates', format: 'float32x2'}
          ]
        });
  return {device, table, buffers};
}

function makeSortSourceData<Format extends SortSourceColumns[keyof SortSourceColumns]>(
  device: NullDevice,
  buffers: Buffer[],
  length: number,
  format: Format,
  layout?: {byteStride: number; rowByteLength: number; stride: number}
): GPUData<Format> {
  const byteStride =
    layout?.byteStride ?? (format === 'float32x2' ? 8 : Uint32Array.BYTES_PER_ELEMENT);
  const buffer = device.createBuffer({
    byteLength: Math.max(length, 1) * byteStride,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  buffers.push(buffer);
  return new GPUData({buffer, format, length, ownsBuffer: true, ...layout});
}
