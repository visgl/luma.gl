// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  makeArrowTableFromGPUAnalyticsTable,
  makeGPUAnalyticsTableFromArrowTable
} from '@luma.gl/graph/arrow';
import {planGPUDataFrameQuery} from '../../../../examples/experimental/gpu-data-analysis/src/loaders-sql-query';
import {parseSQLPredicate} from '@loaders.gl/sql';
import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {
  CompiledGPUDataFrameAggregation as CompiledGPUDataFrameAggregation,
  CompiledGPUDataFrameGlobalSort as CompiledGPUDataFrameGlobalSort,
  CompiledGPUDataFrameGroupedAggregation as CompiledGPUDataFrameGroupedAggregation,
  CompiledGPUDataFrameJoin as CompiledGPUDataFrameJoin,
  GPUDataFrame
} from '@luma.gl/graph/gpu-dataframe';
import {GPUSQLContext} from '@luma.gl/graph/gpu-sql';
import {GPURecordBatch, GPUTable} from '@luma.gl/graph/gpu-tables';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import * as arrow from 'apache-arrow';
import {expect, it, vi} from 'vitest';

it('GPUSQL executes Arrow filters, derived columns, global ordering, and selected Arrow output on WebGPU', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable()),
    ownership: 'owned'
  });
  const context = new GPUSQLContext({trips: frame});
  const filtered = context
    .query(
      `SELECT fare, category, CASE WHEN NULL THEN 100 WHEN :threshold THEN 99 WHEN category >= 0 AND trips.fare > 9 THEN fare WHEN fare < 4 THEN 0 END AS bucket FROM trips WHERE fare IN (3, 8, 10, 11, NULL) AND fare NOT IN (9, 12)`,
      {parameters: {threshold: null}}
    )
    .compile(new GPUCommandGraph(device, {id: 'ludf-sql-arrow-filter'}));
  const ordered = context
    .query(
      'SELECT fare, category, -fare * 2 AS Fare FROM trips WHERE fare >= :minimum ORDER BY 3 ASC LIMIT 2 OFFSET 1',
      {parameters: {minimum: 8}}
    )
    .compile(new GPUCommandGraph(device, {id: 'ludf-sql-arrow-global-sort'}));

  try {
    expect(Boolean(ordered instanceof CompiledGPUDataFrameGlobalSort), '').toBe(true);
    if (!(ordered instanceof CompiledGPUDataFrameGlobalSort))
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
    expect(
      filteredArrow.batches.map(batch => batch.numRows),
      ''
    ).toEqual([1, 0, 3]);
    expect(Array.from(filteredArrow.getChild('fare') ?? []), '').toEqual([8, 3, 10, 11]);
    expect(Array.from(filteredArrow.getChild('category') ?? []), '').toEqual([
      'premium',
      'economy',
      'premium',
      'economy'
    ]);

    expect(Array.from(filteredArrow.getChild('bucket') ?? [])).toEqual([null, 0, 10, 11]);

    const orderedArrow = await makeArrowTableFromGPUAnalyticsTable({
      table: ordered.table,
      validity: ordered.validity,
      dictionaries: ordered.dictionaries,
      globalRowIndices: ordered.globalRowIndices,
      globalSelectedCount: ordered.globalSelectedCount
    });
    expect(
      orderedArrow.batches.map(batch => batch.numRows),
      ''
    ).toEqual([2]);
    expect(Array.from(orderedArrow.getChild('fare') ?? []), '').toEqual([10, 8]);
    expect(Array.from(orderedArrow.getChild('Fare') ?? []), '').toEqual([-20, -16]);
    expect(Array.from(orderedArrow.getChild('category') ?? []), '').toEqual(['premium', 'premium']);

    expect(() =>
      context
        .query('SELECT fare FROM trips WHERE category = FLOOR(1.5)')
        .compile(new GPUCommandGraph(device, {id: 'ludf-sql-numeric-mixed-format'}))
    ).toThrow(/incompatible scalar column formats/);

    const numericCases = [
      {expression: 'FLOOR(1.5)', expected: [1, 1, 1, 1]},
      {expression: 'ABS(-fare)', expected: [8, 3, 10, 11]},
      {expression: 'FLOOR(-fare - 0.5)', expected: [-9, -4, -11, -12]},
      {expression: 'CEILING(-fare - 0.5)', expected: [-8, -3, -10, -11]},
      {
        expression: 'ROUND(CASE WHEN fare > 3 THEN -fare - 0.5 END)',
        expected: [-9, null, -11, -12]
      },
      {expression: 'TRUNC(-fare - 0.5)', expected: [-8, -3, -10, -11]},
      {expression: 'FLOOR(category)', expected: [1, 0, 1, 0]}
    ];
    for (const {expression, expected} of numericCases) {
      const result = context
        .query(`SELECT ${expression} AS computed FROM trips WHERE fare IS NOT NULL`)
        .compile(new GPUCommandGraph(device, {id: 'ludf-sql-numeric-function'}));
      try {
        const commandEncoder = device.createCommandEncoder();
        result.encode(commandEncoder);
        device.submit(commandEncoder.finish());
        const output = await makeArrowTableFromGPUAnalyticsTable({
          table: result.table,
          validity: result.validity,
          rowIndices: result.rowIndices,
          selectedCounts: result.selectedCounts
        });
        expect(Array.from(output.getChild('computed') ?? []), expression).toEqual(expected);
      } finally {
        result.destroy();
      }
    }
  } finally {
    filtered.destroy();
    ordered.destroy();
    frame.destroy();
  }

  void 0;
});

it('GPU SQL fills missing values and nulls matching sentinels across Arrow batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable()),
    ownership: 'owned'
  });
  try {
    const context = new GPUSQLContext({trips: frame});
    const plan = context.query(
      'SELECT COALESCE(NULLIF(trips.fare, :sentinel), NULL, 99) AS filled, NULLIF(fare, NULL) AS unchanged FROM trips',
      {parameters: {sentinel: 8}}
    );
    const result = plan.compile(new GPUCommandGraph(device, {id: 'sql-null-functions'}));
    try {
      for (const {sentinel, expected} of [
        {sentinel: 8, expected: [99, 99, 3, 10, 11]},
        {sentinel: null, expected: [99, 8, 3, 10, 11]}
      ]) {
        const encoder = device.createCommandEncoder();
        result.encode(encoder, {sentinel});
        device.submit(encoder.finish());
        const output = await makeArrowTableFromGPUAnalyticsTable({
          table: result.table,
          validity: result.validity,
          rowIndices: result.rowIndices,
          selectedCounts: result.selectedCounts
        });
        expect(Array.from(output.getChild('filled') ?? [])).toEqual(expected);
        expect(Array.from(output.getChild('unchanged') ?? [])).toEqual([null, 8, 3, 10, 11]);
      }
    } finally {
      result.destroy();
    }
  } finally {
    frame.destroy();
  }
});

it('casts projected numeric columns and sorts on the converted format', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable()),
    ownership: 'owned'
  });
  try {
    const context = new GPUSQLContext({trips: frame});
    const result = context
      .query(
        'SELECT CAST(-trips.fare - 0.75 AS INTEGER) AS signedFare, CAST(identifier AS REAL) AS floatIdentifier FROM trips ORDER BY signedFare NULLS LAST'
      )
      .compile(new GPUCommandGraph(device, {id: 'sql-scalar-casts'}));
    try {
      if (!(result instanceof CompiledGPUDataFrameGlobalSort))
        throw new Error('Expected global SQL sort');
      const encoder = device.createCommandEncoder();
      result.encode(encoder);
      device.submit(encoder.finish());
      const output = await makeArrowTableFromGPUAnalyticsTable({
        table: result.table,
        validity: result.validity,
        globalRowIndices: result.globalRowIndices,
        globalSelectedCount: result.globalSelectedCount
      });
      expect(output.getChild('signedFare')?.type).toBeInstanceOf(arrow.Int32);
      expect(Array.from(output.getChild('signedFare') ?? [])).toEqual([-11, -10, -8, -3, null]);
      expect(output.getChild('floatIdentifier')?.type).toBeInstanceOf(arrow.Float32);
      expect(Array.from(output.getChild('floatIdentifier') ?? [])).toEqual([50, 40, 20, 30, 10]);
    } finally {
      result.destroy();
    }
  } finally {
    frame.destroy();
  }
});

