// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  and,
  column,
  literal,
  LuDataFrame,
  LuDataFrameQuery,
  parameter
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

type QueryColumns = {fare: 'float32'; category: 'uint32'; distance: 'sint32'};

type QueryFixture = {
  device: NullDevice;
  table: GPUTable<QueryColumns>;
  buffers: Buffer[];
  sourceInfo: GPURecordBatchSourceInfo[];
};

describe('LuDataFrame immutable filter planning', () => {
  test('plans filters and projections without creating GPU resources or retaining source leases', () => {
    const fixture = createQueryFixture([2, 0, 3]);
    const source = new LuDataFrame({table: fixture.table, ownership: 'owned'});
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoder = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submit = vi.spyOn(fixture.device, 'submit');
    const tableSelect = vi.spyOn(fixture.table, 'select');

    const query = source.filter(column('fare').greaterThan(parameter('minimumFare', 10)));
    const projected = query.select(['category']);
    const narrowed = projected.filter(column('category').equal(literal(2)));

    expect(query).toBeInstanceOf(LuDataFrameQuery);
    expect(query.source).toBe(source);
    expect(query.columnNames).toEqual(['fare', 'category', 'distance']);
    expect(projected.columnNames).toEqual(['category']);
    expect(narrowed.columnNames).toEqual(['category']);
    expect(query.predicates).toHaveLength(1);
    expect(projected.predicates).toHaveLength(1);
    expect(narrowed.predicates).toHaveLength(2);
    expect(projected.source.table).toBe(fixture.table);
    expect(source.sourceInfo).toEqual(fixture.sourceInfo);
    expect(Object.isFrozen(query)).toBe(true);
    expect(Object.isFrozen(query.predicates)).toBe(true);
    expect(Object.isFrozen(projected.selectedColumns)).toBe(true);
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

  test('preserves predicate inputs that are absent from the eventual output projection', () => {
    const fixture = createQueryFixture([2, 0, 3]);
    const source = new LuDataFrame({table: fixture.table});
    const farePredicate = column('fare').greaterThan(literal(10));
    const query = source.filter(farePredicate).select(['category']);

    expect(query.columnNames).toEqual(['category']);
    expect(query.source.columnNames).toEqual(['fare', 'category', 'distance']);
    expect(query.predicates[0]).toBe(farePredicate);
    expect(query.predicates[0].node).toEqual({
      kind: 'binary',
      operator: 'greater-than',
      left: {kind: 'column', name: 'fare'},
      right: {kind: 'literal', value: 10}
    });
    expectTypeOf(query).toEqualTypeOf<LuDataFrameQuery<QueryColumns, 'category'>>();

    source.destroy();
    fixture.table.destroy();
  });

  test('keeps sibling queries independent and preserves requested output-column ordering', () => {
    const fixture = createQueryFixture([2, 0, 3]);
    const source = new LuDataFrame({table: fixture.table});
    const initial = source.filter(column('fare').greaterThan(literal(1)));
    const categoryOnly = initial.select(['category']);
    const reordered = initial.select(['distance', 'fare']);
    const empty = initial.select([]);
    const furtherFiltered = reordered.filter(column('distance').lessThan(literal(9)));

    expect(initial.columnNames).toEqual(['fare', 'category', 'distance']);
    expect(categoryOnly.columnNames).toEqual(['category']);
    expect(reordered.columnNames).toEqual(['distance', 'fare']);
    expect(empty.columnNames).toEqual([]);
    expect(initial.predicates).toHaveLength(1);
    expect(reordered.predicates).toHaveLength(1);
    expect(furtherFiltered.predicates).toHaveLength(2);
    expect(source.columnNames).toEqual(['fare', 'category', 'distance']);

    source.destroy();
    fixture.table.destroy();
  });

  test('plans nullable predicates explicitly without treating missing sidecars as valid', () => {
    const fixture = createQueryFixture([2, 0, 3], {nullableFare: true});
    const source = new LuDataFrame({table: fixture.table});
    const query = source.filter(
      and(column('fare').greaterThan(literal(10)), column('fare').isValid())
    );

    expect(source.schema.fields.find(field => field.name === 'fare')?.nullable).toBe(true);
    expect(source.validity['fare']).toBeUndefined();
    expect(query.predicates[0].node.kind).toBe('binary');
    expect(source.batches.map(batch => batch.numRows)).toEqual([2, 0, 3]);

    source.destroy();
    fixture.table.destroy();
  });

  test('accepts explicit boolean literals and parameterized boolean predicates', () => {
    const fixture = createQueryFixture([2]);
    const source = new LuDataFrame({table: fixture.table});
    const alwaysAccepted = source.filter(literal(true));
    const interactionEnabled = source.filter(parameter('enabled', false));

    expect(alwaysAccepted.predicates[0].node).toEqual({kind: 'literal', value: true});
    expect(interactionEnabled.predicates[0].node).toEqual({
      kind: 'parameter',
      name: 'enabled',
      value: false
    });

    source.destroy();
    fixture.table.destroy();
  });

  test('rejects unknown, unavailable, duplicated, and nonboolean expressions before GPU work', () => {
    const fixture = createQueryFixture([2]);
    const source = new LuDataFrame({table: fixture.table});
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');

    expect(() =>
      // @ts-expect-error Typed dataframe filters reject columns outside their source schema.
      source.filter(column('missing').greaterThan(literal(1)))
    ).toThrow(/column|missing/i);
    expect(() =>
      // @ts-expect-error Typed dataframe filters require a boolean expression.
      source.filter(literal(3))
    ).toThrow(/boolean|filter/i);

    const query = source.filter(column('fare').greaterThan(literal(1))).select(['category']);
    expect(() =>
      // @ts-expect-error Query filters only reference currently selected columns.
      query.filter(column('fare').greaterThan(literal(2)))
    ).toThrow(/selected|column/i);
    expect(() =>
      // @ts-expect-error Query projections reject names outside the current projection.
      query.select(['fare'])
    ).toThrow(/column|exist/i);
    expect(() => query.select(['category', 'category'])).toThrow(/once|duplicate/i);
    expect(createBuffer).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    source.destroy();
    fixture.table.destroy();
  });

  test('rejects new filtering after the source dataframe was explicitly destroyed', () => {
    const fixture = createQueryFixture([2]);
    const source = new LuDataFrame({table: fixture.table});
    source.destroy();

    expect(() => source.filter(column('fare').isValid())).toThrow(/destroyed/i);
    fixture.table.destroy();
  });

  test('preserves typed schema-only and explicit empty-batch query plans', () => {
    for (const batchLengths of [[], [0]] as const) {
      const fixture = createQueryFixture(batchLengths);
      const source = new LuDataFrame({table: fixture.table});
      const query = source.filter(column('fare').isValid()).select(['category']);

      expect(query.columnNames).toEqual(['category']);
      expect(query.source.batches.map(batch => batch.numRows)).toEqual(batchLengths);
      expect(query.source.numRows).toBe(0);

      source.destroy();
      fixture.table.destroy();
    }
  });
});

function createQueryFixture(
  batchLengths: readonly number[],
  options: {nullableFare?: boolean} = {}
): QueryFixture {
  const device = new NullDevice({id: 'ludf-query-node-device'});
  const buffers: Buffer[] = [];
  const sourceInfo: GPURecordBatchSourceInfo[] = [];
  const fields: GPUField<keyof QueryColumns>[] = [
    {name: 'fare', format: 'float32', nullable: options.nullableFare ?? false},
    {name: 'category', format: 'uint32', nullable: false},
    {name: 'distance', format: 'sint32', nullable: false}
  ];
  let sourceRowIndexOffset = 40;
  const batches = batchLengths.map((length, sourceBatchIndex) => {
    const identity = {sourceBatchIndex, sourceRowIndexOffset, sourceRowCount: length};
    sourceInfo.push(identity);
    sourceRowIndexOffset += length;

    return new GPURecordBatch<QueryColumns>({
      gpuData: {
        fare: makeQueryData(device, buffers, length, 'float32'),
        category: makeQueryData(device, buffers, length, 'uint32'),
        distance: makeQueryData(device, buffers, length, 'sint32')
      },
      fields,
      numRows: length,
      sourceInfo: identity
    });
  });

  const table =
    batches.length > 0
      ? new GPUTable<QueryColumns>({batches})
      : new GPUTable<QueryColumns>({
          schema: {fields, metadata: new Map()},
          bufferLayout: [
            {name: 'fare', format: 'float32'},
            {name: 'category', format: 'uint32'},
            {name: 'distance', format: 'sint32'}
          ]
        });
  return {device, table, buffers, sourceInfo};
}

function makeQueryData<Format extends QueryColumns[keyof QueryColumns]>(
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
