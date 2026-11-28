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
  ATAN2,
  COS,
  DEGREES,
  EXP,
  LN,
  LOG10,
  MOD,
  RADIANS,
  ROUND,
  SIGN,
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
    expect(result?.get(index)).toBeCloseTo(reference.getChild('result')?.get(index), 5);
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

test('SIGN preserves each scalar format and nulls', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const input = makeSamples([0, 1, 2, 3], [-2.5, 0, 3.75, null]);
  const sql = `SELECT SIGN(score) AS float_sign, SIGN(CAST(score AS INTEGER)) AS int_sign,
                      SIGN(id) AS uint_sign FROM samples`;
  const reference = queryArrowSQL(sql, new Map([['samples', input]]), {functions: [SIGN]});
  const actual = await executeGPUQuery(device, input, sql);
  expect(actual.schema.fields.map(field => String(field.type))).toEqual([
    'Float32',
    'Int32',
    'Uint32'
  ]);
  for (const field of actual.schema.fields) {
    expect(Array.from(actual.getChild(field.name) ?? [])).toEqual(
      Array.from(reference.getChild(field.name) ?? [])
    );
  }
  expect(Array.from(actual.getChild('uint_sign') ?? [])).toEqual([0, 1, 1, 1]);
});

test('angle conversions agree with Arrow SQL and reject invalid Float32 inputs', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const input = makeSamples([1, 2, 3, 4, 5, 6, 7], [-0.75, 0, 0.75, null, Infinity, NaN, -6e36]);
  const sql = 'SELECT DEGREES(score) AS degrees, RADIANS(score) AS radians FROM samples';
  const reference = queryArrowSQL(sql + ' WHERE id <= 3', new Map([['samples', input]]), {
    functions: [DEGREES, RADIANS]
  });
  const actual = await executeGPUQuery(device, input, sql);
  for (const name of ['degrees', 'radians']) {
    const values = actual.getChild(name);
    expect(values?.type).toBeInstanceOf(arrow.Float32);
    for (const index of [0, 1, 2]) {
      expect(values?.get(index)).toBeCloseTo(reference.getChild(name)?.get(index), 5);
    }
    expect(Array.from(values ?? []).slice(3, 6)).toEqual([null, null, null]);
  }
  expect(actual.getChild('degrees')?.get(6)).toBeNull();
  expect(actual.getChild('radians')?.get(6) / ((-6e36 * Math.PI) / 180)).toBeCloseTo(1, 5);
});

test.each([
  {page: 'LIMIT 3 OFFSET 1', expected: [6, 5, 2]},
  {page: 'OFFSET 4', expected: [3, 1]},
  {page: 'LIMIT 2 OFFSET 6', expected: []}
])('agrees with Arrow SQL on a computed multi-key sort with $page', async ({page, expected}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const sql = `SELECT id, SIGN(score) AS direction FROM samples
               ORDER BY direction DESC NULLS LAST,
                        RADIANS(score) + :threshold ASC NULLS LAST ${page}`;
  const parameters = {threshold: -0.01};
  // The Arrow executor binds sort keys by column name.
  const referenceSql = `SELECT id, SIGN(score) AS direction,
                               RADIANS(score) + :threshold AS angle
                        FROM samples ORDER BY direction DESC NULLS LAST,
                                              angle ASC NULLS LAST ${page}`;
  const reference = queryArrowSQL(referenceSql, new Map([['samples', samples]]), {
    functions: [SIGN, RADIANS],
    parameters
  });
  expect(Array.from(reference.getChild('id') ?? [])).toEqual(expected);
  const result = await executeGPUQuery(device, samples, sql, parameters);
  expect(result.schema.fields.map(field => field.name)).toEqual(['id', 'direction']);
  expect(Array.from(result.getChild('id') ?? [])).toEqual(expected);
  expect(Array.from(result.getChild('direction') ?? [])).toEqual(
    Array.from(reference.getChild('direction') ?? [])
  );
});