it('loaders.gl SQL predicates compile into reusable GPU-resident dataframe results', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable()),
    ownership: 'owned'
  });
  const predicate = parseSQLPredicate('fare >= :minimum AND category IN (0, 1)', {
    preserveParameters: true
  });
  const compiled = planGPUDataFrameQuery(frame, {
    predicate,
    columns: ['fare', 'category'],
    parameters: {minimum: 8}
  }).compile(new GPUCommandGraph(device, {id: 'loaders-sql-gpu-dataframe'}));

  try {
    const encoder = device.createCommandEncoder({id: 'loaders-sql-gpu-dataframe'});
    compiled.encode(encoder, {minimum: 9});
    device.submit(encoder.finish());

    const result = await makeArrowTableFromGPUAnalyticsTable({
      table: compiled.table,
      validity: compiled.validity,
      dictionaries: compiled.dictionaries,
      rowIndices: compiled.rowIndices,
      selectedCounts: compiled.selectedCounts
    });
    expect(Array.from(result.getChild('fare') ?? []), '').toEqual([10, 11]);
    expect(Array.from(result.getChild('category') ?? []), '').toEqual(['premium', 'economy']);
  } finally {
    compiled.destroy();
    frame.destroy();
  }

  void 0;
});

it('SQL projection-only plans do not bind arbitrary source columns', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const batch = new GPURecordBatch<{
    position: 'float32x3';
    category: 'uint32';
  }>({
    gpuData: {
      position: new GPUData({
        buffer: device.createBuffer({
          data: Float32Array.of(0, 1, 2, 3, 4, 5),
          usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
        }),
        format: 'float32x3',
        length: 2,
        ownsBuffer: true
      }),
      category: new GPUData({
        buffer: device.createBuffer({
          data: Uint32Array.of(7, 9),
          usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
        }),
        format: 'uint32',
        length: 2,
        ownsBuffer: true
      })
    },
    fields: [
      {name: 'position', format: 'float32x3', nullable: false},
      {name: 'category', format: 'uint32', nullable: false}
    ]
  });
  const frame = new GPUDataFrame({
    table: new GPUTable({batches: [batch]}),
    ownership: 'owned'
  });
  try {
    const context = new GPUSQLContext({samples: frame});
    for (const plan of [
      planGPUDataFrameQuery(frame, {columns: ['category']}),
      context.query('SELECT category FROM samples')
    ]) {
      const compiled = plan.compile(new GPUCommandGraph(device, {id: 'sql-projection-only'}));
      try {
        const encoder = device.createCommandEncoder({id: 'loaders-sql-projection-only'});
        compiled.encode(encoder);
        device.submit(encoder.finish());

        const result = await makeArrowTableFromGPUAnalyticsTable({
          table: compiled.table,
          validity: compiled.validity,
          dictionaries: compiled.dictionaries,
          rowIndices: compiled.rowIndices,
          selectedCounts: compiled.selectedCounts
        });
        expect(Array.from(result.getChild('category') ?? []), '').toEqual([7, 9]);
      } finally {
        compiled.destroy();
      }
    }

    const packedCount = context
      .query('SELECT COUNT(position) AS known FROM samples')
      .compile(new GPUCommandGraph(device, {id: 'sql-packed-count'}));
    try {
      const encoder = device.createCommandEncoder();
      packedCount.encode(encoder);
      device.submit(encoder.finish());
      const result = await makeArrowTableFromGPUAnalyticsTable({table: packedCount.table});
      expect(result.getChild('known')?.get(0)).toBe(2);
    } finally {
      packedCount.destroy();
    }

    const packedProjection = context
      .query('SELECT position FROM samples')
      .compile(new GPUCommandGraph(device, {id: 'sql-packed-projection'}));
    try {
      expect(packedProjection.table.schema.fields.map(field => field.format)).toEqual([
        'float32x3'
      ]);
      expect(packedProjection.table.gpuVectors['position']?.data[0].buffer).toBe(
        frame.table.gpuVectors.position?.data[0].buffer
      );
      const encoder = device.createCommandEncoder();
      packedProjection.encode(encoder);
      device.submit(encoder.finish());
    } finally {
      packedProjection.destroy();
    }
  } finally {
    frame.destroy();
  }

  void 0;
});

it('GPUSQL applies multiple ORDER BY keys before pagination across Arrow batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable()),
    ownership: 'owned'
  });
  const context = new GPUSQLContext({trips: frame});

  try {
    const cases = [
      {
        clause:
          'ORDER BY category, CASE WHEN fare >= 8 THEN 1 END DESC NULLS FIRST, 2 DESC LIMIT 3 OFFSET 1',
        identifiers: [10, 50, 40],
        fares: [null, 11, 10]
      },
      {
        clause: 'ORDER BY category, CASE WHEN fare >= 8 THEN 1 END NULLS FIRST',
        identifiers: [10, 30, 50, 20, 40],
        fares: [null, 3, 11, 8, 10]
      }
    ];
    for (const [index, {clause, identifiers, fares}] of cases.entries()) {
      const result = context
        .query('SELECT fare, identifier AS trip FROM trips ' + clause)
        .compile(new GPUCommandGraph(device, {id: 'sql-lexicographic-sort-' + index}));
      try {
        if (!(result instanceof CompiledGPUDataFrameGlobalSort)) {
          throw new Error('Expected global SQL sort');
        }
        const encoder = device.createCommandEncoder();
        result.encode(encoder);
        device.submit(encoder.finish());

        const output = await makeArrowTableFromGPUAnalyticsTable({
          table: result.table,
          validity: result.validity,
          dictionaries: result.dictionaries,
          globalRowIndices: result.globalRowIndices,
          globalSelectedCount: result.globalSelectedCount
        });
        expect(output.schema.fields.map(field => field.name)).toEqual(['fare', 'trip']);
        expect(Array.from(output.getChild('trip') ?? [])).toEqual(identifiers);
        expect(Array.from(output.getChild('fare') ?? [])).toEqual(fares);
      } finally {
        result.destroy();
      }
    }
  } finally {
    frame.destroy();
  }
});

it('GPUSQL lowers global and dictionary GROUP BY aggregates into GPU tables and Arrow results', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable()),
    ownership: 'owned'
  });
  const context = new GPUSQLContext({trips: frame});
  const aggregate = context
    .query(
      'SELECT COUNT(*) AS rows, COUNT(NULLIF(fare, 8)) AS known, SUM(fare * 2) AS total, AVG(fare) AS average FROM trips WHERE fare >= 8 OR fare IS NULL'
    )
    .compile(new GPUCommandGraph(device, {id: 'ludf-sql-arrow-aggregate'}));
  const grouped = context
    .query(
      'SELECT COUNT(*) AS category, category AS label, COUNT(NULLIF(fare, 8)) AS known, SUM(fare + 1) AS total FROM trips GROUP BY label'
    )
    .compile(new GPUCommandGraph(device, {id: 'ludf-sql-arrow-grouped'}));

  try {
    expect(Boolean(aggregate instanceof CompiledGPUDataFrameAggregation), '').toBe(true);
    expect(Boolean(grouped instanceof CompiledGPUDataFrameGroupedAggregation), '').toBe(true);
    const encoder = device.createCommandEncoder({id: 'ludf-sql-arrow-aggregate-encode'});
    aggregate.encode(encoder);
    grouped.encode(encoder);
    device.submit(encoder.finish());

    const aggregateArrow = await makeArrowTableFromGPUAnalyticsTable({
      table: aggregate.table,
      validity: aggregate.validity,
      dictionaries: aggregate.dictionaries
    });
    expect(Array.from(aggregateArrow.getChild('rows') ?? [])).toEqual([4]);
    expect(Array.from(aggregateArrow.getChild('known') ?? [])).toEqual([2]);
    expect(Array.from(aggregateArrow.getChild('total') ?? []), '').toEqual([58]);
    expect(
      Boolean(Math.abs(Number(aggregateArrow.getChild('average')?.get(0)) - 29 / 3) < 0.001),
      ''
    ).toBe(true);

    const groupedArrow = await makeArrowTableFromGPUAnalyticsTable({
      table: grouped.table,
      validity: grouped.validity,
      dictionaries: grouped.dictionaries
    });
    expect(groupedArrow.schema.fields.map(field => field.name)).toEqual([
      'category',
      'label',
      'known',
      'total'
    ]);
    expect(Array.from(groupedArrow.getChild('label') ?? []), '').toEqual(['economy', 'premium']);
    expect(Array.from(groupedArrow.getChild('category') ?? [])).toEqual([3, 2]);
    expect(Array.from(groupedArrow.getChild('known') ?? [])).toEqual([2, 1]);
    expect(Array.from(groupedArrow.getChild('total') ?? []), '').toEqual([16, 20]);
  } finally {
    aggregate.destroy();
    grouped.destroy();
    frame.destroy();
  }

  void 0;
});

