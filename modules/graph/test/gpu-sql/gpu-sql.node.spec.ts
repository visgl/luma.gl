// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';

import {
  makeGPUExpressionFromSQLPredicate,
  planGPUDataFrameQuery
} from '../../../../examples/experimental/gpu-data-analysis/src/loaders-sql-query';
import {parseSQLPredicate} from '@loaders.gl/sql';
import {Buffer} from '@luma.gl/core';
import * as graphRootModule from '@luma.gl/graph';
import * as luDataFrameModule from '@luma.gl/graph/gpu-dataframe';
import {GPUDataFrame} from '@luma.gl/graph/gpu-dataframe';
import * as sqlModule from '@luma.gl/graph/gpu-sql';
import {GPUSQLContext, GPUSQLQuery} from '@luma.gl/graph/gpu-sql';
import {GPUData} from '@luma.gl/graph/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/graph/gpu-tables';
import {NullDevice} from '@luma.gl/core/test-utils';
import {describe, expect, test, vi} from 'vitest';

type GPUSQLFixtureColumns = {fare: 'float32'; category: 'uint32'; identifier: 'uint32'};

describe('GPUSQL immutable GPU dataframe planning', () => {
  test('publishes native SQL without a loaders.gl package dependency', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    ) as {
      sideEffects?: boolean;
      exports?: Record<string, Record<string, string>>;
      dependencies?: Record<string, string>;
    };

    expect(packageJson.exports?.['./gpu-sql']).toEqual({
      types: './dist/gpu-sql/index.d.ts',
      import: './dist/gpu-sql/index.js',
      require: './dist/gpu-sql/index.cjs'
    });
    expect(packageJson.sideEffects).toBe(false);
    expect(packageJson.dependencies?.['@loaders.gl/sql']).toBeUndefined();
    expect('planGPUDataFrameQuery' in sqlModule).toBe(false);
    expect(packageJson.dependencies?.['apache-arrow']).toBeUndefined();
    expect(sqlModule.GPUSQLContext).toBe(GPUSQLContext);
    expect('GPUSQLContext' in graphRootModule).toBe(false);
    expect('GPUSQLContext' in luDataFrameModule).toBe(false);
  });

  test('lowers loaders.gl predicate syntax, projection, and reusable parameters without GPU work', () => {
    const {device, frame} = createGPUSQLNodeFixture();
    const createBuffer = vi.spyOn(device, 'createBuffer');
    const submit = vi.spyOn(device, 'submit');
    const predicate = parseSQLPredicate('fare >= :minimum AND category IN (0, 1)', {
      preserveParameters: true
    });
    const query = planGPUDataFrameQuery(frame, {
      predicate,
      columns: ['category'],
      parameters: {minimum: 5}
    });

    expect(query.selectedColumns).toEqual(['category']);
    expect(query.predicates).toHaveLength(1);
    expect(query.predicates[0].node).toEqual(
      makeGPUExpressionFromSQLPredicate(predicate, {minimum: 5}).node
    );
    expect(createBuffer).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    expect(() => planGPUDataFrameQuery(frame, {predicate})).toThrow(/parameter/i);
    expect(() =>
      planGPUDataFrameQuery(frame, {predicate: parseSQLPredicate("fare = 'premium'")})
    ).toThrow(/finite number, boolean, or null/i);
    expect(() => planGPUDataFrameQuery(frame, {limit: 1})).toThrow(/source-ordered limits/i);

    createBuffer.mockRestore();
    submit.mockRestore();
    frame.destroy();
  });

  test('compiles projection-only plans without binding an arbitrary source column', () => {
    const device = new NullDevice({id: 'loaders-sql-projection-only-node'});
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
        category: createGPUSQLNodeData(device, Uint32Array.of(0, 1), 'uint32')
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
    const query = planGPUDataFrameQuery(frame, {columns: ['category']});

    expect(query.predicates).toEqual([]);
    expect(query.selectedColumns).toEqual(['category']);
    frame.destroy();
  });

  test('plans projections, named parameters, arithmetic, global ordering, and limits without GPU work', () => {
    const {device, frame} = createGPUSQLNodeFixture();
    const createBuffer = vi.spyOn(device, 'createBuffer');
    const submit = vi.spyOn(device, 'submit');
    const context = new GPUSQLContext({trips: frame});

    const query = context.query(
      'SELECT fare, fare * 2 AS doubled FROM trips WHERE trips.fare >= :limit ORDER BY fare DESC NULLS LAST LIMIT 2',
      {parameters: {limit: 5}}
    );

    expect(query).toBeInstanceOf(GPUSQLQuery);
    expect(Object.isFrozen(query)).toBe(true);
    expect(query.sql).toContain('ORDER BY fare DESC');
    expect(createBuffer).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    submit.mockRestore();
    frame.destroy();
  });

  test('matches quoted column names exactly and keeps SQL keywords case-insensitive', () => {
    const device = new NullDevice({id: 'ludf-sql-keyword-columns'});
    const batch = new GPURecordBatch({
      gpuData: {
        limit: createGPUSQLNodeData(device, Float32Array.of(4), 'float32'),
        Limit: createGPUSQLNodeData(device, Float32Array.of(6), 'float32'),
        order: createGPUSQLNodeData(device, Float32Array.of(8), 'float32'),
        'trips.limit': createGPUSQLNodeData(device, Float32Array.of(10), 'float32')
      },
      fields: [
        {name: 'limit', format: 'float32', nullable: false},
        {name: 'Limit', format: 'float32', nullable: false},
        {name: 'order', format: 'float32', nullable: false},
        {name: 'trips.limit', format: 'float32', nullable: false}
      ]
    });
    const frame = new GPUDataFrame({table: new GPUTable({batches: [batch]}), ownership: 'owned'});
    const context = new GPUSQLContext({trips: frame});

    expect(
      context.query('SELECT "trips.limit", trips."limit" FROM trips ORDER BY "trips.limit"')
    ).toBeInstanceOf(GPUSQLQuery);
    expect(
      context.query('SELECT SUM("trips.limit"), SUM(trips."limit") FROM trips')
    ).toBeInstanceOf(GPUSQLQuery);
    expect(() => context.query('SELECT missing."trips.limit" FROM trips')).toThrow(/qualifier/);
    expect(context.query('sElEcT "limit", "Limit" fRoM trips')).toBeInstanceOf(GPUSQLQuery);
    expect(() => context.query('SELECT limit FROM trips')).toThrow(/SQL expression/i);
    expect(() => context.query('SELECT "LIMIT" FROM trips')).toThrow(/does not exist/);
    expect(
      context.query(
        'SELECT trips."limit", "order" FROM trips WHERE "order" > "limit" ORDER BY "order" LIMIT 1'
      )
    ).toBeInstanceOf(GPUSQLQuery);

    frame.destroy();
  });

  test('lowers global and dictionary-backed grouped aggregates without GPU allocation', () => {
    const {device, frame} = createGPUSQLNodeFixture();
    const createBuffer = vi.spyOn(device, 'createBuffer');
    const context = new GPUSQLContext({trips: frame});

    expect(
      context.query('SELECT COUNT(*) AS rows, SUM(fare) AS total, AVG(fare) AS average FROM trips')
    ).toBeInstanceOf(GPUSQLQuery);
    expect(
      context.query(
        'SELECT category, COUNT(*) AS count, SUM(fare) AS total FROM trips GROUP BY category'
      )
    ).toBeInstanceOf(GPUSQLQuery);
    expect(createBuffer).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    frame.destroy();
  });

  test('plans inner, left outer, semi, and anti joins against explicit registered GPU tables', () => {
    const left = createGPUSQLNodeFixture();
    const right = createGPUSQLNodeFixture();
    const context = new GPUSQLContext({trips: left.frame, accounts: right.frame});
    for (const operator of [
      'JOIN',
      'INNER JOIN',
      'LEFT JOIN',
      'LEFT OUTER JOIN',
      'SEMI JOIN',
      'ANTI JOIN'
    ]) {
      expect(
        context.query(
          `SELECT source.fare FROM trips AS source ${operator} accounts AS target ON source.identifier = target.identifier`
        )
      ).toBeInstanceOf(GPUSQLQuery);
    }

    for (const equality of [
      'target.identifier = source.identifier',
      'target.identifier = identifier'
    ]) {
      expect(
        context.query(
          `SELECT source.identifier FROM trips AS source LEFT JOIN accounts AS target ON ${equality}`
        )
      ).toBeInstanceOf(GPUSQLQuery);
    }
    expect(() =>
      context.query(
        'SELECT source.identifier FROM trips AS source JOIN accounts AS target ON source.identifier = source.identifier'
      )
    ).toThrow(/qualifier/);

    expect(() =>
      context.query(
        'SELECT source.fare FROM trips AS source JOIN accounts AS target ON identifier = identifier'
      )
    ).toThrow(/ambiguous/i);

    left.frame.destroy();
    right.frame.destroy();
  });

  test('preserves nullable predicate precedence and rejects unsupported or ambiguous SQL eagerly', () => {
    const {frame} = createGPUSQLNodeFixture();
    const context = new GPUSQLContext({trips: frame});

    expect(
      context.query(
        'SELECT fare FROM trips WHERE fare IS NULL OR NOT (fare < 4 AND fare IS NOT NULL)'
      )
    ).toBeInstanceOf(GPUSQLQuery);
    expect(() =>
      context.query('SELECT * FROM trips CROSS JOIN UNNEST(fare) AS other(value)')
    ).toThrow(/does not support JOIN UNNEST/i);
    expect(() => context.query('SELECT * FROM trips(trips)')).toThrow(/table functions/i);
    expect(() =>
      context.query('SELECT * FROM trips JOIN trips(trips) AS other ON trips.fare = other.fare')
    ).toThrow(/table functions/i);
    expect(() => context.query('SELECT COUNT("*") FROM trips')).toThrow(/does not exist/);
    expect(() => context.query('SELECT ":missing" FROM trips')).toThrow(/column.*does not exist/i);
    expect(() => context.query('DELETE FROM trips')).toThrow(/SELECT/i);
    expect(() => context.query('SELECT missing FROM trips')).toThrow(/exist/i);
    expect(() => context.query('SELECT fare FROM missing')).toThrow(/registered/i);
    expect(() => context.query('SELECT fare FROM trips WHERE fare > :minimum')).toThrow(
      /parameter/i
    );
    expect(() =>
      context.query('SELECT fare FROM trips WHERE trips.fare NOT IN (:minimum, NULL)', {
        parameters: {minimum: 4}
      })
    ).not.toThrow();
    expect(() => context.query('SELECT fare FROM trips WHERE fare IN (identifier)')).toThrow(
      /literal or parameter/
    );
    const oversized = Array.from({length: 65}, (_, index) => index).join(', ');
    expect(() => context.query(`SELECT fare FROM trips WHERE fare IN (${oversized})`)).toThrow(
      /64 candidates/
    );
    expect(() => context.query('SELECT fare + 1 FROM trips')).toThrow(/alias/i);
    expect(context.query('SELECT COUNT(fare) FROM trips')).toBeInstanceOf(GPUSQLQuery);
    expect(
      context.query('SELECT SUM(fare * :scale) AS scaled FROM trips', {
        parameters: {scale: 2}
      })
    ).toBeInstanceOf(GPUSQLQuery);
    expect(() => context.query('SELECT SUM(fare * 2) FROM trips')).toThrow(/explicit AS alias/);
    expect(() => context.query('SELECT SUM(missing * 2) AS total FROM trips')).toThrow(
      /does not exist/
    );
    expect(() => context.query('SELECT fare FROM trips LIMIT 1')).toThrow(/ORDER BY/i);
    expect(() => context.query('SELECT fare FROM trips GROUP BY 0')).toThrow(/aggregation/);
    expect(() =>
      context.query(
        'SELECT category, identifier, COUNT(*) FROM trips GROUP BY category, identifier'
      )
    ).not.toThrow();
    expect(() =>
      context.query('SELECT category, COUNT(*) FROM trips GROUP BY category, category')
    ).toThrow(/each GROUP BY key exactly once/);
    expect(() =>
      context.query(
        'SELECT category, identifier, fare, COUNT(*) FROM trips GROUP BY category, identifier, fare'
      )
    ).not.toThrow();

    expect(context.query('SELECT * FROM trips ORDER BY 1')).toBeInstanceOf(GPUSQLQuery);
    for (const position of [0, 1.5, 2]) {
      expect(() => context.query(`SELECT fare FROM trips ORDER BY ${position}`)).toThrow(
        /one-based SELECT column/
      );
    }
    expect(() => context.query('SELECT category, COUNT(*) FROM trips GROUP BY 2')).toThrow(
      /group key directly/
    );
    expect(() => context.query('SELECT category, COUNT(*) FROM trips GROUP BY 0')).toThrow(
      /one-based SELECT column/
    );
    expect(() => context.query('SELECT fare FROM trips OFFSET 1')).toThrow(/ORDER BY/i);
    expect(() => context.query('SELECT fare FROM trips ORDER BY fare OFFSET 1')).not.toThrow();
    expect(() => context.query('SELECT fare FROM trips ORDER BY fare OFFSET 4294967296')).toThrow(
      /OFFSET.*32-bit/i
    );
    expect(
      context.query('SELECT fare FROM trips ORDER BY fare NULLS FIRST, identifier DESC')
    ).toBeInstanceOf(GPUSQLQuery);
    expect(() => context.query('SELECT fare FROM trips ORDER BY fare, 2')).toThrow(
      /one-based SELECT column/
    );
    expect(() => context.query('SELECT * FROM trips; DROP TABLE trips')).toThrow(
      /unsupported SQL query syntax/i
    );
    expect(() => context.query("SELECT fare FROM trips WHERE fare = 'unsafe'")).toThrow(
      /does not support SQL expression/i
    );
    expect(() => new GPUSQLContext({'invalid-name': frame})).toThrow(/valid names/i);

    frame.destroy();
  });
});

