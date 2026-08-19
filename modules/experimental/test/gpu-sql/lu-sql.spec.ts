// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  makeArrowTableFromGPUAnalyticsTable,
  makeGPUAnalyticsTableFromArrowTable
} from '@luma.gl/arrow';
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  CompiledGPUDataFrameAggregation as CompiledLuDataFrameAggregation,
  CompiledGPUDataFrameGlobalSort as CompiledLuDataFrameGlobalSort,
  CompiledGPUDataFrameGroupedAggregation as CompiledLuDataFrameGroupedAggregation,
  CompiledGPUDataFrameJoin as CompiledLuDataFrameJoin,
  GPUDataFrame as LuDataFrame
} from '@luma.gl/experimental/gpu-dataframe';
import {LuSQLContext} from '@luma.gl/experimental/gpu-sql';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import test from 'test/utils/vitest-tape';

test('LuSQL executes Arrow filters, derived columns, global ordering, and selected Arrow output on WebGPU', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const frame = new LuDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createLuSQLArrowTable()),
    ownership: 'owned'
  });
  const context = new LuSQLContext({trips: frame});
  const filtered = context
    .query('SELECT fare, category FROM trips WHERE fare IS NOT NULL')
    .compile(new GPUCommandGraph(device, {id: 'ludf-sql-arrow-filter'}));
  const ordered = context
    .query(
      'SELECT fare, category, fare * 2 AS doubled FROM trips WHERE fare >= :minimum ORDER BY fare DESC LIMIT 2',
      {parameters: {minimum: 8}}
    )
    .compile(new GPUCommandGraph(device, {id: 'ludf-sql-arrow-global-sort'}));

  try {
    testContext.ok(ordered instanceof CompiledLuDataFrameGlobalSort);
    if (!(ordered instanceof CompiledLuDataFrameGlobalSort))
      throw new Error('Expected global SQL sort');
    const encoder = device.createCommandEncoder({id: 'ludf-sql-arrow-encode'});
    filtered.encode(encoder);
    ordered.encode(encoder, {minimum: 8});
    device.submit(encoder.finish());

    const filteredArrow = await makeArrowTableFromGPUAnalyticsTable({
      table: filtered.table,
      validity: filtered.validity,
      dictionaries: filtered.dictionaries,
      rowIndices: filtered.rowIndices,
      selectedCounts: filtered.selectedCounts
    });
    testContext.deepEqual(
      filteredArrow.batches.map(batch => batch.numRows),
      [1, 0, 3]
    );
    testContext.deepEqual(Array.from(filteredArrow.getChild('fare') ?? []), [8, 3, 10, 11]);
    testContext.deepEqual(Array.from(filteredArrow.getChild('category') ?? []), [
      'premium',
      'economy',
      'premium',
      'economy'
    ]);

    const orderedArrow = await makeArrowTableFromGPUAnalyticsTable({
      table: ordered.table,
      validity: ordered.validity,
      dictionaries: ordered.dictionaries,
      globalRowIndices: ordered.globalRowIndices,
      globalSelectedCount: ordered.globalSelectedCount
    });
    testContext.deepEqual(
      orderedArrow.batches.map(batch => batch.numRows),
      [2]
    );
    testContext.deepEqual(Array.from(orderedArrow.getChild('fare') ?? []), [11, 10]);
    testContext.deepEqual(Array.from(orderedArrow.getChild('doubled') ?? []), [22, 20]);
    testContext.deepEqual(Array.from(orderedArrow.getChild('category') ?? []), [
      'economy',
      'premium'
    ]);
  } finally {
    filtered.destroy();
    ordered.destroy();
    frame.destroy();
  }

  testContext.end();
});

test('LuSQL lowers global and dictionary GROUP BY aggregates into GPU tables and Arrow results', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const frame = new LuDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createLuSQLArrowTable()),
    ownership: 'owned'
  });
  const context = new LuSQLContext({trips: frame});
  const aggregate = context
    .query(
      'SELECT COUNT(*) AS rows, SUM(fare) AS total, AVG(fare) AS average FROM trips WHERE fare >= 8'
    )
    .compile(new GPUCommandGraph(device, {id: 'ludf-sql-arrow-aggregate'}));
  const grouped = context
    .query(
      'SELECT category, COUNT(*) AS count, SUM(fare) AS total FROM trips WHERE fare IS NOT NULL GROUP BY category'
    )
    .compile(new GPUCommandGraph(device, {id: 'ludf-sql-arrow-grouped'}));

  try {
    testContext.ok(aggregate instanceof CompiledLuDataFrameAggregation);
    testContext.ok(grouped instanceof CompiledLuDataFrameGroupedAggregation);
    const encoder = device.createCommandEncoder({id: 'ludf-sql-arrow-aggregate-encode'});
    aggregate.encode(encoder);
    grouped.encode(encoder);
    device.submit(encoder.finish());

    const aggregateArrow = await makeArrowTableFromGPUAnalyticsTable({
      table: aggregate.table,
      validity: aggregate.validity,
      dictionaries: aggregate.dictionaries
    });
    testContext.deepEqual(Array.from(aggregateArrow.getChild('rows') ?? []), [3]);
    testContext.deepEqual(Array.from(aggregateArrow.getChild('total') ?? []), [29]);
    testContext.ok(Math.abs(Number(aggregateArrow.getChild('average')?.get(0)) - 29 / 3) < 0.001);

    const groupedArrow = await makeArrowTableFromGPUAnalyticsTable({
      table: grouped.table,
      validity: grouped.validity,
      dictionaries: grouped.dictionaries
    });
    testContext.deepEqual(Array.from(groupedArrow.getChild('category') ?? []), [
      'economy',
      'premium'
    ]);
    testContext.deepEqual(Array.from(groupedArrow.getChild('count') ?? []), [2, 2]);
    testContext.deepEqual(Array.from(groupedArrow.getChild('total') ?? []), [14, 18]);
  } finally {
    aggregate.destroy();
    grouped.destroy();
    frame.destroy();
  }

  testContext.end();
});