it('GPUSQL compiles left and anti joins over separately uploaded Arrow sources without repacking', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const left = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable()),
    ownership: 'owned'
  });
  const rightArrow = arrow.tableFromArrays({identifier: Uint32Array.of(20, 40)});
  const right = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, rightArrow),
    ownership: 'owned'
  });
  const context = new GPUSQLContext({trips: left, accounts: right});
  const joined = context
    .query(
      'SELECT trips.identifier, trips.fare FROM trips LEFT JOIN accounts ON accounts.identifier = trips.identifier'
    )
    .compile(new GPUCommandGraph(device, {id: 'ludf-sql-arrow-left-join'}));
  const unmatched = context
    .query(
      'SELECT trips.category, trips.fare + 1 AS adjusted FROM trips ANTI JOIN accounts ON trips.identifier = accounts.identifier'
    )
    .compile(new GPUCommandGraph(device, {id: 'ludf-sql-arrow-anti-join'}));

  try {
    expect(Boolean(joined instanceof CompiledGPUDataFrameJoin), '').toBe(true);
    expect(Boolean(unmatched instanceof CompiledGPUDataFrameJoin), '').toBe(true);
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
    expect(
      joinedArrow.batches.map(batch => batch.numRows),
      ''
    ).toEqual([2, 0, 3]);
    expect(Array.from(joinedArrow.getChild('identifier') ?? []), '').toEqual([10, 20, 30, 40, 50]);

    const unmatchedArrow = await makeArrowTableFromGPUAnalyticsTable({
      table: unmatched.table,
      validity: unmatched.validity,
      dictionaries: unmatched.dictionaries,
      rowIndices: unmatched.rowIndices,
      selectedCounts: unmatched.selectedCounts
    });
    expect(
      unmatchedArrow.batches.map(batch => batch.numRows),
      ''
    ).toEqual([1, 0, 2]);
    expect(unmatchedArrow.schema.fields.map(field => field.name)).toEqual(['category', 'adjusted']);
    expect(Array.from(unmatchedArrow.getChild('category') ?? [])).toEqual([
      'economy',
      'economy',
      'economy'
    ]);
    expect(Array.from(unmatchedArrow.getChild('adjusted') ?? [])).toEqual([null, 4, 12]);
  } finally {
    joined.destroy();
    unmatched.destroy();
    left.destroy();
    right.destroy();
  }

  void 0;
});

it('GPUSQL projects nullable right payloads across independent Arrow batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const left = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable()),
    ownership: 'owned'
  });
  const first = arrow.tableFromArrays({
    identifier: Uint32Array.of(40),
    score: arrow.vectorFromArray([null], new arrow.Float32())
  });
  const second = arrow.tableFromArrays({
    identifier: Uint32Array.of(20),
    score: arrow.vectorFromArray([2.5], new arrow.Float32())
  });
  const right = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(
      device,
      new arrow.Table([...first.batches, ...second.batches])
    ),
    ownership: 'owned'
  });
  const context = new GPUSQLContext({trips: left, accounts: right});
  try {
    for (const [joinType, batchLengths, expected] of [
      [
        'LEFT',
        [2, 0, 3],
        [
          [null, 10, null],
          [2.5, 20, 20],
          [null, 30, null],
          [null, 40, 40],
          [null, 50, null]
        ]
      ],
      [
        'INNER',
        [1, 0, 1],
        [
          [2.5, 20, 20],
          [null, 40, 40]
        ]
      ]
    ] as const) {
      const result = context
        .query(
          `SELECT a.score AS rating, t.identifier, a.identifier AS account
         FROM trips AS t ${joinType} JOIN accounts AS a ON t.identifier = a.identifier`
        )
        .compile(new GPUCommandGraph(device));
      try {
        const encoder = device.createCommandEncoder();
        result.encode(encoder);
        device.submit(encoder.finish());
        const output = await makeArrowTableFromGPUAnalyticsTable({
          table: result.table,
          validity: result.validity,
          dictionaries: result.dictionaries,
          rowIndices: result.rowIndices,
          selectedCounts: result.selectedCounts
        });
        expect(output.schema.fields.map(field => field.name)).toEqual([
          'rating',
          'identifier',
          'account'
        ]);
        expect(output.batches.map(batch => batch.numRows)).toEqual(batchLengths);
        expect(Array.from(output, row => [row.rating, row.identifier, row.account])).toEqual(
          expected
        );
      } finally {
        result.destroy();
      }
    }
  } finally {
    right.destroy();
    left.destroy();
  }
});

it('GPUSQL evaluates joined expressions and runtime parameters across Arrow batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const leftArrow = createGPUSQLArrowTable();
  const rightBatches = [
    arrow.tableFromArrays({
      identifier: Uint32Array.of(40),
      score: arrow.vectorFromArray([null], new arrow.Float32())
    }).batches[0],
    arrow.tableFromArrays({
      identifier: Uint32Array.of(20),
      score: arrow.vectorFromArray([2.5], new arrow.Float32())
    }).batches[0]
  ];
  const rightArrow = new arrow.Table(rightBatches);
  const left = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, leftArrow),
    ownership: 'owned'
  });
  const right = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, rightArrow),
    ownership: 'owned'
  });
  const context = new GPUSQLContext({trips: left, accounts: right});
  const rightByKey = new Map(Array.from(rightArrow, row => [row.identifier, row.score]));
  try {
    for (const joinType of ['LEFT', 'INNER'] as const) {
      const query = context.query(
        `SELECT COALESCE(a.score, :fallback) AS adjusted, t.fare + a.score AS total,
                t.identifier, a.score AS score
         FROM trips AS t ${joinType} JOIN accounts AS a ON t.identifier = a.identifier`,
        {parameters: {fallback: 0}}
      );
      const result = query.compile(new GPUCommandGraph(device));
      try {
        for (const fallback of [7, -2]) {
          const encoder = device.createCommandEncoder();
          result.encode(encoder, {fallback});
          device.submit(encoder.finish());
          const output = await makeArrowTableFromGPUAnalyticsTable({
            table: result.table,
            validity: result.validity,
            dictionaries: result.dictionaries,
            rowIndices: result.rowIndices,
            selectedCounts: result.selectedCounts
          });
          const expected = Array.from(leftArrow)
            .filter(row => joinType === 'LEFT' || rightByKey.has(row.identifier))
            .map(row => {
              const score = rightByKey.get(row.identifier) ?? null;
              return [
                score ?? fallback,
                score === null || row.fare == null ? null : row.fare + score,
                row.identifier,
                score
              ];
            });
          expect(output.schema.fields.map(field => field.name)).toEqual([
            'adjusted',
            'total',
            'identifier',
            'score'
          ]);
          expect(output.batches.map(batch => batch.numRows)).toEqual(
            joinType === 'LEFT' ? [2, 0, 3] : [1, 0, 1]
          );
          expect(
            Array.from(output, row => [row.adjusted, row.total, row.identifier, row.score])
          ).toEqual(expected);
        }
      } finally {
        result.destroy();
      }
    }
  } finally {
    right.destroy();
    left.destroy();
  }
});

