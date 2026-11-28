// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {
  makeArrowTableFromGPUAnalyticsTable,
  makeGPUAnalyticsTableFromArrowTable
} from '@luma.gl/graph/arrow';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {
  CompiledGPUDataFrameGlobalSort,
  CompiledGPUDataFrameGroupedAggregation,
  GPUDataFrame
} from '@luma.gl/graph/gpu-dataframe';
import {GPUSQLContext} from '@luma.gl/graph/gpu-sql';
import {
  ABS,
  ACOS,
  ASIN,
  ATAN,
  COS,
  EXP,
  LN,
  LOG10,
  ROUND,
  SIN,
  SQRT,
  TAN
} from '@math.gl/sql/math-functions';
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
    const actual = result?.get(index);
    expect(typeof actual).toBe('number');
    expect(Math.abs(actual - reference.getChild('result')?.get(index))).toBeLessThanOrEqual(
      tolerance
    );
  }
  expect(result?.get(2)).toBeNull();
  expect(result?.get(3)).toBeNull();
  expect(result?.get(4)).toBeNull();
  expect(result?.get(5)).toBeNull();
});

// WGSL allows 2^-11 absolute error for f32 sin/cos on [-pi, pi].
const trigTolerance = 2 ** -11 + 2 ** -24;
test.each([
  {name: 'SIN', implementation: SIN, tolerance: trigTolerance},
  {name: 'COS', implementation: COS, tolerance: trigTolerance},
  // tan inherits error from sin(x) / cos(x), bounded here for |x| <= 0.75.
  {name: 'TAN', implementation: TAN, tolerance: 0.0014},
  {name: 'ATAN', implementation: ATAN, tolerance: 0.000005},
  {name: 'EXP', implementation: EXP, tolerance: 0.000005}
])('$name matches math.gl Arrow on finite inputs and preserves nulls', async ({
  name,
  implementation,
  tolerance
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const input = makeSamples([1, 2, 3, 4, 5, 6], [-0.75, 0, 0.75, null, Infinity, NaN]);
  const sql = `SELECT ${name}(score) AS result FROM samples`;
  const reference = queryArrowSQL(sql + ' WHERE id <= 3', new Map([['samples', input]]), {
    functions: [implementation]
  });
  const result = (await executeGPUQuery(device, input, sql)).getChild('result');
  expect(result?.type).toBeInstanceOf(arrow.Float32);
  for (const index of [0, 1, 2]) {
    const actual = result?.get(index);
    expect(typeof actual).toBe('number');
    expect(Math.abs(actual - reference.getChild('result')?.get(index))).toBeLessThanOrEqual(
      tolerance
    );
  }
  expect(Array.from(result ?? []).slice(3)).toEqual([null, null, null]);
});

test('EXP returns null when its Float32 result would overflow', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const input = makeSamples([1, 2, 3, 4], [88, 88.72283935546875, 100, -105]);
  const output = await executeGPUQuery(device, input, 'SELECT EXP(score) AS result FROM samples');
  const result = output.getChild('result');
  expect(result?.get(0) / Math.exp(88)).toBeCloseTo(1, 5);
  expect(Array.from(result ?? []).slice(1)).toEqual([null, null, 0]);
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

test.each([
  'INNER',
  'LEFT'
] as const)('%s JOIN agrees with math.gl on right payloads, nulls, and joined arithmetic', async joinType => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const rightRows = makeSamples([5, 2, 4, 9], [null, 6, 3, 100]);
  const right = new arrow.Table([
    ...rightRows.slice(0, 1).batches,
    ...rightRows.slice(1, 4).batches
  ]);
  const sql = `SELECT l.id AS id, r.score AS right_score,
                        l.score + r.score AS combined
                 FROM samples AS l ${joinType} JOIN payloads AS r ON l.id = r.id`;
  const reference = queryArrowSQL(
    sql,
    new Map([
      ['samples', samples],
      ['payloads', right]
    ])
  );
  const actual = await executeGPUQuery(device, samples, sql, undefined, right);
  const rows = (table: arrow.Table) =>
    Array.from(table, row => [row.id, row.right_score, row.combined]);
  expect(rows(reference)).toEqual(
    joinType === 'INNER'
      ? [
          [2, 6, 3.5],
          [4, 3, 4.5],
          [5, null, null]
        ]
      : [
          [1, null, null],
          [2, 6, 3.5],
          [3, null, null],
          [4, 3, 4.5],
          [5, null, null],
          [6, null, null]
        ]
  );
  expect(rows(actual)).toEqual(rows(reference));
  expect(actual.schema.fields.map(field => [field.name, String(field.type)])).toEqual(
    reference.schema.fields.map(field => [field.name, String(field.type)])
  );
  expect(actual.batches.map(batch => batch.numRows)).toEqual(
    joinType === 'INNER' ? [1, 2] : [3, 3]
  );
});

test('GROUP BY agrees with math.gl on nullable keys and ordered pagination', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const sql = `SELECT score, COUNT(*) AS row_count, COUNT(score) AS known
               FROM samples GROUP BY score
               ORDER BY row_count DESC, score ASC NULLS LAST LIMIT 4 OFFSET 1`;
  const reference = queryArrowSQL(sql, new Map([['samples', samples]]));
  const actual = await executeGPUQuery(device, samples, sql);
  const rows = (table: arrow.Table) =>
    Array.from(table, row => [row.score, Number(row.row_count), Number(row.known)]);
  expect(rows(reference)).toEqual([
    [-2.5, 1, 1],
    [-0.75, 1, 1],
    [3.75, 1, 1],
    [null, 1, 0]
  ]);
  expect(rows(actual)).toEqual(rows(reference));
  expect(actual.schema.fields.map(field => field.name)).toEqual(
    reference.schema.fields.map(field => field.name)
  );
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
  parameters?: Record<string, number>,
  right?: arrow.Table
): Promise<arrow.Table> {
  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, table),
    ownership: 'owned'
  });
  let payloads: GPUDataFrame | undefined;
  try {
    if (right) {
      payloads = new GPUDataFrame({
        ...makeGPUAnalyticsTableFromArrowTable(device, right),
        ownership: 'owned'
      });
    }
    const query = new GPUSQLContext(payloads ? {samples: frame, payloads} : {samples: frame}).query(
      sql,
      {parameters}
    );
    const result = query.compile(new GPUCommandGraph(device, {id: 'sql-conformance'}));
    try {
      const encoder = device.createCommandEncoder();
      result.encode(encoder);
      device.submit(encoder.finish());
      const selection =
        result instanceof CompiledGPUDataFrameGlobalSort ||
        (result instanceof CompiledGPUDataFrameGroupedAggregation && result.globalRowIndices)
          ? {
              globalRowIndices: result.globalRowIndices,
              globalSelectedCount: result.globalSelectedCount
            }
          : {rowIndices: result.rowIndices, selectedCounts: result.selectedCounts};
      return await makeArrowTableFromGPUAnalyticsTable({
        table: result.table,
        validity: result.validity,
        dictionaries: result.dictionaries,
        ...selection
      });
    } finally {
      result.destroy();
    }
  } finally {
    payloads?.destroy();
    frame.destroy();
  }
}
