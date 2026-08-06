// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';

import type {Buffer} from '@luma.gl/core';
import * as experimentalModule from '@luma.gl/experimental';
import * as luDataFrameModule from '@luma.gl/experimental/ludf';
import {LuDataFrame} from '@luma.gl/experimental/ludf';
import {
  GPUConstant,
  GPUData,
  GPURecordBatch,
  GPUTable,
  GPUVector,
  type GPUField,
  type GPURecordBatchSourceInfo
} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';

describe('@luma.gl/experimental/ludf package boundary', () => {
  test('publishes one optional, Arrow-free, side-effect-free package entry point', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    ) as {
      name?: string;
      sideEffects?: boolean;
      exports?: Record<string, Record<string, string>>;
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };

    expect(packageJson.name).toBe('@luma.gl/experimental');
    expect(packageJson.sideEffects).toBe(false);
    expect(packageJson.exports?.['./ludf']).toEqual({
      import: './dist/ludf/index.js',
      require: './dist/ludf/index.cjs',
      types: './dist/ludf/index.d.ts'
    });
    expect(packageJson.dependencies?.['@luma.gl/tables']).toBeDefined();
    expect(packageJson.dependencies?.['apache-arrow']).toBeUndefined();
    expect(packageJson.peerDependencies?.['apache-arrow']).toBeUndefined();
  });

  test('keeps dataframe runtime exports out of the experimental root entry point', () => {
    expect(luDataFrameModule.LuDataFrame).toBe(LuDataFrame);
    expect(typeof luDataFrameModule.LuDataFrame).toBe('function');
    expect('LuDataFrame' in experimentalModule).toBe(false);
  });
});

describe('LuDataFrame source-table inspection', () => {
  test('preserves schema, source batches, chunk boundaries, and stable source identities', () => {
    const fixture = createDataFrameFixture([2, 0, 3]);
    const frame = new LuDataFrame({table: fixture.table});

    expect(frame.table).toBe(fixture.table);
    expect(frame.ownership).toBe('borrowed');
    expect(frame.numRows).toBe(5);
    expect(frame.numCols).toBe(3);
    expect(frame.columnNames).toEqual(['fare', 'category', 'longitude']);
    expect(frame.schema.fields.map(field => field.name)).toEqual(frame.columnNames);
    expect(frame.schema.metadata.get('dataset')).toBe('ludf-fixture');
    expect(frame.schema.fields[0]?.metadata?.get('unit')).toBe('usd');
    expect(frame.batches.map(batch => batch.numRows)).toEqual([2, 0, 3]);
    expect(frame.sourceInfo).toEqual(fixture.sourceInfo);
    expect(frame.column('fare')).toBe(fixture.table.gpuVectors['fare']);
    expect(frame.column('fare').format).toBe('float32');
    expect(frame.column('category').format).toBe('uint32');
    expect(() => frame.column('missing')).toThrow(/column|missing/i);

    frame.destroy();
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
    fixture.table.destroy();
  });

  test('retains typed schemas with zero source batches and supports zero-column projections', () => {
    const fixture = createDataFrameFixture([]);
    const frame = new LuDataFrame({table: fixture.table});
    const projectedFrame = frame.select(['fare']);
    const emptyProjection = frame.select([]);

    expect(frame.numRows).toBe(0);
    expect(frame.numCols).toBe(3);
    expect(frame.batches).toHaveLength(0);
    expect(frame.sourceInfo).toEqual([]);
    expect(projectedFrame.numRows).toBe(0);
    expect(projectedFrame.columnNames).toEqual(['fare']);
    expect(projectedFrame.batches).toHaveLength(0);
    expect(emptyProjection.numRows).toBe(0);
    expect(emptyProjection.numCols).toBe(0);
    expect(emptyProjection.columnNames).toEqual([]);
    expect(emptyProjection.batches).toEqual([]);

    projectedFrame.destroy();
    emptyProjection.destroy();
    frame.destroy();
    fixture.table.destroy();
  });
});