it.each([
  'LEFT',
  'INNER'
] as const)('GPUSQL returns empty projected results for %s joins without left record batches', async joinType => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const emptyBatchTable = createGPUSQLArrowTable(false, true);
  const rightArrow = arrow.tableFromArrays({
    identifier: Uint32Array.of(20),
    score: arrow.vectorFromArray([2.5], new arrow.Float32())
  });
  const right = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, rightArrow),
    ownership: 'owned'
  });
  try {
    for (const leftArrow of [new arrow.Table(emptyBatchTable.schema), emptyBatchTable]) {
      const left = new GPUDataFrame({
        ...makeGPUAnalyticsTableFromArrowTable(device, leftArrow),
        ownership: 'owned'
      });
      try {
        const result = new GPUSQLContext({trips: left, accounts: right})
          .query(
            `SELECT COALESCE(a.score, 0) AS adjusted, t.fare + a.score AS total
               FROM trips AS t ${joinType} JOIN accounts AS a ON t.identifier = a.identifier`
          )
          .compile(new GPUCommandGraph(device));
        try {
          const encoder = device.createCommandEncoder();
          result.encode(encoder);
          device.submit(encoder.finish());
          const output = await makeArrowTableFromGPUAnalyticsTable({
            table: result.table,
            validity: result.validity,
            dictionaries: result.dictionaries,
            rowIndices: result.rowIndices,
            selectedCounts: result.selectedCounts
          });
          expect(output.batches.map(batch => batch.numRows)).toEqual(
            leftArrow.batches.map(batch => batch.numRows)
          );
          expect(output.schema.fields.map(field => field.name)).toEqual(['adjusted', 'total']);
          expect(output.numRows).toBe(0);
        } finally {
          result.destroy();
        }
      } finally {
        left.destroy();
      }
    }
  } finally {
    right.destroy();
  }
});

it('GPU SQL and typed joins project nullable packed right vectors with and without staging', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const left = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable()),
    ownership: 'owned'
  });
  const positionType = new arrow.FixedSizeList(
    3,
    new arrow.Field('item', new arrow.Float32(), false)
  );
  const first = arrow.tableFromArrays({
    identifier: Uint32Array.of(40, 50),
    position: arrow.vectorFromArray([[4, 40, -4], null], positionType)
  });
  const second = arrow.tableFromArrays({
    identifier: Uint32Array.of(20),
    position: arrow.vectorFromArray([[2, 20, -2]], positionType)
  });
  const right = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(
      device,
      new arrow.Table([...first.batches, ...second.batches])
    ),
    ownership: 'owned'
  });
  const context = new GPUSQLContext({trips: left, accounts: right});
  const selectedLeft = left.select(['identifier']);
  const join = selectedLeft.leftJoin(right, {leftOn: 'identifier', rightOn: 'identifier'});
  try {
    expect(() =>
      join.compileWithRightColumns(new GPUCommandGraph(device), {
        rightColumns: {identifier: 'position'}
      })
    ).toThrow(/invalid or already selected/);
    expect(() =>
      join.compileWithRightColumns(new GPUCommandGraph(device), {
        rightColumns: {location: 'position'},
        maxJoinProjectionScratchBytes: -1
      })
    ).toThrow(/nonnegative safe integer/);
    for (const [budget, expectedScratch, typed] of [
      [47, 0, false],
      [48, 48, false],
      [47, 0, true],
      [48, 48, true]
    ] as const) {
      const graph = new GPUCommandGraph(device);
      const createTransientBuffer = vi.spyOn(graph, 'createTransientBuffer');
      const result = typed
        ? join.compileWithRightColumns(graph, {
            rightColumns: {location: 'position'},
            maxJoinProjectionScratchBytes: budget
          })
        : context
            .query(
              'SELECT a.position AS location FROM trips AS t LEFT JOIN accounts AS a ON t.identifier = a.identifier',
              {maxJoinProjectionScratchBytes: budget}
            )
            .compile(graph);
      try {
        const scratch = createTransientBuffer.mock.calls
          .map(([buffer]) => buffer)
          .filter(buffer => buffer.id.includes('-join-projection-'))
          .reduce((total, buffer) => total + buffer.byteLength, 0);
        expect(scratch).toBe(expectedScratch);
        expect(result.table.gpuVectors.location.format).toBe('float32x3');
        const encoder = device.createCommandEncoder();
        result.encode(encoder);
        device.submit(encoder.finish());
        const output = await makeArrowTableFromGPUAnalyticsTable({
          table: result.table,
          validity: result.validity,
          rowIndices: result.rowIndices,
          selectedCounts: result.selectedCounts
        });
        expect(output.schema.fields.map(field => field.name)).toEqual(
          typed ? ['identifier', 'location'] : ['location']
        );
        expect(output.batches.map(batch => batch.numRows)).toEqual([2, 0, 3]);
        expect(
          Array.from(output.getChild('location') ?? [], value => value && Array.from(value))
        ).toEqual([null, [2, 20, -2], null, [4, 40, -4], null]);
      } finally {
        createTransientBuffer.mockRestore();
        result.destroy();
      }
    }
  } finally {
    right.destroy();
    selectedLeft.destroy();
    left.destroy();
  }
});

it.each([
  {layout: 'mixed', copyableSecondChunk: true},
  {layout: 'storage-only', copyableSecondChunk: false}
])('GPUSQL stages $layout right chunks only when two left batches save a compute pass', async ({
  copyableSecondChunk
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const leftRows = arrow.tableFromArrays({identifier: Uint32Array.of(20, 50, 40, 10)});
  const leftArrow = new arrow.Table([
    leftRows.slice(0, 2).batches[0],
    leftRows.slice(2, 4).batches[0]
  ]);
  const left = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, leftArrow),
    ownership: 'owned'
  });
  const rightBatches = [20, 40].map(
    (identifier, index) =>
      new GPURecordBatch<{identifier: 'uint32'; position: 'float32x3'}>({
        gpuData: {
          identifier: new GPUData({
            buffer: device.createBuffer({data: Uint32Array.of(identifier), usage: Buffer.STORAGE}),
            format: 'uint32',
            length: 1,
            ownsBuffer: true
          }),
          position: new GPUData({
            buffer: device.createBuffer({
              data: Float32Array.of(identifier, -identifier, index),
              usage: Buffer.STORAGE | (index === 1 && copyableSecondChunk ? Buffer.COPY_SRC : 0)
            }),
            format: 'float32x3',
            length: 1,
            ownsBuffer: true
          })
        },
        fields: [
          {name: 'identifier', format: 'uint32', nullable: false},
          {name: 'position', format: 'float32x3', nullable: true}
        ]
      })
  );
  const validity = new GPUVector({
    type: 'data',
    format: 'uint32',
    name: 'position-validity',
    data: [1, 0].map(
      (value, index) =>
        new GPUData({
          buffer: device.createBuffer({
            data: Uint32Array.of(value),
            usage: Buffer.STORAGE | (index === 1 && copyableSecondChunk ? Buffer.COPY_SRC : 0)
          }),
          format: 'uint32',
          length: 1,
          ownsBuffer: true
        })
    ),
    ownsData: true
  });
  const right = new GPUDataFrame({
    table: new GPUTable({batches: rightBatches}),
    validity: {position: validity},
    ownership: 'owned'
  });
  const context = new GPUSQLContext({trips: left, accounts: right});
  try {
    for (const [budget, stageCount] of [
      [0, 0],
      [32, Number(copyableSecondChunk)]
    ] as const) {
      const graph = new GPUCommandGraph(device);
      const compute = vi.spyOn(graph, 'addComputePass');
      const copy = vi.spyOn(graph, 'addCopyPass');
      const result = context
        .query(
          'SELECT a.position FROM trips AS t LEFT JOIN accounts AS a ON t.identifier = a.identifier',
          {maxJoinProjectionScratchBytes: budget}
        )
        .compile(graph);
      try {
        expect(
          compute.mock.calls.filter(
            ([pass]) => pass.id.includes('-join-projection-') && pass.id.includes('-pack-')
          )
        ).toHaveLength(stageCount);
        expect(
          copy.mock.calls.filter(([pass]) => pass.id.includes('-join-projection-'))
        ).toHaveLength(stageCount);
        expect(
          compute.mock.calls.filter(
            ([pass]) => pass.id.includes('-join-projection-') && !pass.id.includes('-pack-')
          )
        ).toHaveLength(stageCount ? 2 : 4);
        const encoder = device.createCommandEncoder();
        result.encode(encoder);
        device.submit(encoder.finish());
        const output = await makeArrowTableFromGPUAnalyticsTable({
          table: result.table,
          validity: result.validity,
          rowIndices: result.rowIndices,
          selectedCounts: result.selectedCounts
        });
        expect(
          Array.from(output.getChild('position') ?? [], value => value && Array.from(value))
        ).toEqual([[20, -20, 0], null, null, null]);
      } finally {
        result.destroy();
      }
    }
  } finally {
    right.destroy();
    left.destroy();
  }
});

