// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  column,
  CompiledLuDataFrameJoin,
  CompiledLuDataFrameLookup,
  literal,
  LuDataFrame,
  LuDataFrameJoinQuery,
  LuDataFrameLookupQuery,
  parameter,
  type LuDataFrameJoinOptions,
  type LuDataFrameLookupOptions
} from '@luma.gl/experimental/ludf';
import {
  GPUConstant,
  GPUData,
  GPURecordBatch,
  GPUTable,
  type GPUField,
  type GPURecordBatchSourceInfo,
  type GPUTypeMap
} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, expectTypeOf, test, vi} from 'vitest';

type LeftJoinColumns = {
  key: 'uint32';
  amount: 'float32';
  signed: 'sint32';
};

type RightJoinColumns = {
  lookupKey: 'uint32';
  value: 'float32';
  signed: 'sint32';
};

type JoinSourceFixture<Columns extends GPUTypeMap> = {
  device: NullDevice;
  table: GPUTable<Columns>;
  buffers: Buffer[];
};

const LEFT_FIELDS: GPUField<keyof LeftJoinColumns>[] = [
  {name: 'key', format: 'uint32', nullable: false},
  {name: 'amount', format: 'float32', nullable: false},
  {name: 'signed', format: 'sint32', nullable: false}
];

const RIGHT_FIELDS: GPUField<keyof RightJoinColumns>[] = [
  {name: 'lookupKey', format: 'uint32', nullable: false},
  {name: 'value', format: 'float32', nullable: false},
  {name: 'signed', format: 'sint32', nullable: false}
];