describe('LuDataFrame non-destructive projections', () => {
  test('borrows original GPU buffers while preserving independent sibling projections', () => {
    const fixture = createDataFrameFixture([2, 0, 3]);
    const tableSelect = vi.spyOn(fixture.table, 'select');
    const createBuffer = vi.spyOn(fixture.device, 'createBuffer');
    const submit = vi.spyOn(fixture.device, 'submit');
    const frame = new LuDataFrame({table: fixture.table});
    const fareProjection = frame.select(['fare']);
    const locationProjection = frame.select(['longitude', 'category']);
    const nestedProjection = locationProjection.select(['category']);
    const emptyProjection = frame.select([]);

    expect(tableSelect).not.toHaveBeenCalled();
    expect(createBuffer).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    expect(fareProjection.ownership).toBe('borrowed');
    expect(fareProjection.columnNames).toEqual(['fare']);
    expect(locationProjection.columnNames).toEqual(['longitude', 'category']);
    expect(nestedProjection.columnNames).toEqual(['category']);
    expect(emptyProjection.columnNames).toEqual([]);
    expect(emptyProjection.numRows).toBe(5);
    expect(emptyProjection.batches.map(batch => batch.numRows)).toEqual([2, 0, 3]);
    expect(fareProjection.sourceInfo).toEqual(fixture.sourceInfo);
    expect(locationProjection.sourceInfo).toEqual(fixture.sourceInfo);
    expect(nestedProjection.sourceInfo).toEqual(fixture.sourceInfo);
    expect(emptyProjection.sourceInfo).toEqual(fixture.sourceInfo);
    expect(fixture.table.schema.fields.map(field => field.name)).toEqual([
      'fare',
      'category',
      'longitude'
    ]);

    for (const [batchIndex, sourceBatch] of fixture.batches.entries()) {
      const projectedFare = fareProjection.batches[batchIndex].gpuData['fare'];
      const projectedCategory = nestedProjection.batches[batchIndex].gpuData['category'];

      expect(projectedFare).not.toBe(sourceBatch.gpuData['fare']);
      expect(projectedFare.buffer).toBe(sourceBatch.gpuData['fare'].buffer);
      expect(projectedFare.ownsBuffer).toBe(false);
      expect(projectedCategory.buffer).toBe(sourceBatch.gpuData['category'].buffer);
      expect(projectedCategory.ownsBuffer).toBe(false);
      expect(Object.keys(sourceBatch.gpuData)).toEqual(['fare', 'category', 'longitude']);
      expect(Object.keys(emptyProjection.batches[batchIndex].gpuData)).toEqual([]);
    }

    locationProjection.destroy();
    expect(nestedProjection.column('category').format).toBe('uint32');
    expect(fareProjection.column('fare').format).toBe('float32');
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);

    fareProjection.destroy();
    nestedProjection.destroy();
    emptyProjection.destroy();
    frame.destroy();
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);

    tableSelect.mockRestore();
    createBuffer.mockRestore();
    submit.mockRestore();
    fixture.table.destroy();
    expect(fixture.buffers.every(buffer => buffer.destroyed)).toBe(true);
  });

  test('rejects unknown columns without mutating the source table', () => {
    const fixture = createDataFrameFixture([2]);
    const frame = new LuDataFrame({table: fixture.table});

    expect(() => frame.select(['fare', 'missing'])).toThrow(/column|missing/i);
    expect(fixture.table.schema.fields.map(field => field.name)).toEqual([
      'fare',
      'category',
      'longitude'
    ]);
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);

    frame.destroy();
    fixture.table.destroy();
  });

  test('preserves requested order for varying columns interleaved with immutable constants', () => {
    const radius = new GPUConstant({format: 'float32', value: Float32Array.of(3.5)});
    const tier = new GPUConstant({format: 'uint32', value: Uint32Array.of(7)});
    const fixture = createDataFrameFixture([2, 0, 3], {constants: {radius, tier}});
    const frame = new LuDataFrame({table: fixture.table});
    const mixedProjection = frame.select(['radius', 'fare', 'tier', 'category']);
    const constantProjection = frame.select(['tier']);

    expect(frame.columnNames).toEqual(['fare', 'category', 'longitude', 'radius', 'tier']);
    expect(mixedProjection.columnNames).toEqual(['radius', 'fare', 'tier', 'category']);
    expect(Object.keys(mixedProjection.table.gpuColumns)).toEqual([
      'radius',
      'fare',
      'tier',
      'category'
    ]);
    expect(mixedProjection.numCols).toBe(4);
    expect(mixedProjection.column('radius')).toBe(radius);
    expect(mixedProjection.column('tier')).toBe(tier);
    expect(mixedProjection.table.gpuConstants['radius']).toBe(radius);
    expect(mixedProjection.table.gpuConstants['tier']).toBe(tier);
    expect(mixedProjection.batches.map(batch => Object.keys(batch.gpuData))).toEqual([
      ['fare', 'category'],
      ['fare', 'category'],
      ['fare', 'category']
    ]);
    expect(mixedProjection.sourceInfo).toEqual(fixture.sourceInfo);
    expect(constantProjection.numRows).toBe(5);
    expect(constantProjection.columnNames).toEqual(['tier']);
    expect(constantProjection.column('tier')).toBe(tier);
    expect(constantProjection.batches.map(batch => batch.numRows)).toEqual([2, 0, 3]);
    expect(constantProjection.batches.map(batch => Object.keys(batch.gpuData))).toEqual([
      [],
      [],
      []
    ]);

    mixedProjection.destroy();
    constantProjection.destroy();
    frame.destroy();
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
    fixture.table.destroy();
  });

  test('isolates projected schema and batch metadata from source and sibling views', () => {
    const fixture = createDataFrameFixture([2, 3]);
    const frame = new LuDataFrame({table: fixture.table});
    const fareProjection = frame.select(['fare']);
    const siblingProjection = frame.select(['fare', 'category']);

    expect(fareProjection.schema.metadata).not.toBe(fixture.table.schema.metadata);
    expect(fareProjection.schema.fields[0]?.metadata).not.toBe(
      fixture.table.schema.fields[0]?.metadata
    );
    expect(fareProjection.batches[0].schema.metadata).not.toBe(fixture.batches[0].schema.metadata);
    expect(fareProjection.batches[0].schema.fields[0]?.metadata).not.toBe(
      fixture.batches[0].schema.fields[0]?.metadata
    );

    fareProjection.schema.metadata.set('dataset', 'projected-dataset');
    fareProjection.schema.fields[0]?.metadata?.set('unit', 'eur');
    fareProjection.batches[0].schema.metadata.set('batch', 'projected-batch');
    fareProjection.batches[0].schema.fields[0]?.metadata?.set('unit', 'cents');

    expect(fixture.table.schema.metadata.get('dataset')).toBe('ludf-fixture');
    expect(fixture.table.schema.fields[0]?.metadata?.get('unit')).toBe('usd');
    expect(fixture.batches[0].schema.metadata.has('batch')).toBe(false);
    expect(fixture.batches[0].schema.fields[0]?.metadata?.get('unit')).toBe('usd');
    expect(siblingProjection.schema.metadata.get('dataset')).toBe('ludf-fixture');
    expect(siblingProjection.schema.fields[0]?.metadata?.get('unit')).toBe('usd');

    fareProjection.destroy();
    siblingProjection.destroy();
    frame.destroy();
    fixture.table.destroy();
  });

  test('rejects duplicate projected names without changing source storage or schema', () => {
    const fixture = createDataFrameFixture([2, 1]);
    const frame = new LuDataFrame({table: fixture.table});

    expect(() => frame.select(['fare', 'fare'])).toThrow(/more than once|duplicate/i);
    expect(frame.columnNames).toEqual(['fare', 'category', 'longitude']);
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);

    frame.destroy();
    fixture.table.destroy();
  });
});