it('GPUSQL shares right projection storage and work across aliases and batch layouts', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const rowCount = 32;
  const leftBatchCount = 8;
  const identifiers = Uint32Array.from({length: rowCount}, (_, row) => row);
  const scores = Array.from(identifiers, identifier => (identifier % 5 ? identifier * 0.5 : null));
  const leftRows = arrow.tableFromArrays({identifier: identifiers});
  const rightRows = arrow.tableFromArrays({
    identifier: identifiers,
    score: arrow.vectorFromArray(scores, new arrow.Float32())
  });
  const batchRows = (table: arrow.Table, batchCount: number) => {
    const rowsPerBatch = table.numRows / batchCount;
    return new arrow.Table(
      Array.from({length: batchCount}, (_, batchIndex) =>
        table.slice(batchIndex * rowsPerBatch, (batchIndex + 1) * rowsPerBatch)
      ).flatMap(batch => batch.batches)
    );
  };

  const left = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, batchRows(leftRows, leftBatchCount)),
    ownership: 'owned'
  });
  try {
    for (const [
      rightBatchCount,
      budget,
      expectedProjectionRanges,
      expectedCopyPasses,
      expectedScratchBytes,
      gap
    ] of [
      [1, undefined, 2, 0, 0],
      [2, undefined, 2, 4, 384],
      [8, 384, 2, 16, 384],
      [8, 384, 4, 16, 384, 100],
      [8, 383, 3, 15, 368],
      [8, 128, 13, 4, 128],
      [8, 0, 16, 0, 0]
    ] as const) {
      const right = new GPUDataFrame({
        ...makeGPUAnalyticsTableFromArrowTable(device, batchRows(rightRows, rightBatchCount)),
        ownership: 'owned'
      });
      const graph = new GPUCommandGraph(device);
      const addComputePass = vi.spyOn(graph, 'addComputePass');
      const addCopyPass = vi.spyOn(graph, 'addCopyPass');
      const createTransientBuffer = vi.spyOn(graph, 'createTransientBuffer');
      try {
        expect(left.numRows).toBe(rowCount);
        expect(right.numRows).toBe(rowCount);
        expect(left.batches).toHaveLength(leftBatchCount);
        expect(right.batches).toHaveLength(rightBatchCount);
        if (gap) {
          for (const batch of right.batches.slice(rightBatchCount / 2)) {
            if (!batch.sourceInfo) throw new Error('Expected Arrow source-row IDs');
            batch.sourceInfo.sourceRowIndexOffset += gap;
          }
        }
        const result = new GPUSQLContext({trips: left, accounts: right})
          .query(
            'SELECT a.score, a.identifier AS account, a.score AS rating, a.identifier AS account_copy FROM trips AS t INNER JOIN accounts AS a ON t.identifier = a.identifier',
            {maxJoinProjectionScratchBytes: budget}
          )
          .compile(graph);
        try {
          const projectionPasses = addComputePass.mock.calls.filter(([pass]) =>
            pass.id.includes('-join-projection-')
          );
          expect(projectionPasses).toHaveLength(leftBatchCount * expectedProjectionRanges);
          const packingPasses = addCopyPass.mock.calls.filter(([pass]) =>
            pass.id.includes('-join-projection-')
          );
          expect(packingPasses).toHaveLength(expectedCopyPasses);
          const scratchBytes = createTransientBuffer.mock.calls
            .map(([buffer]) => buffer)
            .filter(buffer => buffer.id.includes('-join-projection-'))
            .reduce((bytes, buffer) => bytes + buffer.byteLength, 0);
          expect(scratchBytes).toBe(expectedScratchBytes);
          const encoder = device.createCommandEncoder();
          result.encode(encoder);
          device.submit(encoder.finish());
          const output = await makeArrowTableFromGPUAnalyticsTable({
            table: result.table,
            validity: result.validity,
            rowIndices: result.rowIndices,
            selectedCounts: result.selectedCounts
          });
          expect(output.batches).toHaveLength(leftBatchCount);
          expect(Array.from(output.getChild('score') ?? [])).toEqual(scores);
          expect(Array.from(output.getChild('account') ?? [])).toEqual(Array.from(identifiers));
          expect(output.schema.fields.map(field => field.name)).toEqual([
            'score',
            'account',
            'rating',
            'account_copy'
          ]);
          expect(Array.from(output.getChild('rating') ?? [])).toEqual(scores);
          expect(Array.from(output.getChild('account_copy') ?? [])).toEqual(
            Array.from(identifiers)
          );
          expect(result.validity.rating).toBe(result.validity.score);
          expect(result.validity.account_copy).toBe(result.validity.account);
          for (const batch of result.table.batches) {
            expect(batch.gpuData.rating.buffer).toBe(batch.gpuData.score.buffer);
            expect(batch.gpuData.account_copy.buffer).toBe(batch.gpuData.account.buffer);
          }
        } finally {
          result.destroy();
        }
      } finally {
        addComputePass.mockRestore();
        addCopyPass.mockRestore();
        createTransientBuffer.mockRestore();
        right.destroy();
      }
    }
  } finally {
    left.destroy();
  }
});

it('GPUSQL aggregates only observed dictionary pairs across Arrow batches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const arrowTable = createGPUSQLArrowTable(true);
  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, arrowTable),
    ownership: 'owned'
  });
  const context = new GPUSQLContext({trips: frame});
  const result = context
    .query(
      'SELECT COUNT(*) AS trips, service AS kind, category, COUNT(fare) AS known, SUM(fare) AS total FROM trips WHERE fare >= :minimum OR (fare IS NULL AND :includeMissing) GROUP BY category, 2',
      {parameters: {minimum: 8, includeMissing: true}}
    )
    .compile(new GPUCommandGraph(device));

  try {
    for (const {minimum, includeMissing} of [
      {minimum: 8, includeMissing: true},
      {minimum: 12, includeMissing: true},
      {minimum: 12, includeMissing: false}
    ]) {
      const encoder = device.createCommandEncoder();
      result.encode(encoder, {minimum, includeMissing});
      device.submit(encoder.finish());
      const output = await makeArrowTableFromGPUAnalyticsTable({
        table: result.table,
        validity: result.validity,
        dictionaries: result.dictionaries,
        rowIndices: result.rowIndices,
        selectedCounts: result.selectedCounts
      });
      const expected = new Map<
        string,
        {trips: number; kind: string; category: string; known: number; total: number | null}
      >();
      for (const row of arrowTable) {
        const {category, service, fare} = row;
        if (fare === null ? !includeMissing : fare < minimum) continue;
        const key = category + '/' + service;
        const group = expected.get(key) ?? {
          trips: 0,
          kind: service,
          category,
          known: 0,
          total: null
        };
        group.trips++;
        if (fare !== null) {
          group.known++;
          group.total = (group.total ?? 0) + fare;
        }
        expected.set(key, group);
      }
      expect(output.schema.fields.map(field => field.name)).toEqual([
        'trips',
        'kind',
        'category',
        'known',
        'total'
      ]);
      expect(output.getChild('kind')?.type).toBeInstanceOf(arrow.Dictionary);
      expect(output.getChild('category')?.type).toBeInstanceOf(arrow.Dictionary);
      expect(output.toArray().map(row => row.toJSON())).toEqual(
        [...expected.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([, row]) => row)
      );
    }
  } finally {
    result.destroy();
    frame.destroy();
  }
});

