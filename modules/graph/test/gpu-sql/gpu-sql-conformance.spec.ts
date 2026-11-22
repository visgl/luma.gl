// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {
  makeArrowTableFromGPUAnalyticsTable,
  makeGPUAnalyticsTableFromArrowTable
} from '@luma.gl/graph/arrow';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {CompiledGPUDataFrameGlobalSort, GPUDataFrame} from '@luma.gl/graph/gpu-dataframe';
import {GPUSQLContext} from '@luma.gl/graph/gpu-sql';
import {ABS, ACOS, ASIN, LN, LOG10, ROUND, SQRT} from '@math.gl/sql/math-functions';
import {queryArrowSQL} from '@math.gl/sql/query';
import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';

/** Shared source rows, including equal sort keys in different batches. */
const samples = new arrow.Table([
  ...makeSamples([1, 2, 3], [null, -2.5, -0.75]).batches,
  ...makeSamples([4, 5, 6], [1.5, 3.75, 1.5]).batches
]);

/** Queries with independently specified expectations for the shared SQL subset. */
const queries = [
  {
    name: 'IN keeps matches when the list contains null',
    sql: 'SELECT id FROM samples WHERE score IN (-2.5, 1.5, NULL)',
    expectedIdentifiers: [2, 4, 6]
  },
  {
    name: 'NOT IN excludes unknown results',
    sql: 'SELECT id FROM samples WHERE score NOT IN (1.5, NULL)',
    expectedIdentifiers: []
  },
  {
    name: 'CASE uses parameter defaults and preserves null output',
    sql: 'SELECT id, CASE WHEN score > :threshold THEN ROUND(score) ELSE NULL END AS result FROM samples',
    expectedIdentifiers: [1, 2, 3, 4, 5, 6],
    expectedValues: [null, null, null, 2, 4, 2]
  },
  {
    name: 'COALESCE fills a null with a named parameter',
    sql: 'SELECT id, COALESCE(score, :fallback) AS result FROM samples',
    expectedIdentifiers: [1, 2, 3, 4, 5, 6],
    expectedValues: [99, -2.5, -0.75, 1.5, 3.75, 1.5]
  },
  {
    name: 'integer CAST truncates toward zero on in-range inputs',
    sql: 'SELECT id, CAST(score AS INTEGER) AS result FROM samples',
    expectedIdentifiers: [1, 2, 3, 4, 5, 6],
    expectedValues: [null, -2, 0, 1, 3, 1]
  },
  {
    name: 'ordered pagination retains stable ties across batches',
    sql: 'SELECT id, ABS(score) AS result FROM samples ORDER BY result DESC NULLS LAST LIMIT 3 OFFSET 1',
    expectedIdentifiers: [2, 4, 6],
    expectedValues: [2.5, 1.5, 1.5]
  }
];

test.each(queries)('$name', async ({sql, expectedIdentifiers, expectedValues}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const parameters = {threshold: 0, fallback: 99};
  const expected = queryArrowSQL(sql, new Map([['samples', samples]]), {
    parameters,
    functions: [ABS, ROUND]
  });
  const actual = await executeGPUQuery(device, samples, sql, parameters);

  expect(Array.from(expected.getChild('id') ?? [])).toEqual(expectedIdentifiers);
  if (expectedValues) {
    expect(Array.from(expected.getChild('result') ?? [])).toEqual(expectedValues);
  }
  expect(actual.schema.fields.map(field => [field.name, String(field.type)])).toEqual(
    expected.schema.fields.map(field => [field.name, String(field.type)])
  );
  for (const field of expected.schema.fields) {
    expect(Array.from(actual.getChild(field.name) ?? [])).toEqual(
      Array.from(expected.getChild(field.name) ?? [])
    );
  }
});

test('GPU integer casts saturate where Arrow SQL reports overflow', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const input = makeSamples([1, 2, 3], [4294967296, -1.5, null]);
  const sql = 'SELECT CAST(score AS UINT32) AS result FROM samples';

  expect(() => queryArrowSQL(sql, new Map([['samples', input]]))).toThrow(/overflow/i);
  const output = await executeGPUQuery(device, input, sql);
  expect(output.getChild('result')?.type).toBeInstanceOf(arrow.Uint32);
  expect(Array.from(output.getChild('result') ?? [])).toEqual([0xffffffff, 0, null]);
});