describe('LuDataFrame explicit validity and dictionaries', () => {
  test('preserves GPU-backed validity topology and adapter-owned dictionary metadata', () => {
    const fixture = createDataFrameFixture([2, 0, 3], {nullableFare: true});
    const validity = createValidityVector(fixture.device, 'fare-validity', [2, 0, 3]);
    const dictionary = {values: ['economy', 'premium'] as const, ordered: true};
    const frame = new LuDataFrame({
      table: fixture.table,
      validity: {fare: validity},
      dictionaries: {category: dictionary}
    });
    const fareProjection = frame.select(['fare']);
    const categoryProjection = frame.select(['category']);

    expect(frame.schema.fields[0]?.nullable).toBe(true);
    expect(frame.validity['fare']).toBe(validity);
    expect(frame.validity['fare']?.data.map(data => data.length)).toEqual([2, 0, 3]);
    expect(frame.dictionaries['category']).toBe(dictionary);
    expect(fareProjection.validity['fare']).toBe(validity);
    expect(fareProjection.dictionaries['category']).toBeUndefined();
    expect(categoryProjection.validity['fare']).toBeUndefined();
    expect(categoryProjection.dictionaries['category']).toBe(dictionary);

    fareProjection.destroy();
    categoryProjection.destroy();
    frame.destroy();
    expect(validity.data.every(data => !data.buffer.destroyed)).toBe(true);
    validity.destroy();
    fixture.table.destroy();
  });

  test('rejects missing columns and validity vectors with incompatible row or chunk topology', () => {
    const fixture = createDataFrameFixture([2, 3], {nullableFare: true});
    const missingColumnValidity = createValidityVector(fixture.device, 'missing', [2, 3]);
    const invalidRowCount = createValidityVector(fixture.device, 'invalid-row-count', [2, 2]);
    const invalidChunkCount = createValidityVector(fixture.device, 'invalid-chunk-count', [5]);
    const invalidChunkLengths = createValidityVector(
      fixture.device,
      'invalid-chunk-lengths',
      [1, 4]
    );

    expect(
      () => new LuDataFrame({table: fixture.table, validity: {missing: missingColumnValidity}})
    ).toThrow(/validity|column|missing/i);
    expect(
      () => new LuDataFrame({table: fixture.table, validity: {fare: invalidRowCount}})
    ).toThrow(/validity|length|rows/i);
    expect(
      () => new LuDataFrame({table: fixture.table, validity: {fare: invalidChunkCount}})
    ).toThrow(/validity|batch|chunk/i);
    expect(
      () => new LuDataFrame({table: fixture.table, validity: {fare: invalidChunkLengths}})
    ).toThrow(/validity|batch|chunk/i);
    expect(
      () => new LuDataFrame({table: fixture.table, dictionaries: {missing: ['unknown']}})
    ).toThrow(/dictionary|column|missing/i);

    missingColumnValidity.destroy();
    invalidRowCount.destroy();
    invalidChunkCount.destroy();
    invalidChunkLengths.destroy();
    fixture.table.destroy();
  });

  test('leaves nullable columns explicitly unresolved when no validity sidecar was supplied', () => {
    const fixture = createDataFrameFixture([2, 1], {nullableFare: true});
    const frame = new LuDataFrame({table: fixture.table});
    const projectedFrame = frame.select(['fare']);

    expect(frame.schema.fields[0]?.nullable).toBe(true);
    expect(frame.validity['fare']).toBeUndefined();
    expect(projectedFrame.schema.fields[0]?.nullable).toBe(true);
    expect(projectedFrame.validity['fare']).toBeUndefined();

    projectedFrame.destroy();
    frame.destroy();
    fixture.table.destroy();
  });

  test('rejects non-uint32 validity vectors and sidecars attached to constant columns', () => {
    const radius = new GPUConstant({format: 'float32', value: Float32Array.of(2)});
    const fixture = createDataFrameFixture([2, 3], {constants: {radius}});
    const constantValidity = createValidityVector(fixture.device, 'radius-validity', [2, 3]);

    expect(
      () =>
        // @ts-expect-error Runtime validation also protects callers without TypeScript.
        new LuDataFrame({table: fixture.table, validity: {fare: fixture.table.gpuVectors['fare']}})
    ).toThrow(/validity|uint32/i);
    expect(
      () => new LuDataFrame({table: fixture.table, validity: {radius: constantValidity}})
    ).toThrow(/validity|vector/i);

    constantValidity.destroy();
    fixture.table.destroy();
  });
});

