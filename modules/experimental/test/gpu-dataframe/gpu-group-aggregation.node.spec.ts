// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  column,
  CompiledGPUDataFrameGroupedAggregation,
  literal,
  GPUDataFrame,
  GPUDataFrameGroupByQuery,
  GPUDataFrameGroupedAggregationQuery,
  parameter,
  type GPUDataFrameAggregationDefinitions,
  type GPUDataFrameGroupedAggregationResult
} from '@luma.gl/experimental/gpu-dataframe';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {
  GPURecordBatch,
  GPUTable,
  type GPUField,
  type GPURecordBatchSourceInfo
} from '@luma.gl/experimental/gpu-tables';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, expectTypeOf, test, vi} from 'vitest';

type GroupSourceColumns = {
  category: 'uint32';
  fare: 'float32';
  distance: 'sint32';
  otherGroup: 'uint32';
};

type GroupSourceFixture = {
  device: NullDevice;
  table: GPUTable<GroupSourceColumns>;
  buffers: Buffer[];
};

const GROUP_LABELS = ['economy', 'standard', 'premium', 'unused'] as const;

describe('GPUDataFrame immutable dense grouped-aggregation planning', () => {
  test('plans all supported statistics without allocating GPU resources or retaining source leases', () => {
    const fixture = createGroupSourceFixture([2, 0, 3]);
    const source = new GPUDataFrame({
      table: fixture.table,
      dictionaries: {category: {values: GROUP_LABELS, ordered: true}},
      ownership: 'owned'
    });
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoder = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submit = vi.spyOn(fixture.device, 'submit');
    const tableSelect = vi.spyOn(fixture.table, 'select');

    const grouped = source.groupBy('category');
    const aggregated = grouped.aggregate({
      count: 'count',
      totalFare: {sum: 'fare'},
      minimumFare: {min: 'fare'},
      maximumFare: {max: 'fare'},
      averageFare: {mean: 'fare'}
    });

    expect(grouped).toBeInstanceOf(GPUDataFrameGroupByQuery);
    expect(aggregated).toBeInstanceOf(GPUDataFrameGroupedAggregationQuery);
    expect(grouped.key).toBe('category');
    expect(grouped.groupCount).toBe(4);
    expect(aggregated.key).toBe('category');
    expect(aggregated.groupCount).toBe(4);
    expect(aggregated.query.source).toBe(source);
    expect(aggregated.query.predicates).toEqual([]);
    expect(aggregated.definitions).toEqual([
      {name: 'count', operation: 'count'},
      {name: 'totalFare', operation: 'sum', column: 'fare'},
      {name: 'minimumFare', operation: 'min', column: 'fare'},
      {name: 'maximumFare', operation: 'max', column: 'fare'},
      {name: 'averageFare', operation: 'mean', column: 'fare'}
    ]);
    expect(Object.isFrozen(grouped)).toBe(true);
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

  test('preserves exact typed uint32 count and float32 statistic result formats', () => {
    const fixture = createGroupSourceFixture([2]);
    const source = new GPUDataFrame({
      table: fixture.table,
      dictionaries: {category: GROUP_LABELS}
    });
    const grouped = source.groupBy('category').aggregate({
      count: 'count',
      totalFare: {sum: 'fare'},
      minimumFare: {min: 'fare'},
      maximumFare: {max: 'fare'},
      averageFare: {mean: 'fare'}
    });

    expectTypeOf(grouped.compile).returns.toEqualTypeOf<
      CompiledGPUDataFrameGroupedAggregation<
        Record<'category', 'uint32'> & {
          count: 'uint32';
          totalFare: 'float32';
          minimumFare: 'float32';
          maximumFare: 'float32';
          averageFare: 'float32';
        }
      >
    >();
    expectTypeOf<
      GPUDataFrameGroupedAggregationResult<
        'category',
        {accepted: 'count'; averageFare: {mean: 'fare'}}
      >
    >().toEqualTypeOf<
      Record<'category', 'uint32'> & {accepted: 'uint32'; averageFare: 'float32'}
    >();

    source.destroy();
    fixture.table.destroy();
  });

  test('preserves immutable filtered, parameterized, projected, and derived source plans', () => {
    const fixture = createGroupSourceFixture([2, 0, 3]);
    const source = new GPUDataFrame({
      table: fixture.table,
      dictionaries: {category: GROUP_LABELS}
    });
    const filtered = source
      .filter(column('fare').greaterThan(parameter('minimumFare', 10)))
      .select(['category', 'fare']);
    const first = filtered.groupBy('category').aggregate({accepted: 'count'});
    const second = filtered.groupBy('category').aggregate({totalFare: {sum: 'fare'}});
    const derived = filtered
      .withColumn('adjustedFare', column('fare').add(literal(2)))
      .groupBy('category')
      .aggregate({averageAdjustedFare: {mean: 'adjustedFare'}});

    expect(first.definitions).toEqual([{name: 'accepted', operation: 'count'}]);
    expect(second.definitions).toEqual([{name: 'totalFare', operation: 'sum', column: 'fare'}]);
    expect(derived.definitions).toEqual([
      {name: 'averageAdjustedFare', operation: 'mean', column: 'adjustedFare'}
    ]);
    expect(derived.query.derivedColumns.map(({name}) => name)).toEqual(['adjustedFare']);
    expect(derived.query.predicates[0]).toBe(filtered.predicates[0]);
    expect(first.query.columnNames).toEqual(['category', 'fare']);
    expect(filtered.columnNames).toEqual(['category', 'fare']);
    expect(source.columnNames).toEqual(['category', 'fare', 'distance', 'otherGroup']);

    source.destroy();
    fixture.table.destroy();
  });

  test('infers dictionary domains and requires matching explicit unsigned group counts', () => {
    const fixture = createGroupSourceFixture([2]);
    const dictionarySource = new GPUDataFrame({
      table: fixture.table,
      dictionaries: {category: {values: GROUP_LABELS, ordered: false}}
    });
    const plainSource = new GPUDataFrame({table: fixture.table});

    expect(dictionarySource.groupBy('category').groupCount).toBe(4);
    expect(dictionarySource.groupBy('category', {groupCount: 4}).groupCount).toBe(4);
    expect(() => dictionarySource.groupBy('category', {groupCount: 3})).toThrow(
      /count|dictionary/i
    );
    expect(plainSource.groupBy('otherGroup', {groupCount: 3}).groupCount).toBe(3);
    expect(() => plainSource.groupBy('otherGroup')).toThrow(/count|positive/i);

    for (const groupCount of [0, -1, 1.5, Number.NaN, 0x1_0000_0000]) {
      expect(() => plainSource.groupBy('otherGroup', {groupCount})).toThrow(/count|positive/i);
    }

    dictionarySource.destroy();
    plainSource.destroy();
    fixture.table.destroy();
  });

  test('rejects unsupported keys, hidden inputs, invalid operations, and non-float32 metrics', () => {
    const fixture = createGroupSourceFixture([2]);
    const source = new GPUDataFrame({
      table: fixture.table,
      dictionaries: {category: GROUP_LABELS}
    });
    const grouped = source.groupBy('category');
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');

    expect(() =>
      // @ts-expect-error Dense grouping keys must have uint32 GPU storage.
      source.groupBy('fare', {groupCount: 2})
    ).toThrow(/key|uint32/i);
    expect(() =>
      // @ts-expect-error Dense grouping keys must exist in the selected source schema.
      source.groupBy('missing', {groupCount: 2})
    ).toThrow(/key|selected/i);
    expect(() =>
      source
        .filter(column('fare').greaterThan(literal(1)))
        .select(['fare'])
        // @ts-expect-error Group keys must remain selected in the current query projection.
        .groupBy('category')
    ).toThrow(/key|selected/i);
    expect(() => grouped.aggregate({})).toThrow(/aggregation/i);
    expect(() => grouped.aggregate({category: 'count'})).toThrow(/name|key/i);
    expect(() => grouped.aggregate({'': 'count'})).toThrow(/name|key/i);
    expect(() =>
      // @ts-expect-error Grouped numerical statistics require float32 metrics.
      grouped.aggregate({wrongType: {sum: 'distance'}})
    ).toThrow(/float32/i);
    expect(() =>
      // @ts-expect-error Grouped numerical metrics must be selected source fields.
      grouped.aggregate({missingMetric: {sum: 'missing'}})
    ).toThrow(/selected|column/i);
    const invalidOperation = {
      broken: {median: 'fare'}
    } as unknown as GPUDataFrameAggregationDefinitions<GroupSourceColumns>;
    expect(() => grouped.aggregate(invalidOperation)).toThrow(/operation/i);
    const multipleOperations = {
      broken: {sum: 'fare', max: 'fare'}
    } as unknown as GPUDataFrameAggregationDefinitions<GroupSourceColumns>;
    expect(() => grouped.aggregate(multipleOperations)).toThrow(/one|operation/i);
    expect(createBuffer).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    source.destroy();
    fixture.table.destroy();
  });

  test('preserves nullable metadata and schema-only or empty source batch plans', () => {
    for (const batchLengths of [[], [0], [2, 0, 3]] as const) {
      const fixture = createGroupSourceFixture(batchLengths, {nullable: true});
      const source = new GPUDataFrame({
        table: fixture.table,
        dictionaries: {category: GROUP_LABELS}
      });
      const grouped = source.groupBy('category').aggregate({totalFare: {sum: 'fare'}});

      expect(grouped.groupCount).toBe(4);
      expect(grouped.query.source.batches.map(batch => batch.numRows)).toEqual(batchLengths);
      expect(
        grouped.query.source.schema.fields.find(field => field.name === 'category')?.nullable
      ).toBe(true);
      expect(
        grouped.query.source.schema.fields.find(field => field.name === 'fare')?.nullable
      ).toBe(true);
      expect(grouped.query.source.validity.category).toBeUndefined();
      expect(grouped.query.source.validity.fare).toBeUndefined();

      source.destroy();
      fixture.table.destroy();
    }
  });

  test('rejects new group plans after the source dataframe was explicitly destroyed', () => {
    const fixture = createGroupSourceFixture([2]);
    const source = new GPUDataFrame({
      table: fixture.table,
      dictionaries: {category: GROUP_LABELS}
    });
    source.destroy();

    expect(() => source.groupBy('category')).toThrow(/destroyed/i);
    fixture.table.destroy();
  });
});

function createGroupSourceFixture(
  batchLengths: readonly number[],
  options: {nullable?: boolean} = {}
): GroupSourceFixture {
  const device = new NullDevice({id: 'gpu-dataframe-group-aggregation-node-device'});
  const buffers: Buffer[] = [];
  const fields: GPUField<keyof GroupSourceColumns>[] = [
    {name: 'category', format: 'uint32', nullable: options.nullable ?? false},
    {name: 'fare', format: 'float32', nullable: options.nullable ?? false},
    {name: 'distance', format: 'sint32', nullable: false},
    {name: 'otherGroup', format: 'uint32', nullable: false}
  ];
  let sourceRowIndexOffset = 40;
  const batches = batchLengths.map((length, sourceBatchIndex) => {
    const sourceInfo: GPURecordBatchSourceInfo = {
      sourceBatchIndex,
      sourceRowIndexOffset,
      sourceRowCount: length
    };
    sourceRowIndexOffset += length;

    return new GPURecordBatch<GroupSourceColumns>({
      gpuData: {
        category: makeGroupSourceData(device, buffers, length, 'uint32'),
        fare: makeGroupSourceData(device, buffers, length, 'float32'),
        distance: makeGroupSourceData(device, buffers, length, 'sint32'),
        otherGroup: makeGroupSourceData(device, buffers, length, 'uint32')
      },
      fields,
      numRows: length,
      sourceInfo
    });
  });

  const table =
    batches.length > 0
      ? new GPUTable<GroupSourceColumns>({batches})
      : new GPUTable<GroupSourceColumns>({
          schema: {fields, metadata: new Map()},
          bufferLayout: [
            {name: 'category', format: 'uint32'},
            {name: 'fare', format: 'float32'},
            {name: 'distance', format: 'sint32'},
            {name: 'otherGroup', format: 'uint32'}
          ]
        });
  return {device, table, buffers};
}

function makeGroupSourceData<Format extends GroupSourceColumns[keyof GroupSourceColumns]>(
  device: NullDevice,
  buffers: Buffer[],
  length: number,
  format: Format
): GPUData<Format> {
  const buffer = device.createBuffer({
    byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  buffers.push(buffer);
  return new GPUData({buffer, format, length, ownsBuffer: true});
}
