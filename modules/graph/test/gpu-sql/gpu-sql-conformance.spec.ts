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
import {ABS, ROUND} from '@math.gl/sql/math-functions';
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