describe('LuDataFrame ownership and destruction', () => {
  test('defers destruction of an owned source until all sibling and nested projections are released', () => {
    const fixture = createDataFrameFixture([2, 0, 3]);
    const validity = createValidityVector(fixture.device, 'fare-validity', [2, 0, 3]);
    const frame = new LuDataFrame({
      table: fixture.table,
      validity: {fare: validity},
      ownership: 'owned'
    });
    const fareProjection = frame.select(['fare']);
    const categoryProjection = frame.select(['category']);
    const nestedProjection = fareProjection.select(['fare']);
    const sourceBuffers = [...fixture.buffers];
    const validityBuffers = validity.data.map(data => data.buffer);

    frame.destroy();
    frame.destroy();
    expect(sourceBuffers.every(buffer => !buffer.destroyed)).toBe(true);
    expect(validityBuffers.every(buffer => !buffer.destroyed)).toBe(true);
    expect(() => frame.column('fare')).toThrow(/destroyed/i);
    expect(() => frame.select(['fare'])).toThrow(/destroyed/i);
    expect(fareProjection.column('fare').format).toBe('float32');

    fareProjection.destroy();
    fareProjection.destroy();
    expect(nestedProjection.column('fare').format).toBe('float32');
    expect(sourceBuffers.every(buffer => !buffer.destroyed)).toBe(true);

    nestedProjection.destroy();
    expect(sourceBuffers.every(buffer => !buffer.destroyed)).toBe(true);
    expect(validityBuffers.every(buffer => !buffer.destroyed)).toBe(true);

    categoryProjection.destroy();
    categoryProjection.destroy();
    expect(sourceBuffers.every(buffer => buffer.destroyed)).toBe(true);
    expect(validityBuffers.every(buffer => buffer.destroyed)).toBe(true);
  });

  test('does not destroy borrowed source storage or borrowed validity sidecars', () => {
    const fixture = createDataFrameFixture([1, 2]);
    const validity = createValidityVector(fixture.device, 'fare-validity', [1, 2]);
    const frame = new LuDataFrame({table: fixture.table, validity: {fare: validity}});
    const projection = frame.select(['fare']);

    frame.destroy();
    projection.destroy();
    projection.destroy();

    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);
    expect(validity.data.every(data => !data.buffer.destroyed)).toBe(true);

    validity.destroy();
    fixture.table.destroy();
  });

  test('rejects invalid runtime ownership values without taking ownership of source buffers', () => {
    const fixture = createDataFrameFixture([2]);

    expect(
      () =>
        // @ts-expect-error Runtime validation also protects callers without TypeScript.
        new LuDataFrame({table: fixture.table, ownership: 'shared'})
    ).toThrow(/ownership|borrowed|owned/i);
    expect(fixture.buffers.every(buffer => !buffer.destroyed)).toBe(true);

    fixture.table.destroy();
  });
});

