// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  column,
  CompiledLuDataFrameAggregation,
  CompiledLuDataFrameHistogram,
  literal,
  LuDataFrame,
  LuDataFrameAggregationQuery,
  LuDataFrameHistogramQuery,
  parameter,
  type LuDataFrameGlobalAggregationDefinitions,
  type LuDataFrameGlobalAggregationResult,
  type LuDataFrameHistogramOptions
} from '@luma.gl/experimental/ludf';
import {
  GPUData,
  GPURecordBatch,
  GPUTable,
  type GPUField,
  type GPURecordBatchSourceInfo
} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, expectTypeOf, test, vi} from 'vitest';

type AnalyticSourceColumns = {
  fare: 'float32';
  distance: 'sint32';
  category: 'uint32';
  coordinates: 'float32x2';
};

type AnalyticSourceFixture = {
  device: NullDevice;
  table: GPUTable<AnalyticSourceColumns>;
  buffers: Buffer[];
};

describe('LuDataFrame immutable global-reduction planning', () => {
  test('plans every scalar statistic without GPU allocation, submission, or source retention', () => {
    const fixture = createAnalyticSourceFixture([2, 0, 3]);
    const source = new LuDataFrame({table: fixture.table, ownership: 'owned'});
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoder = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submit = vi.spyOn(fixture.device, 'submit');
    const tableSelect = vi.spyOn(fixture.table, 'select');

    const aggregated = source.aggregate({
      rowCount: 'count',
      totalFare: {sum: 'fare'},
      minimumDistance: {min: 'distance'},
      maximumCategory: {max: 'category'},
      averageFare: {mean: 'fare'},
      totalDistance: {sum: 'distance'}
    });

    expect(aggregated).toBeInstanceOf(LuDataFrameAggregationQuery);
    expect(aggregated.query.source).toBe(source);
    expect(aggregated.definitions).toEqual([
      {name: 'rowCount', operation: 'count'},
      {name: 'totalFare', operation: 'sum', column: 'fare'},
      {name: 'minimumDistance', operation: 'min', column: 'distance'},
      {name: 'maximumCategory', operation: 'max', column: 'category'},
      {name: 'averageFare', operation: 'mean', column: 'fare'},
      {name: 'totalDistance', operation: 'sum', column: 'distance'}
    ]);
    expect(Object.isFrozen(aggregated)).toBe(true);
    expect(Object.isFrozen(aggregated.definitions)).toBe(true);
    expect(Object.isFrozen(aggregated.definitions[0])).toBe(true);
    expect(source.batches.map(batch => batch.numRows)).toEqual([2, 0, 3]);
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

  test('retains native sum/min/max formats, float32 means, and exact uint32 row counts', () => {
    const fixture = createAnalyticSourceFixture([2]);
    const source = new LuDataFrame({table: fixture.table});
    const aggregated = source.aggregate({
      rowCount: 'count',
      totalFare: {sum: 'fare'},
      minimumDistance: {min: 'distance'},
      maximumCategory: {max: 'category'},
      averageDistance: {mean: 'distance'}
    });

    expectTypeOf(aggregated.compile).returns.toEqualTypeOf<
      CompiledLuDataFrameAggregation<{
        rowCount: 'uint32';
        totalFare: 'float32';
        minimumDistance: 'sint32';
        maximumCategory: 'uint32';
        averageDistance: 'float32';
      }>
    >();
    expectTypeOf<
      LuDataFrameGlobalAggregationResult<
        AnalyticSourceColumns,
        {accepted: 'count'; totalDistance: {sum: 'distance'}; averageCategory: {mean: 'category'}}
      >
    >().toEqualTypeOf<{
      accepted: 'uint32';
      totalDistance: 'sint32';
      averageCategory: 'float32';
    }>();

    source.destroy();
    fixture.table.destroy();
  });

  test('retains immutable source filters, interaction parameters, derived columns, and empty batches', () => {
    for (const batchLengths of [[], [0], [2, 0, 3]] as const) {
      const fixture = createAnalyticSourceFixture(batchLengths, {nullableFare: true});
      const source = new LuDataFrame({table: fixture.table});
      const filtered = source
        .filter(column('fare').greaterThan(parameter('minimumFare', 10)))
        .select(['fare', 'distance']);
      const adjusted = filtered.withColumn('adjustedFare', column('fare').add(literal(2)));
      const reduced = adjusted.aggregate({
        accepted: 'count',
        averageAdjustedFare: {mean: 'adjustedFare'}
      });

      expect(reduced.query.predicates[0]).toBe(filtered.predicates[0]);
      expect(reduced.query.derivedColumns.map(({name}) => name)).toEqual(['adjustedFare']);
      expect(reduced.query.source.batches.map(batch => batch.numRows)).toEqual(batchLengths);
      expect(reduced.query.source.validity.fare).toBeUndefined();
      expect(filtered.columnNames).toEqual(['fare', 'distance']);

      source.destroy();
      fixture.table.destroy();
    }
  });

  test('rejects empty operations, hidden metrics, unsupported formats, and invalid operation shapes', () => {
    const fixture = createAnalyticSourceFixture([2]);
    const source = new LuDataFrame({table: fixture.table});
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');

    expect(() => source.aggregate({})).toThrow(/aggregation|reduction/i);
    expect(() => source.aggregate({'': 'count'})).toThrow(/name/i);
    expect(() =>
      // @ts-expect-error Global statistics require scalar, not vector-valued, columns.
      source.aggregate({invalid: {sum: 'coordinates'}})
    ).toThrow(/scalar|column/i);
    expect(() =>
      // @ts-expect-error Global statistics require an existing source metric column.
      source.aggregate({invalid: {sum: 'missing'}})
    ).toThrow(/selected|column/i);
    const selected = source.filter(column('fare').greaterThan(literal(0))).select(['fare']);
    expect(() =>
      // @ts-expect-error Global reductions cannot consume hidden projected columns.
      selected.aggregate({invalid: {sum: 'distance'}})
    ).toThrow(/selected|column/i);

    const unsupported = {
      broken: {median: 'fare'}
    } as unknown as LuDataFrameGlobalAggregationDefinitions<AnalyticSourceColumns>;
    expect(() => source.aggregate(unsupported)).toThrow(/operation/i);
    const multiple = {
      broken: {sum: 'fare', max: 'fare'}
    } as unknown as LuDataFrameGlobalAggregationDefinitions<AnalyticSourceColumns>;
    expect(() => source.aggregate(multiple)).toThrow(/one|operation/i);
    expect(createBuffer).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    source.destroy();
    fixture.table.destroy();
  });
});

describe('LuDataFrame immutable explicit-domain histogram planning', () => {
  test('deep-clones explicit domains and edges without allocating or retaining GPU resources', () => {
    const fixture = createAnalyticSourceFixture([2, 0, 3]);
    const source = new LuDataFrame({table: fixture.table, ownership: 'owned'});
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoder = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submit = vi.spyOn(fixture.device, 'submit');
    const mutableDomain: [number, number] = [0, 80];
    const mutableEdges = [0, 15, 25, 40, 100];

    const uniform = source.histogram('fare', {bins: 4, domain: mutableDomain});
    const irregular = source.histogram('fare', {edges: mutableEdges});
    mutableDomain[0] = 10;
    mutableEdges[1] = 20;

    expect(uniform).toBeInstanceOf(LuDataFrameHistogramQuery);
    expect(irregular).toBeInstanceOf(LuDataFrameHistogramQuery);
    expect(uniform.column).toBe('fare');
    expect(uniform.binCount).toBe(4);
    expect(uniform.options).toEqual({bins: 4, domain: [0, 80]});
    expect(irregular.binCount).toBe(4);
    expect(irregular.options).toEqual({edges: [0, 15, 25, 40, 100]});
    expect(Object.isFrozen(uniform)).toBe(true);
    expect(Object.isFrozen(uniform.options)).toBe(true);
    expect(Object.isFrozen('domain' in uniform.options ? uniform.options.domain : undefined)).toBe(
      true
    );
    expect(Object.isFrozen(irregular.options)).toBe(true);
    expect(
      Object.isFrozen('edges' in irregular.options ? irregular.options.edges : undefined)
    ).toBe(true);
    expect(createBuffer).not.toHaveBeenCalled();
    expect(createCommandEncoder).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();

    source.destroy();
    expect(fixture.buffers.every(buffer => buffer.destroyed)).toBe(true);

    createBuffer.mockRestore();
    createCommandEncoder.mockRestore();
    submit.mockRestore();
  });

  test('supports exact typed floating, signed, unsigned, filtered, and derived histogram columns', () => {
    const fixture = createAnalyticSourceFixture([2]);
    const source = new LuDataFrame({table: fixture.table});
    const floating = source.histogram('fare', {bins: 4, domain: [0, 80]});
    const signed = source.histogram('distance', {edges: [-10, 0, 10]});
    const unsigned = source.histogram('category', {bins: 3, domain: [0, 3]});
    const derived = source
      .filter(column('fare').greaterThan(parameter('minimumFare', 5)))
      .withColumn('doubleFare', column('fare').multiply(literal(2)))
      .histogram('doubleFare', {edges: [0, 20, 40, 80]});

    expectTypeOf(floating.compile).returns.toEqualTypeOf<CompiledLuDataFrameHistogram>();
    expect(floating.column).toBe('fare');
    expect(signed.column).toBe('distance');
    expect(unsigned.column).toBe('category');
    expect(derived.column).toBe('doubleFare');
    expect(derived.query.predicates).toHaveLength(1);
    expect(derived.query.derivedColumns.map(({name}) => name)).toEqual(['doubleFare']);

    source.destroy();
    fixture.table.destroy();
  });

  test('rejects absent domains, invalid counts, nonrepresentable boundaries, and ambiguous options', () => {
    const fixture = createAnalyticSourceFixture([2]);
    const source = new LuDataFrame({table: fixture.table});
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');

    expect(() =>
      // @ts-expect-error Histograms require a selected portable numeric scalar column.
      source.histogram('coordinates', {bins: 2, domain: [0, 1]})
    ).toThrow(/scalar|column/i);
    expect(() =>
      // @ts-expect-error Histogram input columns must exist in the selected schema.
      source.histogram('missing', {bins: 2, domain: [0, 1]})
    ).toThrow(/selected|column/i);

    for (const bins of [0, -1, 1.5, Number.NaN, 0x1_0000_0000]) {
      expect(() => source.histogram('fare', {bins, domain: [0, 1]})).toThrow(/bin|count/i);
    }
    expect(() => source.histogram('fare', {bins: 2, domain: [5, 1]})).toThrow(/domain|minimum/i);
    expect(() =>
      source.histogram('fare', {bins: 2, domain: [0, Number.POSITIVE_INFINITY]})
    ).toThrow(/finite|boundary/i);
    expect(() => source.histogram('category', {bins: 2, domain: [-1, 2]})).toThrow(/uint32/i);
    expect(() => source.histogram('distance', {bins: 2, domain: [-2, 2.5]})).toThrow(/sint32/i);
    expect(() => source.histogram('fare', {edges: [1]})).toThrow(/edge|257/i);
    expect(() => source.histogram('fare', {edges: [1, 1]})).toThrow(/increasing/i);
    expect(() => source.histogram('fare', {edges: [3, 2]})).toThrow(/increasing/i);
    expect(() =>
      source.histogram('fare', {edges: Array.from({length: 258}, (_, index) => index)})
    ).toThrow(/257|edge/i);
    expect(() => source.histogram('fare', {edges: [1, 1 + Number.EPSILON]})).toThrow(/increasing/i);
    expect(() => source.histogram('fare', {edges: [0, Number.POSITIVE_INFINITY]})).toThrow(
      /finite|boundary/i
    );

    const mixed = {bins: 2, domain: [0, 2], edges: [0, 1, 2]} as LuDataFrameHistogramOptions;
    expect(() => source.histogram('fare', mixed)).toThrow(/domain|combined/i);
    expect(createBuffer).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    source.destroy();
    fixture.table.destroy();
  });

  test('rejects new analytic plans after their source dataframe was explicitly destroyed', () => {
    const fixture = createAnalyticSourceFixture([2]);
    const source = new LuDataFrame({table: fixture.table});
    source.destroy();

    expect(() => source.aggregate({count: 'count'})).toThrow(/destroyed/i);
    expect(() => source.histogram('fare', {bins: 2, domain: [0, 1]})).toThrow(/destroyed/i);
    fixture.table.destroy();
  });
});

function createAnalyticSourceFixture(
  batchLengths: readonly number[],
  options: {nullableFare?: boolean} = {}
): AnalyticSourceFixture {
  const device = new NullDevice({id: 'ludf-analytic-reductions-node-device'});
  const buffers: Buffer[] = [];
  const fields: GPUField<keyof AnalyticSourceColumns>[] = [
    {name: 'fare', format: 'float32', nullable: options.nullableFare ?? false},
    {name: 'distance', format: 'sint32', nullable: false},
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

    return new GPURecordBatch<AnalyticSourceColumns>({
      gpuData: {
        fare: makeAnalyticSourceData(device, buffers, length, 'float32'),
        distance: makeAnalyticSourceData(device, buffers, length, 'sint32'),
        category: makeAnalyticSourceData(device, buffers, length, 'uint32'),
        coordinates: makeAnalyticSourceData(device, buffers, length, 'float32x2')
      },
      fields,
      numRows: length,
      sourceInfo
    });
  });

  const table =
    batches.length > 0
      ? new GPUTable<AnalyticSourceColumns>({batches})
      : new GPUTable<AnalyticSourceColumns>({
          schema: {fields, metadata: new Map()},
          bufferLayout: [
            {name: 'fare', format: 'float32'},
            {name: 'distance', format: 'sint32'},
            {name: 'category', format: 'uint32'},
            {name: 'coordinates', format: 'float32x2'}
          ]
        });
  return {device, table, buffers};
}

function makeAnalyticSourceData<Format extends AnalyticSourceColumns[keyof AnalyticSourceColumns]>(
  device: NullDevice,
  buffers: Buffer[],
  length: number,
  format: Format
): GPUData<Format> {
  const byteStride = format === 'float32x2' ? 8 : Uint32Array.BYTES_PER_ELEMENT;
  const buffer = device.createBuffer({
    byteLength: Math.max(length, 1) * byteStride,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  buffers.push(buffer);
  return new GPUData({buffer, format, length, ownsBuffer: true});
}