/** Float32 domains and finite values shared with math.gl Arrow. */
const domainFunctions = [
  {name: 'SQRT', implementation: SQRT, scores: [0, 4, -1, null]},
  {name: 'LN', implementation: LN, scores: [1, 4, 0, null]},
  {name: 'LOG10', implementation: LOG10, scores: [1, 100, -1, null]},
  {name: 'ASIN', implementation: ASIN, scores: [-1, 1, 2, null]},
  {name: 'ACOS', implementation: ACOS, scores: [-1, 1, -2, null]}
];

test.each(domainFunctions)('$name agrees on valid inputs and writes null for invalid rows', async ({
  name,
  implementation,
  scores
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const input = makeSamples([1, 2, 3, 4, 5, 6], [...scores, Infinity, NaN]);
  const projection = 'SELECT ' + name + '(score) AS result FROM samples';
  const catalog = new Map([['samples', input]]);
  const options = {functions: [implementation]};
  const reference = queryArrowSQL(projection + ' WHERE id <= 2', catalog, options);
  expect(() => queryArrowSQL(projection, catalog, options)).toThrow(/invalid argument/i);
  const output = await executeGPUQuery(device, input, projection);
  const result = output.getChild('result');
  expect(result?.type).toBeInstanceOf(arrow.Float32);
  for (const index of [0, 1]) {
    expect(result?.get(index)).toBeCloseTo(reference.getChild('result')?.get(index), 5);
  }
  expect(result?.get(2)).toBeNull();
  expect(result?.get(3)).toBeNull();
  expect(result?.get(4)).toBeNull();
  expect(result?.get(5)).toBeNull();
});

test('binds quoted dotted columns separately from table-qualified columns', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const input = arrow.tableFromArrays({
    'samples.score': Float32Array.of(9, 5, 2),
    score: Float32Array.of(3, 4, 8)
  });
  const output = await executeGPUQuery(
    device,
    input,
    'SELECT "samples.score", samples.score FROM samples WHERE samples."samples.score" > samples.score ORDER BY "samples.score"'
  );
  expect(Array.from(output.getChild('samples.score') ?? [])).toEqual([5, 9]);
  expect(Array.from(output.getChild('score') ?? [])).toEqual([4, 3]);
});

test('sorts by hidden source and computed keys without publishing either key', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const orderedQueries = [
    {clause: 'score DESC NULLS LAST', expectedIdentifiers: [4, 6, 3]},
    {clause: 'ABS(score) DESC NULLS LAST', expectedIdentifiers: [2, 4, 6]}
  ];
  for (const {clause, expectedIdentifiers} of orderedQueries) {
    const result = await executeGPUQuery(
      device,
      samples,
      'SELECT id FROM samples ORDER BY ' + clause + ' LIMIT 3 OFFSET 1'
    );
    expect(result.schema.fields.map(field => field.name)).toEqual(['id']);
    expect(Array.from(result.getChild('id') ?? [])).toEqual(expectedIdentifiers);
  }
});

/** Builds a native Arrow table with stable input types and nullable scores. */
function makeSamples(identifiers: number[], scores: (number | null)[]): arrow.Table {
  return arrow.tableFromArrays({
    id: Uint32Array.from(identifiers),
    score: arrow.vectorFromArray(scores, new arrow.Float32())
  });
}

/** Runs the GPU plan and reads back rows in the order exposed by that plan. */
async function executeGPUQuery(
  device: NonNullable<Awaited<ReturnType<typeof getWebGPUTestDevice>>>,
  table: arrow.Table,
  sql: string,
  parameters?: Record<string, number>
): Promise<arrow.Table> {
  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, table),
    ownership: 'owned'
  });
  try {
    const query = new GPUSQLContext({samples: frame}).query(sql, {parameters});
    const result = query.compile(new GPUCommandGraph(device, {id: 'sql-conformance'}));
    try {
      const encoder = device.createCommandEncoder();
      result.encode(encoder);
      device.submit(encoder.finish());
      const selection =
        result instanceof CompiledGPUDataFrameGlobalSort
          ? {
              globalRowIndices: result.globalRowIndices,
              globalSelectedCount: result.globalSelectedCount
            }
          : {rowIndices: result.rowIndices, selectedCounts: result.selectedCounts};
      return await makeArrowTableFromGPUAnalyticsTable({
        table: result.table,
        validity: result.validity,
        ...selection
      });
    } finally {
      result.destroy();
    }
  } finally {
    frame.destroy();
  }
}