type LuDataFrameFixture = {
  device: NullDevice;
  table: GPUTable;
  batches: GPURecordBatch[];
  buffers: Buffer[];
  sourceInfo: GPURecordBatchSourceInfo[];
};

type LuDataFrameFixtureOptions = {
  nullableFare?: boolean;
  constants?: Record<string, GPUConstant>;
};

/** Builds owned, uneven GPU batches without requiring a real WebGPU device. */
function createDataFrameFixture(
  rowCounts: readonly number[],
  {nullableFare = false, constants}: LuDataFrameFixtureOptions = {}
): LuDataFrameFixture {
  const device = new NullDevice({id: 'ludf-foundation-fixture'});
  const metadata = new Map([['dataset', 'ludf-fixture']]);
  const fields: GPUField[] = [
    {
      name: 'fare',
      format: 'float32',
      nullable: nullableFare,
      metadata: new Map([['unit', 'usd']])
    },
    {name: 'category', format: 'uint32', nullable: false, metadata: new Map()},
    {name: 'longitude', format: 'float32', nullable: false, metadata: new Map()}
  ];
  const buffers: Buffer[] = [];
  const sourceInfo: GPURecordBatchSourceInfo[] = [];
  let sourceRowIndexOffset = 40;
  const batches = rowCounts.map((rowCount, batchIndex) => {
    const batchSourceInfo: GPURecordBatchSourceInfo = {
      sourceBatchIndex: batchIndex + 4,
      sourceRowIndexOffset,
      sourceRowCount: rowCount
    };
    sourceRowIndexOffset += rowCount;
    sourceInfo.push(batchSourceInfo);

    const gpuData = {
      fare: createGPUData(device, buffers, `fare-${batchIndex}`, 'float32', rowCount),
      category: createGPUData(device, buffers, `category-${batchIndex}`, 'uint32', rowCount),
      longitude: createGPUData(device, buffers, `longitude-${batchIndex}`, 'float32', rowCount)
    };

    return new GPURecordBatch({
      gpuData,
      fields,
      metadata,
      sourceInfo: batchSourceInfo,
      nullCount: nullableFare && rowCount > 0 ? 1 : 0
    });
  });
  const table =
    batches.length > 0
      ? new GPUTable({batches, ...(constants ? {constants} : {})})
      : new GPUTable({schema: {fields, metadata}});

  return {device, table, batches, buffers, sourceInfo};
}

/** Retains a physical buffer for empty chunks while preserving a zero logical row count. */
function createGPUData<Format extends 'float32' | 'uint32'>(
  device: NullDevice,
  buffers: Buffer[],
  identifier: string,
  format: Format,
  rowCount: number
): GPUData<Format> {
  const values =
    format === 'float32'
      ? new Float32Array(Math.max(rowCount, 1))
      : new Uint32Array(Math.max(rowCount, 1));
  const buffer = device.createBuffer({id: identifier, data: values});
  buffers.push(buffer);
  return new GPUData({buffer, format, length: rowCount, ownsBuffer: true});
}

/** Creates an explicit independently owned validity GPUVector with ordered source chunks. */
function createValidityVector(
  device: NullDevice,
  name: string,
  rowCounts: readonly number[]
): GPUVector<'uint32'> {
  const data = rowCounts.map((rowCount, batchIndex) => {
    const buffer = device.createBuffer({
      id: `${name}-${batchIndex}`,
      data: new Uint32Array(Math.max(rowCount, 1)).fill(1)
    });
    return new GPUData({buffer, format: 'uint32', length: rowCount, ownsBuffer: true});
  });

  return new GPUVector({type: 'data', name, format: 'uint32', data, ownsData: true});
}