it('GPUSQL groups nullable dictionary pairs across batches without confusing null with code zero', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const categoryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Uint32(), 21);
  const serviceType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Uint32(), 22);
  const fields = [
    new arrow.Field('category', categoryType, true),
    new arrow.Field('service', serviceType, true),
    new arrow.Field('fare', new arrow.Float32(), true),
    new arrow.Field('identifier', new arrow.Uint32(), false)
  ];
  const schema = new arrow.Schema(fields);
  const vectors = [
    arrow.vectorFromArray(['economy', null, null, 'premium', null, 'economy', null], categoryType),
    arrow.vectorFromArray(['basic', null, null, null, 'basic', 'basic', 'plus'], serviceType),
    arrow.vectorFromArray([2, null, 4, 8, 16, null, 32], new arrow.Float32()),
    arrow.vectorFromArray([0, 1, 2, 3, 4, 5, 6], new arrow.Uint32())
  ];
  const input = new arrow.Table(
    schema,
    [
      [0, 2],
      [2, 2],
      [2, 5],
      [5, 7]
    ].map(
      ([start, end]) =>
        new arrow.RecordBatch(
          schema,
          arrow.makeData({
            type: new arrow.Struct(fields),
            length: end - start,
            children: vectors.map(vector => vector.slice(start, end).data[0])
          })
        )
    )
  );
  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, input),
    ownership: 'owned'
  });
  try {
    const result = new GPUSQLContext({trips: frame})
      .query(
        'SELECT service AS kind, COUNT(*) AS trips, category, COUNT(fare) AS known, SUM(fare) AS total FROM trips WHERE identifier >= :minimum GROUP BY category, kind',
        {parameters: {minimum: 0}}
      )
      .compile(new GPUCommandGraph(device));
    try {
      for (const minimum of [0, 2, 7, 0]) {
        const encoder = device.createCommandEncoder();
        result.encode(encoder, {minimum});
        device.submit(encoder.finish());
        const rows = await makeArrowTableFromGPUAnalyticsTable({
          table: result.table,
          validity: result.validity,
          dictionaries: result.dictionaries,
          rowIndices: result.rowIndices,
          selectedCounts: result.selectedCounts
        });
        const expected = new Map<
          string,
          {
            kind: string | null;
            category: string | null;
            trips: number;
            known: number;
            total: number | null;
          }
        >();
        for (const {service, category, identifier, fare} of input) {
          if (identifier < minimum) continue;
          const key = JSON.stringify([service, category]);
          const group = expected.get(key) ?? {
            kind: service,
            category,
            trips: 0,
            known: 0,
            total: null
          };
          group.trips++;
          if (fare !== null) {
            group.known++;
            group.total = (group.total ?? 0) + fare;
          }
          expected.set(key, group);
        }

        expect(rows.schema.fields.map(field => [field.name, field.nullable])).toEqual([
          ['kind', true],
          ['trips', false],
          ['category', true],
          ['known', false],
          ['total', true]
        ]);
        expect(rows.getChild('kind')?.type).toBeInstanceOf(arrow.Dictionary);
        expect(rows.getChild('category')?.type).toBeInstanceOf(arrow.Dictionary);
        expect(rows.numRows).toBe(expected.size);
        for (const row of rows) {
          expect(row.toJSON()).toEqual(expected.get(JSON.stringify([row.kind, row.category])));
        }
      }
    } finally {
      result.destroy();
    }
  } finally {
    frame.destroy();
  }
});

it('GPUSQL returns observed aggregates without projecting hidden grouping keys', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable(true)),
    ownership: 'owned'
  });
  const context = new GPUSQLContext({trips: frame});
  try {
    for (const {sql, names, expected} of [
      {
        sql: 'SELECT COUNT(*) AS category, SUM(fare) AS total FROM trips WHERE fare < 5 GROUP BY category',
        names: ['category', 'total'],
        expected: [[1, 3]]
      },
      {
        sql: 'SELECT category AS label, COUNT(*) AS trips FROM trips GROUP BY label, CASE WHEN fare >= 8 THEN 1 ELSE 0 END',
        names: ['label', 'trips'],
        expected: [
          ['economy', 2],
          ['economy', 1],
          ['premium', 2]
        ]
      },
      {
        sql: 'SELECT COUNT(*) AS trips, COUNT(fare) AS known FROM trips GROUP BY NULLIF(fare, 8)',
        names: ['trips', 'known'],
        expected: [
          [1, 1],
          [1, 1],
          [1, 1],
          [2, 1]
        ]
      },
      {
        sql: 'SELECT COUNT(*) AS trips FROM trips WHERE fare > 100 GROUP BY service',
        names: ['trips'],
        expected: []
      }
    ]) {
      const result = context.query(sql).compile(new GPUCommandGraph(device));
      try {
        const encoder = device.createCommandEncoder();
        result.encode(encoder);
        device.submit(encoder.finish());
        const output = await makeArrowTableFromGPUAnalyticsTable({
          table: result.table,
          validity: result.validity,
          dictionaries: result.dictionaries,
          rowIndices: result.rowIndices,
          selectedCounts: result.selectedCounts
        });
        expect(output.schema.fields.map(field => field.name)).toEqual(names);
        expect(Object.keys(result.dictionaries)).toEqual(names.includes('label') ? ['label'] : []);
        expect(Object.keys(result.validity)).toEqual(names.includes('total') ? ['total'] : []);
        expect(Array.from(output, row => names.map(name => row[name]))).toEqual(expected);
      } finally {
        result.destroy();
      }
    }
  } finally {
    frame.destroy();
  }
});