test('ATAN2 agrees with Arrow SQL on quadrants and axes across batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const rows = arrow.tableFromArrays({
    id: new Uint32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
    y: arrow.vectorFromArray([1, 1, -1, -1, 1, -1, 0, 0, 0, null, Infinity], new arrow.Float32()),
    x: arrow.vectorFromArray([1, -1, -1, 1, 0, 0, -1, 1, 0, 1, 1], new arrow.Float32())
  });
  const input = new arrow.Table([...rows.slice(0, 4).batches, ...rows.slice(4).batches]);
  const sql = 'SELECT ATAN2(y, x) AS result FROM samples';
  const reference = queryArrowSQL(sql + ' WHERE id <= 8', new Map([['samples', input]]), {
    functions: [ATAN2]
  });
  const output = await executeGPUQuery(device, input, sql);
  const result = output.getChild('result');
  expect(result?.type).toBeInstanceOf(arrow.Float32);
  const referenceAngles = reference.getChild('result');
  for (let index = 0; index < 4; index++) {
    const angle = referenceAngles?.get(index);
    // WGSL allows 4096 ULP for atan2 with normal inputs in this range.
    const tolerance = 4097 * 2 ** (Math.floor(Math.log2(Math.abs(angle))) - 23);
    expect(Math.abs(result?.get(index) - angle)).toBeLessThanOrEqual(tolerance);
  }
  expect(Array.from(result ?? []).slice(4, 8)).toEqual(Array.from(referenceAngles ?? []).slice(4));
  expect(Array.from(result ?? []).slice(8)).toEqual([null, null, null]);
  expect(output.batches.map(batch => batch.numRows)).toEqual([4, 7]);
});

test('integer MOD preserves sign and format and returns null for a zero divisor', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const input = arrow.tableFromArrays({
    id: new Uint32Array([1, 2, 3, 4, 5, 6]),
    dividend: arrow.vectorFromArray([-7, 7, -2147483648, 3, null, 7], new arrow.Int32()),
    divisor: arrow.vectorFromArray([3, -3, -1, 0, 2, null], new arrow.Int32()),
    unsigned_value: new Uint32Array([7, 1, 4294967295, 3, 3, 7]),
    unsigned_divisor: new Uint32Array([3, 3, 2, 0, 2, 2])
  });
  for (const {operands, type, expected} of [
    {operands: 'dividend, divisor', type: arrow.Int32, expected: [-1, 1, 0, null, null, null]},
    {
      operands: 'unsigned_value, unsigned_divisor',
      type: arrow.Uint32,
      expected: [1, 1, 1, null, 1, 1]
    }
  ]) {
    const sql = `SELECT MOD(${operands}) AS result FROM samples`;
    const reference = queryArrowSQL(sql + ' WHERE id <= 3', new Map([['samples', input]]), {
      functions: [MOD]
    });
    const output = await executeGPUQuery(device, input, sql);
    const values = output.getChild('result');
    expect(values?.type).toBeInstanceOf(type);
    expect(Array.from(values ?? []).slice(0, 3)).toEqual(
      Array.from(reference.getChild('result') ?? [])
    );
    expect(Array.from(values ?? [])).toEqual(expected);
  }
});

test('Float32 MOD agrees with Arrow SQL across batches and exponent ranges', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const smallestSubnormal = 2 ** -149;
  const smallestNormal = 2 ** -126;
  const largestFinite = (2 - 2 ** -23) * 2 ** 127;
  const rows = arrow.tableFromArrays({
    dividend: new Float32Array([
      7.75,
      -7.75,
      -1,
      -8,
      -0,
      largestFinite,
      -largestFinite,
      7 * smallestSubnormal,
      smallestNormal,
      smallestSubnormal,
      1
    ]),
    divisor: new Float32Array([
      2.5,
      -2.5,
      4,
      2,
      1,
      0.375,
      3 * smallestSubnormal,
      3 * smallestSubnormal,
      3 * smallestSubnormal,
      smallestNormal,
      largestFinite
    ])
  });
  const input = new arrow.Table([...rows.slice(0, 5).batches, ...rows.slice(5).batches]);
  const sql = 'SELECT MOD(dividend, divisor) AS result FROM samples';
  const reference = queryArrowSQL(sql, new Map([['samples', input]]), {functions: [MOD]});
  const actual = await executeGPUQuery(device, input, sql);
  expect(actual.getChild('result')?.type).toBeInstanceOf(arrow.Float32);
  expect(Array.from(actual.getChild('result') ?? [])).toEqual(
    Array.from(reference.getChild('result') ?? [])
  );
  expect(actual.batches.map(batch => batch.numRows)).toEqual([5, 6]);
});

test('Float32 MOD returns null for both signed zeros, nulls, and nonfinite inputs', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const input = arrow.tableFromArrays({
    dividend: arrow.vectorFromArray([1, 1, 1, null, Infinity, 1, NaN, 1], new arrow.Float32()),
    divisor: arrow.vectorFromArray([0, -0, null, 1, 1, Infinity, 1, NaN], new arrow.Float32())
  });
  const actual = await executeGPUQuery(
    device,
    input,
    'SELECT MOD(dividend, divisor) AS result FROM samples'
  );
  expect(Array.from(actual.getChild('result') ?? [])).toEqual(Array(8).fill(null));
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