test('LuSQL compiles left and anti joins over separately uploaded Arrow sources without repacking', async testContext => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testContext.comment('WebGPU is not available');
    testContext.end();
    return;
  }

  const left = new LuDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createLuSQLArrowTable()),
    ownership: 'owned'
  });
  const rightArrow = arrow.tableFromArrays({identifier: Uint32Array.of(20, 40)});
  const right = new LuDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, rightArrow),
    ownership: 'owned'
  });
  const context = new LuSQLContext({trips: left, accounts: right});
  const joined = context
    .query(
      'SELECT trips.identifier, trips.fare FROM trips LEFT JOIN accounts ON trips.identifier = accounts.identifier'
    )
    .compile(new GPUCommandGraph(device, {id: 'ludf-sql-arrow-left-join'}));
  const unmatched = context
    .query(
      'SELECT trips.identifier FROM trips ANTI JOIN accounts ON trips.identifier = accounts.identifier'
    )
    .compile(new GPUCommandGraph(device, {id: 'ludf-sql-arrow-anti-join'}));

  try {
    testContext.ok(joined instanceof CompiledLuDataFrameJoin);
    testContext.ok(unmatched instanceof CompiledLuDataFrameJoin);
    const encoder = device.createCommandEncoder({id: 'ludf-sql-arrow-joins'});
    joined.encode(encoder);
    unmatched.encode(encoder);
    device.submit(encoder.finish());

    const joinedArrow = await makeArrowTableFromGPUAnalyticsTable({
      table: joined.table,
      validity: joined.validity,
      dictionaries: joined.dictionaries,
      rowIndices: joined.rowIndices,
      selectedCounts: joined.selectedCounts
    });
    testContext.deepEqual(
      joinedArrow.batches.map(batch => batch.numRows),
      [2, 0, 3]
    );
    testContext.deepEqual(
      Array.from(joinedArrow.getChild('identifier') ?? []),
      [10, 20, 30, 40, 50]
    );

    const unmatchedArrow = await makeArrowTableFromGPUAnalyticsTable({
      table: unmatched.table,
      validity: unmatched.validity,
      dictionaries: unmatched.dictionaries,
      rowIndices: unmatched.rowIndices,
      selectedCounts: unmatched.selectedCounts
    });
    testContext.deepEqual(
      unmatchedArrow.batches.map(batch => batch.numRows),
      [1, 0, 2]
    );
    testContext.deepEqual(Array.from(unmatchedArrow.getChild('identifier') ?? []), [10, 30, 50]);
  } finally {
    joined.destroy();
    unmatched.destroy();
    left.destroy();
    right.destroy();
  }

  testContext.end();
});

function createLuSQLArrowTable(): arrow.Table {
  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Uint32(), 17, true);
  const dictionary = arrow.vectorFromArray(['economy', 'premium'], new arrow.Utf8());
  const fields = [
    new arrow.Field('identifier', new arrow.Uint32(), false),
    new arrow.Field('fare', new arrow.Float32(), true),
    new arrow.Field('category', dictionaryType, false)
  ];
  const schema = new arrow.Schema(fields, new Map([['dataset', 'sql-taxi']]));
  const identifiers = arrow.vectorFromArray(Uint32Array.of(10, 20, 30, 40, 50), new arrow.Uint32());
  const fares = arrow.vectorFromArray([null, 8, 3, 10, 11], new arrow.Float32());
  const categories = new arrow.Vector([
    arrow.makeData({
      type: dictionaryType,
      length: 5,
      data: Uint32Array.of(0, 1, 0, 1, 0),
      dictionary
    })
  ]);
  const batches = [
    [0, 2],
    [2, 2],
    [2, 5]
  ].map(
    ([start, end]) =>
      new arrow.RecordBatch(
        schema,
        arrow.makeData({
          type: new arrow.Struct(fields),
          length: end - start,
          children: [
            identifiers.slice(start, end).data[0],
            fares.slice(start, end).data[0],
            categories.slice(start, end).data[0]
          ]
        })
      )
  );
  return new arrow.Table(schema, batches);
}