it('GPUSQL feeds unique-right join matches into global and grouped aggregates on the GPU', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const left = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable()),
    ownership: 'owned'
  });
  const rightBatches = [
    arrow.tableFromArrays({
      identifier: Uint32Array.of(20),
      score: arrow.vectorFromArray([6], new arrow.Float32())
    }).batches[0],
    arrow.tableFromArrays({
      identifier: Uint32Array.of(40),
      score: arrow.vectorFromArray([null], new arrow.Float32())
    }).batches[0]
  ];
  const nullableRight = rightBatches[1].schema;
  const rightTable = new arrow.Table(
    nullableRight,
    rightBatches.map(batch => new arrow.RecordBatch(nullableRight, batch.data))
  );
  const right = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, rightTable),
    ownership: 'owned'
  });
  const context = new GPUSQLContext({trips: left, accounts: right});
  try {
    for (const [type, expected] of [
      ['INNER', [2, 2, 18]],
      ['LEFT', [5, 4, 32]],
      ['SEMI', [2, 2, 18]],
      ['ANTI', [3, 2, 14]]
    ] as const) {
      const result = context
        .query(
          `SELECT COUNT(*) AS trips, COUNT(fare) AS known, SUM(fare) AS total FROM trips ${type} JOIN accounts ON accounts.identifier = trips.identifier`
        )
        .compile(new GPUCommandGraph(device));
      try {
        const encoder = device.createCommandEncoder();
        result.encode(encoder);
        device.submit(encoder.finish());
        const rows = await makeArrowTableFromGPUAnalyticsTable({
          table: result.table,
          validity: result.validity
        });
        expect(Array.from(rows, row => [row.trips, row.known, row.total])).toEqual([expected]);
      } finally {
        result.destroy();
      }
    }

    const global = context
      .query(
        'SELECT COUNT(*) AS trips, COUNT(a.score) AS known, SUM(a.score), AVG(a.score) AS average FROM trips t LEFT JOIN accounts a ON t.identifier = a.identifier'
      )
      .compile(new GPUCommandGraph(device));
    try {
      const encoder = device.createCommandEncoder();
      global.encode(encoder);
      device.submit(encoder.finish());
      const rows = await makeArrowTableFromGPUAnalyticsTable({
        table: global.table,
        validity: global.validity
      });
      expect(Array.from(rows, row => [row.trips, row.known, row.sum_score, row.average])).toEqual([
        [5, 1, 6, 6]
      ]);
    } finally {
      global.destroy();
    }

    const grouped = context
      .query(
        'SELECT category, COUNT(*) AS trips, AVG(accounts.score) AS total FROM trips LEFT JOIN accounts ON trips.identifier = accounts.identifier GROUP BY category HAVING COUNT(accounts.score) > 0 ORDER BY total DESC LIMIT 1',
        {maxMeanScratchBytes: 4}
      )
      .compile(new GPUCommandGraph(device));
    try {
      if (!(grouped instanceof CompiledGPUDataFrameGroupedAggregation))
        throw new Error('Expected grouped result');
      const encoder = device.createCommandEncoder();
      grouped.encode(encoder);
      device.submit(encoder.finish());
      const rows = await makeArrowTableFromGPUAnalyticsTable({
        table: grouped.table,
        validity: grouped.validity,
        dictionaries: grouped.dictionaries,
        globalRowIndices: grouped.globalRowIndices,
        globalSelectedCount: grouped.globalSelectedCount
      });
      expect(Array.from(rows, row => [row.category, row.trips, row.total])).toEqual([
        ['premium', 2, 6]
      ]);
    } finally {
      grouped.destroy();
    }
  } finally {
    right.destroy();
    left.destroy();
  }
});

it('GPUSQL applies HAVING after aggregation and before pagination', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable(true)),
    ownership: 'owned'
  });
  const context = new GPUSQLContext({trips: frame});
  try {
    for (const [sql, expected, ordered] of [
      [
        'SELECT category, COUNT(*) AS trips FROM trips GROUP BY category HAVING COUNT(*) >= :minimum ORDER BY trips LIMIT 1',
        [['economy', 3]],
        true
      ],
      [
        'SELECT service, COUNT(*) AS trips, SUM(fare) AS total FROM trips GROUP BY service HAVING total > 15 AND trips >= :minimum',
        [['basic', 3, 18]],
        false
      ],
      [
        'SELECT COUNT(*) AS trips FROM trips WHERE fare > 100 GROUP BY fare HAVING trips = 0',
        [],
        false
      ],
      [
        'SELECT category FROM trips GROUP BY category HAVING SUM(fare + 1) > 17 AND SUM(trips.fare + 1) IS NOT NULL ORDER BY 1',
        [['premium']],
        true
      ]
    ] as const) {
      const result = context
        .query(sql, {parameters: {minimum: 3}})
        .compile(new GPUCommandGraph(device));
      try {
        if (!(result instanceof CompiledGPUDataFrameGroupedAggregation))
          throw new Error('Expected grouped result');
        const encoder = device.createCommandEncoder();
        result.encode(encoder);
        device.submit(encoder.finish());
        const output = await makeArrowTableFromGPUAnalyticsTable({
          table: result.table,
          validity: result.validity,
          dictionaries: result.dictionaries,
          ...(ordered
            ? {
                globalRowIndices: result.globalRowIndices,
                globalSelectedCount: result.globalSelectedCount
              }
            : {rowIndices: result.rowIndices, selectedCounts: result.selectedCounts})
        });
        expect(
          Array.from(output, row => output.schema.fields.map(field => row[field.name]))
        ).toEqual(expected);
      } finally {
        result.destroy();
      }
    }
  } finally {
    frame.destroy();
  }
});

it('GPUSQL applies ORDER BY and pagination after grouping', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable()),
    ownership: 'owned'
  });
  const context = new GPUSQLContext({trips: frame});
  try {
    for (const [sql, expected] of [
      [
        'SELECT category, COUNT(*) AS trips FROM trips GROUP BY category ORDER BY trips ASC LIMIT 1',
        [['premium', 2]]
      ],
      [
        'SELECT COUNT(*) AS trips, SUM(NULLIF(fare, 8)) AS total FROM trips GROUP BY NULLIF(fare, 8) ORDER BY 2 DESC NULLS FIRST, 1 ASC OFFSET 1 LIMIT 2',
        [
          [1, 11],
          [1, 10]
        ]
      ],
      [
        'SELECT COUNT(*) AS trips FROM trips WHERE fare > 100 GROUP BY fare ORDER BY trips LIMIT 1',
        []
      ],
      ['SELECT COUNT(*) AS trips FROM trips GROUP BY fare ORDER BY trips OFFSET 100', []],
      [
        'SELECT category FROM trips GROUP BY category HAVING SUM(fare + 1) > 0 ORDER BY SUM(trips.fare + 1) DESC LIMIT 1',
        [['premium']]
      ],
      [
        'SELECT category FROM trips GROUP BY category ORDER BY SUM(fare) DESC, COUNT(*) ASC OFFSET 1 LIMIT 1',
        [['economy']]
      ],
      [
        'SELECT COUNT(*) AS trips FROM trips GROUP BY NULLIF(fare, 8) ORDER BY SUM(NULLIF(fare, 8)) DESC NULLS FIRST LIMIT 1',
        [[2]]
      ]
    ] as const) {
      const result = context.query(sql).compile(new GPUCommandGraph(device));
      try {
        expect(result).toBeInstanceOf(CompiledGPUDataFrameGroupedAggregation);
        if (!(result instanceof CompiledGPUDataFrameGroupedAggregation))
          throw new Error('Expected grouped result');
        const encoder = device.createCommandEncoder();
        result.encode(encoder);
        device.submit(encoder.finish());
        const output = await makeArrowTableFromGPUAnalyticsTable({
          table: result.table,
          validity: result.validity,
          dictionaries: result.dictionaries,
          globalRowIndices: result.globalRowIndices,
          globalSelectedCount: result.globalSelectedCount
        });
        expect(
          Array.from(output, row => output.schema.fields.map(field => row[field.name]))
        ).toEqual(expected);
      } finally {
        result.destroy();
      }
    }
  } finally {
    frame.destroy();
  }
});

it('GPUSQL groups by a computed key expression, alias, or SELECT position', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable()),
    ownership: 'owned'
  });
  const context = new GPUSQLContext({trips: frame});
  const bucket = 'CASE WHEN fare >= :cutoff THEN 1 WHEN fare IS NULL THEN NULL ELSE 0 END';
  const qualified = bucket.replaceAll('fare', 'trips.fare');
  try {
    for (const reference of ['bucket', '2', qualified]) {
      const result = context
        .query(
          `SELECT COUNT(*) AS trips, ${bucket} AS bucket, SUM(fare + 1) AS total FROM trips GROUP BY ${reference}`,
          {parameters: {cutoff: 8}}
        )
        .compile(new GPUCommandGraph(device));
      try {
        for (const [cutoff, counts, sums] of [
          [8, [1, 3, 1], [4, 32, null]],
          [10, [2, 2, 1], [13, 23, null]]
        ] as const) {
          const encoder = device.createCommandEncoder();
          result.encode(encoder, {cutoff});
          device.submit(encoder.finish());
          const rows = await makeArrowTableFromGPUAnalyticsTable({
            table: result.table,
            validity: result.validity,
            dictionaries: result.dictionaries,
            rowIndices: result.rowIndices,
            selectedCounts: result.selectedCounts
          });
          expect(rows.schema.fields.map(field => field.name)).toEqual(['trips', 'bucket', 'total']);
          expect(Array.from(rows.getChild('bucket') ?? [])).toEqual([0, 1, null]);
          expect(Array.from(rows.getChild('trips') ?? [])).toEqual(counts);
          expect(Array.from(rows.getChild('total') ?? [])).toEqual(sums);
        }
      } finally {
        result.destroy();
      }
    }
  } finally {
    frame.destroy();
  }
});