describe('LuDataFrame immutable unique-right joins and bounded lookups', () => {
  test('plans mismatched preserved batch topologies without GPU work or source retention', () => {
    const leftFixture = createJoinSourceFixture('left', [3, 0, 5], LEFT_FIELDS, [100, 400, 800]);
    const rightFixture = createJoinSourceFixture('right', [2, 0, 3], RIGHT_FIELDS, [500, 750, 900]);
    const left = new LuDataFrame({table: leftFixture.table, ownership: 'owned'});
    const right = new LuDataFrame({table: rightFixture.table, ownership: 'owned'});
    const createLeftBuffer = vi.spyOn(leftFixture.device, 'createBuffer');
    const createRightBuffer = vi.spyOn(rightFixture.device, 'createBuffer');
    const submitLeft = vi.spyOn(leftFixture.device, 'submit');
    const submitRight = vi.spyOn(rightFixture.device, 'submit');
    const selectLeft = vi.spyOn(leftFixture.table, 'select');
    const selectRight = vi.spyOn(rightFixture.table, 'select');

    const joined = left.innerJoin(right, {leftOn: 'key', rightOn: 'lookupKey'});
    const lookup = left.lookup(right, {leftOn: 'key', rightOn: 'lookupKey'});

    expect(joined).toBeInstanceOf(LuDataFrameJoinQuery);
    expect(lookup).toBeInstanceOf(LuDataFrameLookupQuery);
    expect(joined.query.source).toBe(left);
    expect(joined.right).toBe(right);
    expect(joined.options).toEqual({
      leftOn: 'key',
      rightOn: 'lookupKey',
      indexCapacity: 16,
      maxProbeCount: 16
    });
    expect(lookup.options).toEqual(joined.options);
    expect(Object.isFrozen(joined)).toBe(true);
    expect(Object.isFrozen(joined.options)).toBe(true);
    expect(Object.isFrozen(lookup)).toBe(true);
    expect(Object.isFrozen(lookup.options)).toBe(true);
    expect(left.batches.map(batch => batch.numRows)).toEqual([3, 0, 5]);
    expect(right.batches.map(batch => batch.numRows)).toEqual([2, 0, 3]);
    expect(left.sourceInfo.map(info => info?.sourceRowIndexOffset)).toEqual([100, 400, 800]);
    expect(right.sourceInfo.map(info => info?.sourceRowIndexOffset)).toEqual([500, 750, 900]);
    expect(createLeftBuffer).not.toHaveBeenCalled();
    expect(createRightBuffer).not.toHaveBeenCalled();
    expect(submitLeft).not.toHaveBeenCalled();
    expect(submitRight).not.toHaveBeenCalled();
    expect(selectLeft).not.toHaveBeenCalled();
    expect(selectRight).not.toHaveBeenCalled();

    left.destroy();
    right.destroy();
    expect(leftFixture.buffers.every(buffer => buffer.destroyed)).toBe(true);
    expect(rightFixture.buffers.every(buffer => buffer.destroyed)).toBe(true);

    createLeftBuffer.mockRestore();
    createRightBuffer.mockRestore();
    submitLeft.mockRestore();
    submitRight.mockRestore();
    selectLeft.mockRestore();
    selectRight.mockRestore();
  });

  test('retains precise left/right schemas through filtered, projected, and derived join plans', () => {
    const leftFixture = createJoinSourceFixture('left', [3, 0, 5], LEFT_FIELDS);
    const rightFixture = createJoinSourceFixture('right', [2, 0, 3], RIGHT_FIELDS);
    const left = new LuDataFrame({table: leftFixture.table});
    const right = new LuDataFrame({table: rightFixture.table});
    const filtered = left
      .filter(column('amount').greaterThan(parameter('minimumAmount', 5)))
      .select(['key', 'amount']);
    const joined = filtered.innerJoin(right, {leftOn: 'key', rightOn: 'lookupKey', capacity: 2});
    const derived = left
      .withColumn('shiftedKey', column('key').add(literal(1)), {format: 'uint32'})
      .select(['shiftedKey', 'amount'])
      .lookup(right, {leftOn: 'shiftedKey', rightOn: 'lookupKey'});

    expect(joined.query.predicates[0]).toBe(filtered.predicates[0]);
    expect(joined.query.selectedColumns).toEqual(['key', 'amount']);
    expect(joined.options.capacity).toBe(2);
    expect(derived.query.derivedColumns.map(({name}) => name)).toEqual(['shiftedKey']);
    expectTypeOf(joined.compile).returns.toEqualTypeOf<
      CompiledLuDataFrameJoin<{key: 'uint32'; amount: 'float32'}, RightJoinColumns>
    >();
    expectTypeOf(derived.compile).returns.toEqualTypeOf<
      CompiledLuDataFrameLookup<{shiftedKey: 'uint32'; amount: 'float32'}, RightJoinColumns>
    >();

    left.destroy();
    right.destroy();
    leftFixture.table.destroy();
    rightFixture.table.destroy();
  });

  test('clones bounded options and safely clamps default cumulative hash probing', () => {
    const leftFixture = createJoinSourceFixture('left', [3], LEFT_FIELDS);
    const rightFixture = createJoinSourceFixture('right', [70_000], RIGHT_FIELDS);
    const left = new LuDataFrame({table: leftFixture.table});
    const right = new LuDataFrame({table: rightFixture.table});
    const mutableOptions: LuDataFrameJoinOptions<'key', 'lookupKey'> = {
      leftOn: 'key',
      rightOn: 'lookupKey',
      capacity: 0,
      indexCapacity: 262_144
    };

    const joined = left.innerJoin(right, mutableOptions);
    expect(joined.options.indexCapacity).toBe(262_144);
    expect(joined.options.maxProbeCount).toBe(Math.floor(0xffffffff / 70_000));
    expect(joined.options.capacity).toBe(0);
    expect(Object.isFrozen(joined.options)).toBe(true);

    const explicit = left.lookup(right, {
      leftOn: 'key',
      rightOn: 'lookupKey',
      indexCapacity: 131_072,
      maxProbeCount: 8
    });
    expect(explicit.options.maxProbeCount).toBe(8);

    left.destroy();
    right.destroy();
    leftFixture.table.destroy();
    rightFixture.table.destroy();
  });

  test('supports zero-row schema-only sources and independently empty preserved batches', () => {
    for (const [leftLengths, rightLengths] of [
      [[], []],
      [[0, 0], []],
      [[], [0, 0]],
      [
        [2, 0],
        [0, 3]
      ]
    ] as const) {
      const leftFixture = createJoinSourceFixture('left', leftLengths, LEFT_FIELDS);
      const rightFixture = createJoinSourceFixture('right', rightLengths, RIGHT_FIELDS);
      const left = new LuDataFrame({table: leftFixture.table});
      const right = new LuDataFrame({table: rightFixture.table});

      const joined = left.innerJoin(right, {leftOn: 'key', rightOn: 'lookupKey'});
      const lookup = left.lookup(right, {leftOn: 'key', rightOn: 'lookupKey'});

      expect(joined.query.source.batches.map(batch => batch.numRows)).toEqual(leftLengths);
      expect(joined.right.batches.map(batch => batch.numRows)).toEqual(rightLengths);
      expect(lookup.options.indexCapacity).toBe(right.numRows === 0 ? 1 : 8);

      left.destroy();
      right.destroy();
      leftFixture.table.destroy();
      rightFixture.table.destroy();
    }
  });

  test('rejects unknown, hidden, signed, floating, or constant keys without GPU allocation', () => {
    const leftFixture = createJoinSourceFixture('left', [3], LEFT_FIELDS);
    const rightFixture = createJoinSourceFixture('right', [2], RIGHT_FIELDS);
    const left = new LuDataFrame({table: leftFixture.table});
    const right = new LuDataFrame({table: rightFixture.table});
    const createBuffer = vi.spyOn(leftFixture.device, 'createBuffer');

    expect(() =>
      // @ts-expect-error Join keys must be selected unsigned 32-bit scalar columns.
      left.innerJoin(right, {leftOn: 'amount', rightOn: 'lookupKey'})
    ).toThrow(/uint32/i);
    expect(() =>
      // @ts-expect-error Right join keys must be unsigned 32-bit scalar columns.
      left.lookup(right, {leftOn: 'key', rightOn: 'signed'})
    ).toThrow(/uint32/i);
    expect(() =>
      // @ts-expect-error Right join keys must exist in the right schema.
      left.innerJoin(right, {leftOn: 'key', rightOn: 'missing'})
    ).toThrow(/right|exist/i);
    const selected = left.filter(column('amount').greaterThan(literal(0))).select(['amount']);
    expect(() =>
      // @ts-expect-error Projected-away source keys cannot participate in joins.
      selected.innerJoin(right, {leftOn: 'key', rightOn: 'lookupKey'})
    ).toThrow(/selected/i);

    const constant = new GPUConstant({format: 'uint32', value: Uint32Array.of(7)});
    const constantLeftTable = new GPUTable<LeftJoinColumns & {constantKey: 'uint32'}>({
      batches: leftFixture.table.batches,
      constants: {constantKey: constant}
    });
    const constantLeft = new LuDataFrame({table: constantLeftTable});
    expect(() =>
      constantLeft.innerJoin(right, {leftOn: 'constantKey', rightOn: 'lookupKey'})
    ).toThrow(/constant/i);

    const constantRightTable = new GPUTable<RightJoinColumns & {constantKey: 'uint32'}>({
      batches: rightFixture.table.batches,
      constants: {constantKey: constant}
    });
    const constantRight = new LuDataFrame({table: constantRightTable});
    expect(() => left.lookup(constantRight, {leftOn: 'key', rightOn: 'constantKey'})).toThrow(
      /constant/i
    );
    expect(createBuffer).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    constantLeft.destroy();
    constantRight.destroy();
    left.destroy();
    right.destroy();
    constantLeftTable.destroy();
    constantRightTable.destroy();
  });

  test('rejects incompatible dictionary labels, ordering, and one-sided categorical encoding', () => {
    const leftFixture = createJoinSourceFixture('left', [3], LEFT_FIELDS);
    const rightFixture = createJoinSourceFixture('right', [2], RIGHT_FIELDS);
    const left = new LuDataFrame({
      table: leftFixture.table,
      dictionaries: {key: {values: ['economy', 'premium'], ordered: true}}
    });
    const compatible = new LuDataFrame({
      table: rightFixture.table,
      dictionaries: {lookupKey: {values: ['economy', 'premium'], ordered: true}}
    });
    const reordered = new LuDataFrame({
      table: rightFixture.table,
      dictionaries: {lookupKey: {values: ['premium', 'economy'], ordered: true}}
    });
    const unordered = new LuDataFrame({
      table: rightFixture.table,
      dictionaries: {lookupKey: {values: ['economy', 'premium'], ordered: false}}
    });
    const raw = new LuDataFrame({table: rightFixture.table});

    expect(left.innerJoin(compatible, {leftOn: 'key', rightOn: 'lookupKey'})).toBeInstanceOf(
      LuDataFrameJoinQuery
    );
    expect(() => left.lookup(reordered, {leftOn: 'key', rightOn: 'lookupKey'})).toThrow(
      /dictionary|dictionaries|labels/i
    );
    expect(() => left.lookup(unordered, {leftOn: 'key', rightOn: 'lookupKey'})).toThrow(
      /dictionary|dictionaries|ordering/i
    );
    expect(() => left.innerJoin(raw, {leftOn: 'key', rightOn: 'lookupKey'})).toThrow(
      /dictionary|dictionaries|both/i
    );

    left.destroy();
    compatible.destroy();
    reordered.destroy();
    unordered.destroy();
    raw.destroy();
    leftFixture.table.destroy();
    rightFixture.table.destroy();
  });

  test('rejects unsafe index capacities, unbounded probes, and invalid per-batch output limits', () => {
    const leftFixture = createJoinSourceFixture('left', [3], LEFT_FIELDS);
    const rightFixture = createJoinSourceFixture('right', [2], RIGHT_FIELDS);
    const left = new LuDataFrame({table: leftFixture.table});
    const right = new LuDataFrame({table: rightFixture.table});
    const createBuffer = vi.spyOn(leftFixture.device, 'createBuffer');

    for (const indexCapacity of [0, -1, 3, 1.5, Number.NaN, 0x1_0000_0000]) {
      expect(() =>
        left.innerJoin(right, {leftOn: 'key', rightOn: 'lookupKey', indexCapacity})
      ).toThrow(/capacity|power/i);
    }
    for (const maxProbeCount of [0, -1, 1.5, Number.NaN, 9]) {
      expect(() =>
        left.lookup(right, {leftOn: 'key', rightOn: 'lookupKey', indexCapacity: 8, maxProbeCount})
      ).toThrow(/probe/i);
    }
    for (const capacity of [-1, 1.5, Number.NaN, 0x1_0000_0000]) {
      expect(() => left.innerJoin(right, {leftOn: 'key', rightOn: 'lookupKey', capacity})).toThrow(
        /capacity|uint32/i
      );
    }
    const lookupWithCapacity = {
      leftOn: 'key',
      rightOn: 'lookupKey',
      capacity: 1
    } as LuDataFrameLookupOptions<'key', 'lookupKey'>;
    expect(() => left.lookup(right, lookupWithCapacity)).toThrow(/capacity/i);
    expect(createBuffer).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    left.destroy();
    right.destroy();
    leftFixture.table.destroy();
    rightFixture.table.destroy();
  });

  test('rejects new join and lookup plans after the left dataframe was explicitly destroyed', () => {
    const leftFixture = createJoinSourceFixture('left', [3], LEFT_FIELDS);
    const rightFixture = createJoinSourceFixture('right', [2], RIGHT_FIELDS);
    const left = new LuDataFrame({table: leftFixture.table});
    const right = new LuDataFrame({table: rightFixture.table});
    left.destroy();

    expect(() => left.innerJoin(right, {leftOn: 'key', rightOn: 'lookupKey'})).toThrow(
      /destroyed/i
    );
    expect(() => left.lookup(right, {leftOn: 'key', rightOn: 'lookupKey'})).toThrow(/destroyed/i);

    right.destroy();
    leftFixture.table.destroy();
    rightFixture.table.destroy();
  });
});