function createGPUSQLNodeFixture(): {
  device: NullDevice;
  frame: GPUDataFrame<GPUSQLFixtureColumns>;
} {
  const device = new NullDevice({id: 'ludf-sql-node'});
  const values = {
    fare: Float32Array.of(4, 8, 12),
    category: Uint32Array.of(0, 1, 0),
    identifier: Uint32Array.of(10, 20, 30)
  };
  const batch = new GPURecordBatch<GPUSQLFixtureColumns>({
    gpuData: {
      fare: createGPUSQLNodeData(device, values.fare, 'float32'),
      category: createGPUSQLNodeData(device, values.category, 'uint32'),
      identifier: createGPUSQLNodeData(device, values.identifier, 'uint32')
    },
    fields: [
      {name: 'fare', format: 'float32', nullable: false},
      {name: 'category', format: 'uint32', nullable: false},
      {name: 'identifier', format: 'uint32', nullable: false}
    ]
  });
  return {
    device,
    frame: new GPUDataFrame({
      table: new GPUTable({batches: [batch]}),
      dictionaries: {category: {values: ['economy', 'premium'], ordered: false}},
      ownership: 'owned'
    })
  };
}

function createGPUSQLNodeData<Format extends 'float32' | 'uint32'>(
  device: NullDevice,
  values: Float32Array | Uint32Array,
  format: Format
): GPUData<Format> {
  return new GPUData({
    buffer: device.createBuffer({
      data: values,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    }),
    format,
    length: values.length,
    ownsBuffer: true
  });
}
