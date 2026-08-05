// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  column,
  literal,
  LuDataFrame,
  LuDataFrameQuery,
  parameter,
  type LuDataFrameDerivedColumnFormatForExpression
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

type DerivedSourceColumns = {fare: 'float32'; category: 'uint32'; distance: 'sint32'};

type DerivedSourceFixture = {
  device: NullDevice;
  table: GPUTable<DerivedSourceColumns>;
  buffers: Buffer[];
};

describe('LuDataFrame immutable derived-column planning', () => {
  test('plans chained derived fields without allocating GPU storage or retaining source leases', () => {
    const fixture = createDerivedSourceFixture([2, 0, 3]);
    const source = new LuDataFrame({table: fixture.table, ownership: 'owned'});
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');
    const createCommandEncoder = vi.spyOn(fixture.device, 'createCommandEncoder');
    const submit = vi.spyOn(fixture.device, 'submit');
    const tableSelect = vi.spyOn(fixture.table, 'select');

    const adjusted = source.withColumn(
      'adjustedFare',
      column('fare').add(parameter('adjustment', 2))
    );
    const scaled = adjusted.withColumn('scaledFare', column('adjustedFare').multiply(literal(3)));
    const filtered = scaled
      .filter(column('scaledFare').greaterThan(literal(10)))
      .select(['scaledFare', 'category']);

    expect(adjusted).toBeInstanceOf(LuDataFrameQuery);
    expect(adjusted.source).toBe(source);
    expect(adjusted.columnNames).toEqual(['fare', 'category', 'distance', 'adjustedFare']);
    expect(scaled.columnNames).toEqual([
      'fare',
      'category',
      'distance',
      'adjustedFare',
      'scaledFare'
    ]);
    expect(filtered.columnNames).toEqual(['scaledFare', 'category']);
    expect(filtered.derivedColumns.map(({name}) => name)).toEqual(['adjustedFare', 'scaledFare']);
    expect(filtered.predicates).toHaveLength(1);
    expect(Object.isFrozen(adjusted)).toBe(true);
    expect(Object.isFrozen(adjusted.derivedColumns)).toBe(true);
    expect(Object.isFrozen(adjusted.derivedColumns[0])).toBe(true);
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

  test('preserves sibling plans, hidden dependency chains, and source-filter inputs', () => {
    const fixture = createDerivedSourceFixture([2, 0, 3]);
    const source = new LuDataFrame({table: fixture.table});
    const filteredSource = source.filter(column('fare').greaterThan(literal(2)));
    const adjusted = filteredSource.withColumn('adjustedFare', column('fare').add(literal(1)));
    const doubled = adjusted.withColumn('doubledFare', column('adjustedFare').multiply(literal(2)));
    const adjustedOnly = adjusted.select(['adjustedFare']);
    const doubledOnly = doubled.select(['doubledFare']);
    const final = doubledOnly.filter(column('doubledFare').lessThan(literal(100)));

    expect(filteredSource.derivedColumns).toEqual([]);
    expect(adjusted.derivedColumns.map(({name}) => name)).toEqual(['adjustedFare']);
    expect(adjustedOnly.columnNames).toEqual(['adjustedFare']);
    expect(doubledOnly.columnNames).toEqual(['doubledFare']);
    expect(final.derivedColumns.map(({name}) => name)).toEqual(['adjustedFare', 'doubledFare']);
    expect(final.predicates).toHaveLength(2);
    expect(final.predicates[0]).toBe(filteredSource.predicates[0]);
    expect(source.columnNames).toEqual(['fare', 'category', 'distance']);
    expect(source.batches.map(batch => batch.numRows)).toEqual([2, 0, 3]);

    source.destroy();
    fixture.table.destroy();
  });

  test('retains precise source and derived scalar formats across typed chained projections', () => {
    const fixture = createDerivedSourceFixture([2]);
    const source = new LuDataFrame({table: fixture.table});
    const floating = source.withColumn('adjustedFare', column('fare').add(literal(1)));
    const signed = source.withColumn('shiftedDistance', column('distance').subtract(literal(2)));
    const unsigned = source.withColumn('nextCategory', column('category').add(literal(1)), {
      format: 'uint32'
    });
    const scalar = source.withColumn('constantValue', literal(4));
    const chained = floating
      .withColumn('doubledFare', column('adjustedFare').multiply(literal(2)))
      .select(['doubledFare', 'category']);

    expectTypeOf(floating).toEqualTypeOf<
      LuDataFrameQuery<
        DerivedSourceColumns & Record<'adjustedFare', 'float32'>,
        keyof DerivedSourceColumns | 'adjustedFare',
        DerivedSourceColumns
      >
    >();
    expectTypeOf(signed).toEqualTypeOf<
      LuDataFrameQuery<
        DerivedSourceColumns & Record<'shiftedDistance', 'sint32'>,
        keyof DerivedSourceColumns | 'shiftedDistance',
        DerivedSourceColumns
      >
    >();
    expectTypeOf(unsigned).toEqualTypeOf<
      LuDataFrameQuery<
        DerivedSourceColumns & Record<'nextCategory', 'uint32'>,
        keyof DerivedSourceColumns | 'nextCategory',
        DerivedSourceColumns
      >
    >();
    expectTypeOf(scalar).toEqualTypeOf<
      LuDataFrameQuery<
        DerivedSourceColumns & Record<'constantValue', 'float32'>,
        keyof DerivedSourceColumns | 'constantValue',
        DerivedSourceColumns
      >
    >();
    expectTypeOf(chained).toEqualTypeOf<
      LuDataFrameQuery<
        DerivedSourceColumns & Record<'adjustedFare', 'float32'> & Record<'doubledFare', 'float32'>,
        'doubledFare' | 'category',
        DerivedSourceColumns
      >
    >();
    expectTypeOf<
      LuDataFrameDerivedColumnFormatForExpression<DerivedSourceColumns, 'distance'>
    >().toEqualTypeOf<'sint32'>();

    expect(chained.columnNames).toEqual(['doubledFare', 'category']);

    source.destroy();
    fixture.table.destroy();
  });

  test('rejects unknown, hidden, repeated, nonnumeric, and format-incompatible definitions', () => {
    const fixture = createDerivedSourceFixture([2]);
    const source = new LuDataFrame({table: fixture.table});
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');
    const derived = source.withColumn('adjustedFare', column('fare').add(literal(1)));
    const selected = derived.select(['adjustedFare']);

    expect(() =>
      // @ts-expect-error Derived expressions reject references outside the source schema.
      source.withColumn('unknownValue', column('missing').add(literal(1)))
    ).toThrow(/column|exist|missing/i);
    expect(() =>
      // @ts-expect-error Projected query expressions reject hidden source-column references.
      selected.withColumn('hiddenFare', column('fare').add(literal(1)))
    ).toThrow(/column|selected|exist/i);
    expect(() => source.withColumn('fare', column('fare').add(literal(1)))).toThrow(/exist/i);
    expect(() => derived.withColumn('adjustedFare', column('fare').add(literal(1)))).toThrow(
      /exist/i
    );
    expect(() => source.withColumn('', column('fare').add(literal(1)))).toThrow(/name|nonempty/i);
    expect(() =>
      // @ts-expect-error Derived dataframe columns require numerical expression values.
      source.withColumn('invalidBoolean', column('fare').greaterThan(literal(1)))
    ).toThrow(/numeric/i);
    expect(() =>
      source.withColumn('invalidFormat', column('fare').add(literal(1)), {format: 'uint32'})
    ).toThrow(/format|match/i);
    expect(() => source.withColumn('mixedFormats', column('fare').add(column('distance')))).toThrow(
      /format|mix/i
    );
    expect(createBuffer).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    source.destroy();
    fixture.table.destroy();
  });

  test('infers canonical vector formats when optional schema-field formats are omitted', () => {
    const fixture = createDerivedSourceFixture([2]);
    const source = new LuDataFrame({table: fixture.table});
    for (const field of fixture.table.schema.fields) {
      if (field.name === 'distance' || field.name === 'category') {
        delete field.format;
      }
    }

    const signed = source.withColumn('shiftedDistance', column('distance').subtract(literal(2)), {
      format: 'sint32'
    });
    const unsigned = source.withColumn('nextCategory', column('category').add(literal(1)), {
      format: 'uint32'
    });

    expect(signed.derivedColumns[0].format).toBe('sint32');
    expect(unsigned.derivedColumns[0].format).toBe('uint32');
    expect(fixture.table.gpuVectors.distance.format).toBe('sint32');
    expect(fixture.table.gpuVectors.category.format).toBe('uint32');

    source.destroy();
    fixture.table.destroy();
  });

  test('preserves explicit nullable metadata and empty source batch topology during planning', () => {
    for (const batchLengths of [[], [0], [0, 0]] as const) {
      const fixture = createDerivedSourceFixture(batchLengths, {nullableFare: true});
      const source = new LuDataFrame({table: fixture.table});
      const adjusted = source.withColumn('adjustedFare', column('fare').add(literal(1)));
      const projected = adjusted.select(['adjustedFare']);

      expect(projected.columnNames).toEqual(['adjustedFare']);
      expect(projected.source.batches.map(batch => batch.numRows)).toEqual(batchLengths);
      expect(projected.source.schema.fields.find(field => field.name === 'fare')?.nullable).toBe(
        true
      );
      expect(projected.source.validity.fare).toBeUndefined();
      expect(projected.derivedColumns[0].expression.node.kind).toBe('binary');

      source.destroy();
      fixture.table.destroy();
    }
  });

  test('rejects new derived plans after the source dataframe was destroyed', () => {
    const fixture = createDerivedSourceFixture([2]);
    const source = new LuDataFrame({table: fixture.table});
    source.destroy();

    expect(() => source.withColumn('adjustedFare', column('fare').add(literal(1)))).toThrow(
      /destroyed/i
    );
    fixture.table.destroy();
  });
});

function createDerivedSourceFixture(
  batchLengths: readonly number[],
  options: {nullableFare?: boolean} = {}
): DerivedSourceFixture {
  const device = new NullDevice({id: 'ludf-derived-node-device'});
  const buffers: Buffer[] = [];
  const fields: GPUField<keyof DerivedSourceColumns>[] = [
    {name: 'fare', format: 'float32', nullable: options.nullableFare ?? false},
    {name: 'category', format: 'uint32', nullable: false},
    {name: 'distance', format: 'sint32', nullable: false}
  ];
  let sourceRowIndexOffset = 40;
  const batches = batchLengths.map((length, sourceBatchIndex) => {
    const sourceInfo: GPURecordBatchSourceInfo = {
      sourceBatchIndex,
      sourceRowIndexOffset,
      sourceRowCount: length
    };
    sourceRowIndexOffset += length;

    return new GPURecordBatch<DerivedSourceColumns>({
      gpuData: {
        fare: makeDerivedSourceData(device, buffers, length, 'float32'),
        category: makeDerivedSourceData(device, buffers, length, 'uint32'),
        distance: makeDerivedSourceData(device, buffers, length, 'sint32')
      },
      fields,
      numRows: length,
      sourceInfo
    });
  });

  const table =
    batches.length > 0
      ? new GPUTable<DerivedSourceColumns>({batches})
      : new GPUTable<DerivedSourceColumns>({
          schema: {fields, metadata: new Map()},
          bufferLayout: [
            {name: 'fare', format: 'float32'},
            {name: 'category', format: 'uint32'},
            {name: 'distance', format: 'sint32'}
          ]
        });
  return {device, table, buffers};
}

function makeDerivedSourceData<Format extends DerivedSourceColumns[keyof DerivedSourceColumns]>(
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