function createJoinSourceFixture<Columns extends GPUTypeMap>(
  side: 'left' | 'right',
  batchLengths: readonly number[],
  fields: readonly GPUField<keyof Columns & string>[],
  sourceOffsets?: readonly number[]
): JoinSourceFixture<Columns> {
  const device = new NullDevice({id: `ludf-${side}-join-node-device`});
  const buffers: Buffer[] = [];
  let defaultOffset = side === 'left' ? 100 : 500;
  const batches = batchLengths.map((length, sourceBatchIndex) => {
    const sourceInfo: GPURecordBatchSourceInfo = {
      sourceBatchIndex,
      sourceRowIndexOffset: sourceOffsets?.[sourceBatchIndex] ?? defaultOffset,
      sourceRowCount: length
    };
    defaultOffset += length;
    const gpuData: Record<string, GPUData> = {};
    for (const field of fields) {
      const format = field.format;
      if (format !== 'float32' && format !== 'sint32' && format !== 'uint32') {
        throw new Error('Join fixtures require scalar formats');
      }
      const buffer = device.createBuffer({
        byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      });
      buffers.push(buffer);
      gpuData[field.name] = new GPUData({buffer, format, length, ownsBuffer: true});
    }
    return new GPURecordBatch<Columns>({
      gpuData,
      fields: [...fields],
      numRows: length,
      sourceInfo
    });
  });

  const table =
    batches.length > 0
      ? new GPUTable<Columns>({batches})
      : new GPUTable<Columns>({
          schema: {fields: [...fields], metadata: new Map()}
        });
  return {device, table, buffers};
}
