// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';

import {parseSQLPredicate} from '@loaders.gl/sql';
import {Buffer} from '@luma.gl/core';
import * as experimentalModule from '@luma.gl/experimental';
import * as luDataFrameModule from '@luma.gl/experimental/gpu-dataframe';
import {GPUDataFrame as LuDataFrame} from '@luma.gl/experimental/gpu-dataframe';
import * as sqlModule from '@luma.gl/experimental/gpu-sql';
import {
  LuSQLContext,
  LuSQLQuery,
  makeGPUExpressionFromSQLPredicate,
  planGPUDataFrameQuery
} from '@luma.gl/experimental/gpu-sql';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';

type LuSQLFixtureColumns = {fare: 'float32'; category: 'uint32'; identifier: 'uint32'};

describe('LuSQL immutable GPU dataframe planning', () => {
  test('publishes SQL and the loaders.gl planner adapter through its optional package subpath', () => {
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
    expect(packageJson.dependencies?.['@loaders.gl/sql']).toBe('~5.0.0-alpha.3');
    expect(packageJson.dependencies?.['apache-arrow']).toBeUndefined();
    expect(sqlModule.LuSQLContext).toBe(LuSQLContext);
    expect('LuSQLContext' in experimentalModule).toBe(false);
    expect('LuSQLContext' in luDataFrameModule).toBe(false);
  });

  test('lowers loaders.gl predicate syntax, projection, and reusable parameters without GPU work', () => {
    const {device, frame} = createLuSQLNodeFixture();
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
        category: createLuSQLNodeData(device, Uint32Array.of(0, 1), 'uint32')
      },
      fields: [
        {name: 'position', format: 'float32x3', nullable: false},
        {name: 'category', format: 'uint32', nullable: false}
      ]
    });
    const frame = new LuDataFrame({
      table: new GPUTable({batches: [batch]}),
      ownership: 'owned'
    });
    const query = planGPUDataFrameQuery(frame, {columns: ['category']});

    expect(query.predicates).toEqual([]);
    expect(query.selectedColumns).toEqual(['category']);
    frame.destroy();
  });

  test('plans projections, named parameters, arithmetic, global ordering, and limits without GPU work', () => {
    const {device, frame} = createLuSQLNodeFixture();
    const createBuffer = vi.spyOn(device, 'createBuffer');
    const submit = vi.spyOn(device, 'submit');
    const context = new LuSQLContext({trips: frame});

    const query = context.query(
      'SELECT fare, fare * 2 AS doubled FROM trips WHERE fare >= :minimum ORDER BY fare DESC NULLS LAST LIMIT 2',
      {parameters: {minimum: 5}}
    );

    expect(query).toBeInstanceOf(LuSQLQuery);
    expect(Object.isFrozen(query)).toBe(true);
    expect(query.sql).toContain('ORDER BY fare DESC');
    expect(createBuffer).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    submit.mockRestore();
    frame.destroy();
  });

  test('lowers global and dictionary-backed grouped aggregates without GPU allocation', () => {
    const {device, frame} = createLuSQLNodeFixture();
    const createBuffer = vi.spyOn(device, 'createBuffer');
    const context = new LuSQLContext({trips: frame});

    expect(
      context.query('SELECT COUNT(*) AS rows, SUM(fare) AS total, AVG(fare) AS average FROM trips')
    ).toBeInstanceOf(LuSQLQuery);
    expect(
      context.query(
        'SELECT category, COUNT(*) AS count, SUM(fare) AS total FROM trips GROUP BY category'
      )
    ).toBeInstanceOf(LuSQLQuery);
    expect(createBuffer).not.toHaveBeenCalled();

    createBuffer.mockRestore();
    frame.destroy();
  });

  test('plans inner, left outer, semi, and anti joins against explicit registered GPU tables', () => {
    const left = createLuSQLNodeFixture();
    const right = createLuSQLNodeFixture();
    const context = new LuSQLContext({trips: left.frame, accounts: right.frame});
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
          `SELECT source.identifier FROM trips AS source ${operator} accounts AS target ON source.identifier = target.identifier`
        )
      ).toBeInstanceOf(LuSQLQuery);
    }

    left.frame.destroy();
    right.frame.destroy();
  });

  test('preserves nullable predicate precedence and rejects unsupported or ambiguous SQL eagerly', () => {
    const {frame} = createLuSQLNodeFixture();
    const context = new LuSQLContext({trips: frame});

    expect(
      context.query(
        'SELECT fare FROM trips WHERE fare IS NULL OR NOT (fare < 4 AND fare IS NOT NULL)'
      )
    ).toBeInstanceOf(LuSQLQuery);
    expect(() => context.query('DELETE FROM trips')).toThrow(/SELECT/i);
    expect(() => context.query('SELECT missing FROM trips')).toThrow(/exist/i);
    expect(() => context.query('SELECT fare FROM missing')).toThrow(/registered/i);
    expect(() => context.query('SELECT fare FROM trips WHERE fare > :minimum')).toThrow(
      /parameter/i
    );
    expect(() => context.query('SELECT fare + 1 FROM trips')).toThrow(/alias/i);
    expect(() => context.query('SELECT COUNT(fare) FROM trips')).toThrow(/COUNT\(\*\)/i);
    expect(() => context.query('SELECT fare FROM trips LIMIT 1')).toThrow(/ORDER BY/i);
    expect(() => context.query('SELECT fare FROM trips ORDER BY fare, identifier')).toThrow(
      /one ORDER BY/i
    );
    expect(() => context.query('SELECT * FROM trips; DROP TABLE trips')).toThrow(/unexpected/i);
    expect(() => context.query("SELECT fare FROM trips WHERE fare = 'unsafe'")).toThrow(
      /unsupported token/i
    );
    expect(() => new LuSQLContext({'invalid-name': frame})).toThrow(/valid names/i);

    frame.destroy();
  });
});

function createLuSQLNodeFixture(): {device: NullDevice; frame: LuDataFrame<LuSQLFixtureColumns>} {
  const device = new NullDevice({id: 'ludf-sql-node'});
  const values = {
    fare: Float32Array.of(4, 8, 12),
    category: Uint32Array.of(0, 1, 0),
    identifier: Uint32Array.of(10, 20, 30)
  };
  const batch = new GPURecordBatch<LuSQLFixtureColumns>({
    gpuData: {
      fare: createLuSQLNodeData(device, values.fare, 'float32'),
      category: createLuSQLNodeData(device, values.category, 'uint32'),
      identifier: createLuSQLNodeData(device, values.identifier, 'uint32')
    },
    fields: [
      {name: 'fare', format: 'float32', nullable: false},
      {name: 'category', format: 'uint32', nullable: false},
      {name: 'identifier', format: 'uint32', nullable: false}
    ]
  });
  return {
    device,
    frame: new LuDataFrame({
      table: new GPUTable({batches: [batch]}),
      dictionaries: {category: {values: ['economy', 'premium'], ordered: false}},
      ownership: 'owned'
    })
  };
}

function createLuSQLNodeData<Format extends 'float32' | 'uint32'>(
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