it('GPUSQL groups numeric keys across Arrow batches and preserves their storage types', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const columns = [
    arrow.vectorFromArray([4294967295, null, 0, 4294967295, null, 0], new arrow.Uint32()),
    arrow.vectorFromArray([-2147483648, -1, 2147483647, -2147483648, -1, null], new arrow.Int32()),
    arrow.vectorFromArray([-0, NaN, Infinity, 0, NaN, null], new arrow.Float32()),
    arrow.vectorFromArray(
      ['other', 'basic', 'basic', 'other', 'basic', null],
      new arrow.Dictionary(new arrow.Utf8(), new arrow.Uint32(), 23)
    ),
    arrow.vectorFromArray([0, 1, 0, 0, 2, 0], new arrow.Uint32())
  ];
  const fields = ['unsignedKey', 'signedKey', 'floatKey', 'category', 'bucket'].map(
    (name, index) => new arrow.Field(name, columns[index].type, true)
  );
  const schema = new arrow.Schema(fields);
  const input = new arrow.Table(
    schema,
    [
      [0, 3],
      [3, 3],
      [3, 6]
    ].map(
      ([start, end]) =>
        new arrow.RecordBatch(
          schema,
          arrow.makeData({
            type: new arrow.Struct(fields),
            length: end - start,
            children: columns.map(column => column.slice(start, end).data[0])
          })
        )
    )
  );
  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, input),
    ownership: 'owned'
  });
  const context = new GPUSQLContext({numbers: frame});
  try {
    for (const {sql, names, types, expected} of [
      {
        sql: 'SELECT floatKey, COUNT(*) AS rows FROM numbers GROUP BY floatKey',
        names: ['floatKey', 'rows'],
        types: [arrow.Float32, arrow.Uint32],
        expected: [
          [0, 2],
          [Infinity, 1],
          [NaN, 2],
          [null, 1]
        ]
      },
      {
        sql: 'SELECT signedKey, unsignedKey, COUNT(*) AS rows FROM numbers GROUP BY unsignedKey, signedKey',
        names: ['signedKey', 'unsignedKey', 'rows'],
        types: [arrow.Int32, arrow.Uint32, arrow.Uint32],
        expected: [
          [2147483647, 0, 1],
          [null, 0, 1],
          [-2147483648, 4294967295, 2],
          [-1, null, 2]
        ]
      },
      {
        sql: 'SELECT category AS label, unsignedKey, COUNT(*) AS rows FROM numbers GROUP BY label, unsignedKey',
        names: ['label', 'unsignedKey', 'rows'],
        types: [arrow.Dictionary, arrow.Uint32, arrow.Uint32],
        expected: [
          ['other', 4294967295, 2],
          ['basic', 0, 1],
          ['basic', null, 2],
          [null, 0, 1]
        ]
      },
      {
        sql: 'SELECT category AS label, unsignedKey, signedKey, floatKey, bucket, COUNT(*) AS rows FROM numbers GROUP BY label, 2, numbers.signedKey, floatKey, bucket',
        names: ['label', 'unsignedKey', 'signedKey', 'floatKey', 'bucket', 'rows'],
        types: [
          arrow.Dictionary,
          arrow.Uint32,
          arrow.Int32,
          arrow.Float32,
          arrow.Uint32,
          arrow.Uint32
        ],
        expected: [
          ['other', 4294967295, -2147483648, 0, 0, 2],
          ['basic', 0, 2147483647, Infinity, 0, 1],
          ['basic', null, -1, NaN, 1, 1],
          ['basic', null, -1, NaN, 2, 1],
          [null, 0, null, null, 0, 1]
        ]
      },
      {
        sql: 'SELECT unsignedKey, COUNT(*) AS rows FROM numbers WHERE unsignedKey IS NOT NULL GROUP BY unsignedKey',
        names: ['unsignedKey', 'rows'],
        types: [arrow.Uint32, arrow.Uint32],
        expected: [
          [0, 2],
          [4294967295, 2]
        ]
      }
    ]) {
      const result = context.query(sql).compile(new GPUCommandGraph(device));
      try {
        const encoder = device.createCommandEncoder();
        result.encode(encoder);
        device.submit(encoder.finish());
        const actual = await makeArrowTableFromGPUAnalyticsTable({
          table: result.table,
          validity: result.validity,
          dictionaries: result.dictionaries,
          rowIndices: result.rowIndices,
          selectedCounts: result.selectedCounts
        });
        expect(actual.schema.fields.map(field => field.name)).toEqual(names);
        types.forEach((type, index) =>
          expect(actual.schema.fields[index].type).toBeInstanceOf(type)
        );
        expect(Array.from(actual, row => names.map(name => row[name]))).toEqual(expected);
      } finally {
        result.destroy();
      }
    }
  } finally {
    frame.destroy();
  }
});

it('GPUSQL returns an empty observed group table for an empty Arrow source', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const frame = new GPUDataFrame({
    ...makeGPUAnalyticsTableFromArrowTable(device, createGPUSQLArrowTable(true, true)),
    ownership: 'owned'
  });
  try {
    const result = new GPUSQLContext({trips: frame})
      .query(
        'SELECT category, service, COUNT(*) AS trips, SUM(fare) AS total FROM trips GROUP BY category, service'
      )
      .compile(new GPUCommandGraph(device));
    try {
      const encoder = device.createCommandEncoder();
      result.encode(encoder);
      device.submit(encoder.finish());
      const output = await makeArrowTableFromGPUAnalyticsTable({
        table: result.table,
        validity: result.validity,
        dictionaries: result.dictionaries,
        rowIndices: result.rowIndices,
        selectedCounts: result.selectedCounts
      });
      expect(output.numRows).toBe(0);
      expect(output.schema.fields.map(field => field.name)).toEqual([
        'category',
        'service',
        'trips',
        'total'
      ]);
    } finally {
      result.destroy();
    }
  } finally {
    frame.destroy();
  }
});

function createGPUSQLArrowTable(includeService = false, empty = false): arrow.Table {
  const dictionaryType = new arrow.Dictionary(new arrow.Utf8(), new arrow.Uint32(), 17, true);
  const dictionary = arrow.vectorFromArray(['economy', 'premium'], new arrow.Utf8());
  const fields = [
    new arrow.Field('identifier', new arrow.Uint32(), false),
    new arrow.Field('fare', new arrow.Float32(), true),
    new arrow.Field('category', dictionaryType, false),
    ...(includeService
      ? [
          new arrow.Field(
            'service',
            new arrow.Dictionary(new arrow.Utf8(), new arrow.Uint32(), 18, true),
            false
          )
        ]
      : [])
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
  const service = new arrow.Vector([
    arrow.makeData({
      type: new arrow.Dictionary(new arrow.Utf8(), new arrow.Uint32(), 18, true),
      length: 5,
      data: Uint32Array.of(0, 0, 1, 0, 1),
      dictionary: arrow.vectorFromArray(['basic', 'plus', 'unused'], new arrow.Utf8())
    })
  ]);
  const ranges = empty
    ? [[0, 0]]
    : [
        [0, 2],
        [2, 2],
        [2, 5]
      ];
  const batches = ranges.map(
    ([start, end]) =>
      new arrow.RecordBatch(
        schema,
        arrow.makeData({
          type: new arrow.Struct(fields),
          length: end - start,
          children: [
            identifiers.slice(start, end).data[0],
            fares.slice(start, end).data[0],
            categories.slice(start, end).data[0],
            ...(includeService ? [service.slice(start, end).data[0]] : [])
          ]
        })
      )
  );
  return new arrow.Table(schema, batches);
}
