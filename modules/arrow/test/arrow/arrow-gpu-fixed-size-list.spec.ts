// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  makeArrowFixedSizeListVector,
  makeGPUDataFromArrowData,
  makeGPURecordBatchFromArrowRecordBatch,
  makeGPUTableFromArrowTable,
  makeGPUVectorFromArrow,
  readArrowGPUDataAsync,
  readArrowGPUVectorAsync,
  type GPUVectorFormatForArrowType
} from '@luma.gl/arrow';
import type {ShaderLayout} from '@luma.gl/core';
import {GPUData, GPURecordBatch, GPUTable, GPUVector, type GPUVectorFormat} from '@luma.gl/tables';
import {getWebGPUTestDevice, NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import {expectTypeOf} from 'vitest';

type ArrowEmbeddingType = arrow.FixedSizeList<arrow.Float32>;

test('unmapped Float16 fixed-size lists retain a usable broad GPU vector format', t => {
  const device = new NullDevice({});
  const source = makeArrowFixedSizeListVector(
    new arrow.Float16(),
    4,
    new Uint16Array([0x3c00, 0x4000, 0x4200, 0x4400])
  );
  const vector = makeGPUVectorFromArrow(device, source);

  expectTypeOf<
    GPUVectorFormatForArrowType<arrow.FixedSizeList<arrow.Float16>>
  >().toEqualTypeOf<GPUVectorFormat>();
  expectTypeOf(vector).toEqualTypeOf<GPUVector<GPUVectorFormat>>();
  t.equal(vector.format, 'float16x4', 'retains the supported runtime Float16 vertex format');

  vector.destroy();
  t.end();
});

test('Arrow GPU adapters represent high-dimensional FixedSizeList rows as table-native storage', async t => {
  const device = new NullDevice({});

  for (const dimensions of [5, 384, 768, 1536]) {
    const values = Float32Array.from({length: dimensions * 2}, (_, index) => index + 0.5);
    const source = makeArrowEmbeddingVector(dimensions, values);
    const data = makeGPUDataFromArrowData(device, source.data[0]);
    const vector = makeGPUVectorFromArrow(device, source, {name: 'embedding'});

    t.equal(data.format, `fixed-size-list<float32,${dimensions}>`, 'data retains its row shape');
    t.equal(
      vector.format,
      `fixed-size-list<float32,${dimensions}>`,
      'vector retains its row shape'
    );
    t.equal(data.length, 2, 'GPUData length counts logical rows');
    t.equal(vector.length, 2, 'GPUVector length counts logical rows');
    t.equal(data.valueLength, values.length, 'GPUData value length counts flattened values');
    t.equal(vector.valueLength, values.length, 'GPUVector value length counts flattened values');
    t.equal(data.stride, dimensions, 'GPUData stride retains flattened row coordinates');
    t.equal(vector.byteStride, dimensions * Float32Array.BYTES_PER_ELEMENT, 'retains row bytes');
    t.deepEqual(await readFloat32Data(data), values, 'GPUData uploads the original coordinates');
    t.deepEqual(
      await readFloat32Data(vector.data[0]),
      values,
      'GPUVector uploads the original coordinates'
    );

    const dataBuffer = data.buffer;
    const vectorBuffer = vector.data[0].buffer;
    data.destroy();
    vector.destroy();
    t.ok(dataBuffer.destroyed, 'GPUData destroys its own buffer');
    t.ok(vectorBuffer.destroyed, 'GPUVector destroys its owned chunk');
  }

  t.end();
});

test('Arrow GPU adapters preserve existing short vertex formats and explicitly requested storage rows', t => {
  const device = new NullDevice({});

  for (const dimensions of [1, 2, 3, 4]) {
    const source = makeArrowEmbeddingVector(dimensions, Float32Array.from({length: dimensions}));
    const vertex = makeGPUVectorFromArrow(device, source);
    const storage = makeGPUVectorFromArrow(device, source, {
      format: `fixed-size-list<float32,${dimensions}>`
    });

    t.equal(
      vertex.format,
      dimensions === 1 ? 'float32' : `float32x${dimensions}`,
      'default short rows remain compatible with existing vertex attributes'
    );
    t.equal(
      storage.format,
      `fixed-size-list<float32,${dimensions}>`,
      'explicit short storage rows retain a first-class fixed-size-list format'
    );
    t.equal(storage.length, 1, 'explicit storage rows remain row oriented');
    t.equal(storage.valueLength, dimensions, 'explicit storage rows expose flattened values');

    vertex.destroy();
    storage.destroy();
  }

  t.end();
});

test('Arrow GPU vectors preserve original FixedSizeList chunks, including empty chunks', async t => {
  const device = new NullDevice({});
  const source = new arrow.Vector<ArrowEmbeddingType>([
    makeArrowEmbeddingData(5, new Float32Array([1, 2, 3, 4, 5])),
    makeArrowEmbeddingData(5, new Float32Array(0)),
    makeArrowEmbeddingData(5, new Float32Array([6, 7, 8, 9, 10, 11, 12, 13, 14, 15]))
  ]);
  const vector = makeGPUVectorFromArrow(device, source);

  t.deepEqual(
    vector.data.map(data => data.length),
    [1, 0, 2],
    'every source chunk, including an empty chunk, remains independently owned'
  );
  t.deepEqual(
    vector.data.map(data => data.valueLength),
    [5, 0, 10],
    'flattened coordinates remain chunk aligned'
  );
  t.equal(vector.length, 3, 'aggregate vectors count rows');
  t.equal(vector.valueLength, 15, 'aggregate vectors count flattened coordinates');
  t.deepEqual(
    Array.from(await readFloat32Data(vector.data[2])),
    [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    'later source chunks start at their own allocation'
  );

  const reconstructed = await readArrowGPUVectorAsync<ArrowEmbeddingType>(vector);
  t.equal(reconstructed.data.length, 3, 'Arrow readback preserves all source chunk boundaries');
  vector.destroy();
  t.end();
});

test('explicit non-null FixedSizeList compaction preserves flattened row metadata', async t => {
  const device = new NullDevice({});
  const source = new arrow.Vector<ArrowEmbeddingType>([
    makeArrowEmbeddingData(5, new Float32Array([1, 2, 3, 4, 5])),
    makeArrowEmbeddingData(5, new Float32Array([6, 7, 8, 9, 10]))
  ]);
  const vector = makeGPUVectorFromArrow(device, source, {preserveDataChunks: false});

  t.equal(vector.data.length, 1, 'explicit compaction combines source chunks only when requested');
  t.equal(vector.length, 2, 'packed fixed-list columns retain logical row counts');
  t.equal(vector.valueLength, 10, 'packed fixed-list columns retain flattened value counts');
  t.deepEqual(
    Array.from(await readFloat32Data(vector.data[0])),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    'explicit compaction retains every source coordinate'
  );

  const sourceIds = new arrow.Vector<arrow.Uint32>([
    arrow.makeData({type: new arrow.Uint32(), length: 1, data: new Uint32Array([11])}),
    arrow.makeData({type: new arrow.Uint32(), length: 1, data: new Uint32Array([22])})
  ]);
  const compactIds = makeGPUVectorFromArrow(device, sourceIds, {preserveDataChunks: false});
  t.equal(compactIds.data.length, 1, 'explicit non-null scalar compaction remains supported');
  t.deepEqual(
    Array.from(await readUint32Data(compactIds.data[0])),
    [11, 22],
    'packed non-null source IDs retain their original values'
  );
  t.notOk(
    compactIds.data[0].nullBitmap,
    'non-null source IDs retain the allocation-free fast path'
  );

  vector.destroy();
  compactIds.destroy();
  t.end();
});

test('nullable FixedSizeList compaction is rejected rather than discarding Arrow validity', t => {
  const device = new NullDevice({});
  const parentNulls = arrow.vectorFromArray(
    [[1, 2, 3, 4, 5], null],
    makeArrowEmbeddingType(5)
  ) as arrow.Vector<ArrowEmbeddingType>;
  const childNulls = arrow.vectorFromArray(
    [[1, null, 3, 4, 5]],
    makeArrowEmbeddingType(5)
  ) as arrow.Vector<ArrowEmbeddingType>;
  const shortParentNulls = arrow.vectorFromArray(
    [[1, 2, 3], null],
    makeArrowEmbeddingType(3)
  ) as arrow.Vector<ArrowEmbeddingType>;

  for (const source of [parentNulls, childNulls, shortParentNulls]) {
    t.throws(
      () => makeGPUVectorFromArrow(device, source, {preserveDataChunks: false}),
      /require preserved GPU data chunks/,
      'explicit packing cannot silently discard nullable parent or child metadata'
    );
  }

  const nullableSourceIds = arrow.vectorFromArray([11, null, 22], new arrow.Uint32());
  t.throws(
    () => makeGPUVectorFromArrow(device, nullableSourceIds, {preserveDataChunks: false}),
    /require preserved GPU data chunks/,
    'nullable scalar source IDs cannot be compacted into invented valid zero IDs'
  );

  t.end();
});

test('Arrow FixedSizeList uploads apply parent and child displacements exactly once', async t => {
  const device = new NullDevice({});
  const backingValues = Float32Array.from({length: 32}, (_, index) => index);
  const child = new arrow.Data<arrow.Float32>(new arrow.Float32(), 2, 20, 0, {
    [arrow.BufferType.DATA]: backingValues
  });
  const parent = new arrow.Data<ArrowEmbeddingType>(makeArrowEmbeddingType(5), 1, 2, 0, {}, [
    child
  ]);
  const independentOffsets = makeGPUVectorFromArrow(device, new arrow.Vector([parent]));

  t.deepEqual(
    Array.from(await readFloat32Data(independentOffsets.data[0])),
    [7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    'independent parent and child offsets each contribute once'
  );

  const source = makeArrowEmbeddingVector(
    5,
    Float32Array.from({length: 20}, (_, index) => index)
  );
  const sliced = makeGPUVectorFromArrow(device, source.slice(1, 3));
  t.deepEqual(
    Array.from(await readFloat32Data(sliced.data[0])),
    [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    'already-sliced Arrow child views are not displaced a second time'
  );

  independentOffsets.destroy();
  sliced.destroy();
  t.end();
});

test('nullable FixedSizeList Arrow readback preserves parent and child validity', async t => {
  const device = new NullDevice({});
  const source = arrow.vectorFromArray(
    [[0, 1, 2, 3, 4], null, [10, null, 12, 13, 14], [15, 16, 17, 18, 19]],
    makeArrowEmbeddingType(5)
  ) as arrow.Vector<ArrowEmbeddingType>;
  const vector = makeGPUVectorFromArrow(device, source.slice(1, 4));
  const data = await readArrowGPUDataAsync<ArrowEmbeddingType>(vector.data[0]);
  const reconstructed = await readArrowGPUVectorAsync<ArrowEmbeddingType>(vector);

  t.equal(vector.data[0].readbackMetadata?.kind, 'fixed-size-list', 'keeps compact null metadata');
  t.deepEqual(
    Array.from(vector.data[0].nullBitmap ?? []),
    [4],
    'generic row validity combines sliced parent and child nulls'
  );
  t.deepEqual(
    Array.from(vector.data[0].readbackMetadata?.nullBitmap ?? []),
    [6],
    'Arrow readback metadata independently preserves original parent validity'
  );
  t.equal(data.nullCount, 1, 'retains parent null rows');
  t.equal(data.children[0].nullCount, 6, 'retains null parent coordinates and nullable children');
  t.deepEqual(
    getArrowRows(reconstructed),
    [null, [10, null, 12, 13, 14], [15, 16, 17, 18, 19]],
    'readback reconstructs sliced parent and child nulls'
  );

  vector.destroy();
  t.end();
});

test('nullable short FixedSizeList vertex rows retain existing formats and correct readback', async t => {
  const device = new NullDevice({});
  const source = arrow.vectorFromArray(
    [[1, 2, 3], null, [4, null, 6], [7, 8, 9]],
    makeArrowEmbeddingType(3)
  ) as arrow.Vector<ArrowEmbeddingType>;
  const vector = makeGPUVectorFromArrow(device, source.slice(1, 4));

  t.equal(vector.format, 'float32x3', 'nullable short lists retain the existing vertex format');
  t.deepEqual(
    getArrowRows(await readArrowGPUVectorAsync<ArrowEmbeddingType>(vector)),
    [null, [4, null, 6], [7, 8, 9]],
    'nullable sliced short-list parents and children survive readback'
  );

  vector.destroy();
  t.end();
});

test('nullable numeric Arrow GPU data retains normalized row validity and readback', async t => {
  const device = new NullDevice({});
  const values: Array<number | null> = Array.from({length: 12}, (_, rowIndex) => rowIndex + 10);
  values[10] = null;
  const source = arrow.vectorFromArray(values, new arrow.Uint32()).slice(9, 12);
  const vector = makeGPUVectorFromArrow(device, source);
  const data = await readArrowGPUDataAsync<arrow.Uint32>(vector.data[0]);
  const reconstructed = await readArrowGPUVectorAsync<arrow.Uint32>(vector);

  t.equal(vector.format, 'uint32', 'nullable IDs remain ordinary scalar table data');
  t.deepEqual(Array.from(vector.data[0].nullBitmap ?? []), [5], 'normalizes a sliced row bitmap');
  t.equal(vector.data[0].readbackMetadata?.kind, 'numeric', 'retains compact scalar null metadata');
  t.equal(data.nullCount, 1, 'retains nullable row counts on direct chunk readback');
  t.deepEqual(
    Array.from(reconstructed),
    [19, null, 21],
    'numeric Arrow readback preserves nullable source IDs'
  );

  const nonNullVector = makeGPUVectorFromArrow(device, arrow.makeVector(new Uint32Array([11, 22])));
  t.notOk(nonNullVector.data[0].nullBitmap, 'non-null scalar chunks avoid validity copies');
  t.notOk(nonNullVector.data[0].readbackMetadata, 'non-null scalar readback stays allocation free');

  vector.destroy();
  nonNullVector.destroy();
  t.end();
});

test('Arrow FixedSizeList adapters zero-pad child coordinates omitted for trailing null rows', async t => {
  const device = new NullDevice({});
  const values = Float32Array.from({length: 384}, (_, index) => index + 1);
  const source = arrow.vectorFromArray(
    [Array.from(values), null, null],
    makeArrowEmbeddingType(384)
  ) as arrow.Vector<ArrowEmbeddingType>;
  const vector = makeGPUVectorFromArrow(device, source);
  const uploaded = await readFloat32Data(vector.data[0]);

  t.equal(source.data[0].children[0].length, 384, 'Arrow omitted both trailing null child rows');
  t.equal(vector.length, 3, 'GPU storage retains every logical parent row');
  t.equal(vector.valueLength, 3 * 384, 'GPU storage allocates every physical row');
  t.deepEqual(uploaded.subarray(0, 384), values, 'the present row remains unchanged');
  t.ok(
    uploaded.subarray(384).every(value => value === 0),
    'missing null rows become zero padding'
  );
  t.deepEqual(
    getArrowRows(await readArrowGPUVectorAsync<ArrowEmbeddingType>(vector)),
    [Array.from(values), null, null],
    'readback preserves omitted trailing parent null rows'
  );

  const sliced = makeGPUVectorFromArrow(device, source.slice(1));
  t.equal(sliced.length, 2, 'sliced trailing null rows remain logical rows');
  t.ok(
    (await readFloat32Data(sliced.data[0])).every(value => value === 0),
    'sliced trailing null coordinates remain safely zero padded'
  );

  vector.destroy();
  sliced.destroy();
  t.end();
});

test('Arrow FixedSizeList adapters reject missing child values for non-null parent rows', t => {
  const device = new NullDevice({});
  const child = arrow.makeData({
    type: new arrow.Float32(),
    length: 5,
    data: new Float32Array([1, 2, 3, 4, 5])
  });
  const parent = new arrow.Data<ArrowEmbeddingType>(makeArrowEmbeddingType(5), 0, 2, 0, {}, [
    child
  ]);

  t.throws(
    () => makeGPUDataFromArrowData(device, parent),
    /shorter than their logical row count/,
    'corrupt non-null rows are not silently padded'
  );

  t.end();
});

test('Arrow GPU tables preserve embedding batches, stable ID columns, and source provenance', async t => {
  const device = new NullDevice({});
  const dimensions = 384;
  const firstBatch = makeArrowEmbeddingBatch(
    dimensions,
    Float32Array.from({length: dimensions * 2}, (_, index) => index),
    new Uint32Array([91, 7])
  );
  const secondBatch = makeArrowEmbeddingBatch(
    dimensions,
    Float32Array.from({length: dimensions}, (_, index) => index + 1000),
    new Uint32Array([42])
  );
  const table = makeGPUTableFromArrowTable(device, new arrow.Table([firstBatch, secondBatch]), {
    shaderLayout: makeStorageShaderLayout('embedding', 'sourceIds'),
    validityColumns: {embedding: 'embeddingValidity'}
  });

  t.ok(table instanceof GPUTable, 'uses the existing generic table owner');
  t.ok(table.batches[0] instanceof GPURecordBatch, 'uses existing generic record batches');
  t.ok(table.gpuVectors.embedding instanceof GPUVector, 'uses existing generic vector views');
  t.ok(table.batches[0].gpuData.embedding instanceof GPUData, 'uses existing generic data chunks');
  t.equal(table.gpuVectors.embedding.format, 'fixed-size-list<float32,384>', 'keeps row shape');
  t.equal(table.gpuVectors.embedding.length, 3, 'embedding column length counts table rows');
  t.deepEqual(
    table.gpuVectors.embedding.data.map(data => data.length),
    [2, 1],
    'preserves Arrow record-batch boundaries'
  );
  t.deepEqual(
    table.batches.map(batch => batch.sourceInfo),
    [
      {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 2},
      {sourceBatchIndex: 1, sourceRowIndexOffset: 2, sourceRowCount: 1}
    ],
    'preserves stable source-batch and source-row provenance'
  );
  t.deepEqual(
    Array.from(await readUint32Data(table.batches[0].gpuData.sourceIds)),
    [91, 7],
    'stable IDs remain an ordinary uint32 sibling column'
  );
  t.deepEqual(
    Array.from(await readUint32Data(table.batches[1].gpuData.sourceIds)),
    [42],
    'stable IDs preserve batch boundaries'
  );
  t.deepEqual(
    Array.from(await readUint32Data(table.batches[0].gpuData.embeddingValidity)),
    [1, 1],
    'explicit validity siblings contain nonzero flags for valid rows'
  );
  t.deepEqual(table.bufferLayout, [], 'embedding storage does not become a vertex layout');

  const ownedBuffers = table.batches.flatMap(batch =>
    Object.values(batch.gpuData).map(data => data.buffer)
  );
  table.destroy();
  t.ok(
    ownedBuffers.every(buffer => buffer.destroyed),
    'only the table hierarchy owns its buffers'
  );
  t.end();
});

test('Arrow GPU source-ID siblings preserve nullable scalar bitmaps instead of inventing ID zero', async t => {
  const device = new NullDevice({});
  const embedding = makeArrowEmbeddingVector(
    5,
    Float32Array.from({length: 15}, (_, index) => index)
  );
  const sourceIds = arrow.vectorFromArray([11, null, 22], new arrow.Uint32());
  const table = makeGPUTableFromArrowTable(device, new arrow.Table({embedding, sourceIds}), {
    shaderLayout: makeStorageShaderLayout('embedding', 'sourceIds')
  });
  const sourceIdData = table.batches[0].gpuData.sourceIds;

  t.equal(sourceIdData.format, 'uint32', 'source IDs remain ordinary uint32 table data');
  t.deepEqual(Array.from(sourceIdData.nullBitmap ?? []), [5], 'null source IDs remain observable');
  t.deepEqual(
    Array.from(await readUint32Data(sourceIdData)),
    [11, 0, 22],
    'the physical zero placeholder remains distinguishable through the null bitmap'
  );
  t.deepEqual(
    Array.from(await readArrowGPUVectorAsync<arrow.Uint32>(table.gpuVectors.sourceIds)),
    [11, null, 22],
    'source-ID Arrow readback retains nulls rather than inventing a valid zero ID'
  );

  table.destroy();
  t.end();
});

test('Arrow GPU record batches expose explicit FixedSizeList validity siblings', async t => {
  const device = new NullDevice({});
  const embedding = arrow.vectorFromArray(
    [[0, 1, 2, 3, 4], null, [10, null, 12, 13, 14], [15, 16, 17, 18, 19]],
    makeArrowEmbeddingType(5)
  ) as arrow.Vector<ArrowEmbeddingType>;
  const arrowTable = new arrow.Table({
    embedding: embedding.slice(1),
    sourceIds: arrow.makeVector(new Uint32Array([90, 70, 50]))
  });
  const batch = makeGPURecordBatchFromArrowRecordBatch(device, arrowTable.batches[0], {
    shaderLayout: makeStorageShaderLayout('embedding', 'sourceIds'),
    validityColumns: {embedding: 'embeddingValidity'},
    sourceInfo: {sourceBatchIndex: 3, sourceRowIndexOffset: 25, sourceRowCount: 3}
  });

  t.equal(batch.gpuData.embedding.format, 'fixed-size-list<float32,5>', 'keeps fixed row format');
  t.deepEqual(
    Array.from(await readUint32Data(batch.gpuData.embeddingValidity)),
    [0, 0, 1],
    'combines sliced parent validity and child-coordinate validity'
  );
  t.deepEqual(
    Array.from(await readUint32Data(batch.gpuData.sourceIds)),
    [90, 70, 50],
    'explicit source IDs remain aligned with the sliced rows'
  );
  t.deepEqual(
    batch.sourceInfo,
    {sourceBatchIndex: 3, sourceRowIndexOffset: 25, sourceRowCount: 3},
    'preserves explicit record-batch provenance'
  );
  t.deepEqual(
    batch.schema.fields.map(field => field.name),
    ['embedding', 'sourceIds', 'embeddingValidity'],
    'the requested validity sibling participates in the ordinary GPU schema'
  );

  batch.destroy();
  t.end();
});

test('sliced Arrow FixedSizeList validity remains aligned across bitmap byte boundaries', async t => {
  const device = new NullDevice({});
  const rows: Array<Array<number | null> | null> = Array.from({length: 12}, (_, rowIndex) =>
    Array.from({length: 5}, (_, coordinateIndex) => rowIndex * 5 + coordinateIndex)
  );
  rows[9] = null;
  rows[10] = [50, null, 52, 53, 54];
  const source = arrow.vectorFromArray(
    rows,
    makeArrowEmbeddingType(5)
  ) as arrow.Vector<ArrowEmbeddingType>;
  const table = makeGPUTableFromArrowTable(device, new arrow.Table({embedding: source.slice(9)}), {
    shaderLayout: makeStorageShaderLayout('embedding'),
    validityColumns: {embedding: 'embeddingValidity'}
  });

  t.deepEqual(
    Array.from(await readUint32Data(table.batches[0].gpuData.embeddingValidity)),
    [0, 0, 1],
    'parent and child offsets remain correct after crossing bitmap byte boundaries'
  );
  t.deepEqual(
    getArrowRows(await readArrowGPUVectorAsync<ArrowEmbeddingType>(table.gpuVectors.embedding)),
    [null, [50, null, 52, 53, 54], [55, 56, 57, 58, 59]],
    'Arrow readback retains sliced validity after the eighth parent row'
  );

  table.destroy();
  t.end();
});

test('Arrow GPU tables distinguish semantic dimensions from nullable physical row padding', async t => {
  const device = new NullDevice({});
  const embedding = arrow.vectorFromArray(
    [[1, 2, 3, null], [4, null, 6, 99], null],
    makeArrowEmbeddingType(4)
  ) as arrow.Vector<ArrowEmbeddingType>;
  const sourceTable = new arrow.Table({embedding});
  const semanticTable = makeGPUTableFromArrowTable(device, sourceTable, {
    shaderLayout: makeStorageShaderLayout('embedding'),
    fixedSizeListColumns: ['embedding'],
    validityColumns: {embedding: {name: 'embeddingValidity', dimensions: 3}}
  });
  const fullWidthTable = makeGPUTableFromArrowTable(device, sourceTable, {
    shaderLayout: makeStorageShaderLayout('embedding'),
    fixedSizeListColumns: ['embedding'],
    validityColumns: {embedding: 'embeddingValidity'}
  });

  t.equal(
    semanticTable.gpuVectors.embedding.format,
    'fixed-size-list<float32,4>',
    'explicitly requested short storage rows retain physical width'
  );
  t.equal(semanticTable.gpuVectors.embedding.byteStride, 16, 'retains padded row byte stride');
  t.deepEqual(
    Array.from(semanticTable.batches[0].gpuData.embedding.nullBitmap ?? []),
    [0],
    'generic physical-row validity conservatively includes nullable trailing padding'
  );
  t.deepEqual(
    Array.from(await readUint32Data(semanticTable.batches[0].gpuData.embeddingValidity)),
    [1, 0, 0],
    'nullable trailing padding does not invalidate meaningful leading coordinates'
  );
  t.deepEqual(
    Array.from(await readUint32Data(fullWidthTable.batches[0].gpuData.embeddingValidity)),
    [0, 0, 0],
    'default validity checks every physical child coordinate'
  );

  semanticTable.destroy();
  fullWidthTable.destroy();
  t.end();
});

test('Arrow GPU tables preserve existing short-list rendering layouts', t => {
  const device = new NullDevice({});
  const positions = makeArrowEmbeddingVector(3, new Float32Array([1, 2, 3, 4, 5, 6]));
  const sourceTable = new arrow.Table({positions});
  const vertexTable = makeGPUTableFromArrowTable(device, sourceTable, {
    shaderLayout: {
      attributes: [{name: 'positions', location: 0, type: 'vec3<f32>'}],
      bindings: []
    }
  });
  const storageTable = makeGPUTableFromArrowTable(device, sourceTable, {
    shaderLayout: makeStorageShaderLayout('positions')
  });

  t.equal(vertexTable.gpuVectors.positions.format, 'float32x3', 'vertex columns remain unchanged');
  t.deepEqual(
    vertexTable.bufferLayout,
    [{name: 'positions', format: 'float32x3'}],
    'existing shader-facing vertex layouts remain unchanged'
  );
  t.equal(
    storageTable.gpuVectors.positions.format,
    'float32x3',
    'existing short storage columns remain unchanged unless explicitly opted in'
  );

  vertexTable.destroy();
  storageTable.destroy();
  t.end();
});

test('empty Arrow GPU table schemas preserve FixedSizeList storage columns and validity siblings', t => {
  const device = new NullDevice({});
  const schema = new arrow.Schema([
    new arrow.Field('embedding', makeArrowEmbeddingType(768), true),
    new arrow.Field('sourceIds', new arrow.Uint32(), false)
  ]);
  const sourceTable = new arrow.Table(schema);
  const table = makeGPUTableFromArrowTable(device, sourceTable, {
    shaderLayout: makeStorageShaderLayout('embedding', 'sourceIds'),
    validityColumns: {embedding: 'embeddingValidity'}
  });

  t.equal(table.numRows, 0, 'the table retains its empty row count');
  t.equal(table.batches.length, 0, 'no synthetic source batch is introduced');
  t.deepEqual(
    table.schema.fields.map(field => [field.name, field.format]),
    [
      ['embedding', 'fixed-size-list<float32,768>'],
      ['sourceIds', 'uint32'],
      ['embeddingValidity', 'uint32']
    ],
    'the empty schema retains every selected storage and validity column'
  );

  table.destroy();
  t.end();
});

test('Arrow GPU table fixed-list and validity options reject inconsistent selections', t => {
  const device = new NullDevice({});
  const sourceTable = new arrow.Table({
    embedding: makeArrowEmbeddingVector(4, new Float32Array([1, 2, 3, 4])),
    sourceIds: arrow.makeVector(new Uint32Array([10]))
  });
  const storageLayout = makeStorageShaderLayout('embedding', 'sourceIds');

  t.throws(
    () =>
      makeGPUTableFromArrowTable(device, sourceTable, {
        shaderLayout: storageLayout,
        fixedSizeListColumns: ['missing']
      }),
    /selected storage binding/,
    'rejects fixed-list columns that were not selected'
  );
  t.throws(
    () =>
      makeGPUTableFromArrowTable(device, sourceTable, {
        shaderLayout: storageLayout,
        fixedSizeListColumns: ['sourceIds']
      }),
    /FixedSizeList source data/,
    'rejects scalar columns requested as fixed-size lists'
  );
  t.throws(
    () =>
      makeGPUTableFromArrowTable(device, sourceTable, {
        shaderLayout: storageLayout,
        validityColumns: {embedding: 'sourceIds'}
      }),
    /unique output/,
    'rejects validity siblings that collide with existing table columns'
  );
  t.throws(
    () =>
      makeGPUTableFromArrowTable(device, sourceTable, {
        shaderLayout: storageLayout,
        validityColumns: {embedding: {name: 'embeddingValidity', dimensions: 5}}
      }),
    /validity dimensions/,
    'rejects meaningful dimensions wider than the physical Arrow list'
  );
  t.throws(
    () =>
      makeGPUTableFromArrowTable(device, sourceTable, {
        shaderLayout: {
          attributes: [{name: 'embedding', location: 0, type: 'vec4<f32>'}],
          bindings: []
        },
        fixedSizeListColumns: ['embedding']
      }),
    /storage shader binding/,
    'rejects fixed-size-list columns exposed as vertex attributes'
  );

  t.end();
});

test('Arrow FixedSizeList table columns upload preserved batches to actual WebGPU buffers', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  for (const dimensions of [384, 768, 1536]) {
    const firstValues = Float32Array.from({length: dimensions * 2}, (_, index) => index + 0.25);
    const secondValues = Float32Array.from({length: dimensions}, (_, index) => index + 1000.5);
    const source = new arrow.Table([
      makeArrowEmbeddingBatch(dimensions, firstValues, new Uint32Array([12, 40])),
      makeArrowEmbeddingBatch(dimensions, secondValues, new Uint32Array([8]))
    ]);
    const table = makeGPUTableFromArrowTable(device, source, {
      shaderLayout: makeStorageShaderLayout('embedding', 'sourceIds'),
      validityColumns: {embedding: 'embeddingValidity'}
    });

    t.equal(device.type, 'webgpu', 'the adapter uses a real browser WebGPU device');
    t.deepEqual(
      table.batches.map(batch => batch.numRows),
      [2, 1],
      `${dimensions}-dimensional rows preserve source record batches`
    );
    t.deepEqual(
      await readFloat32Data(table.batches[0].gpuData.embedding),
      firstValues,
      `${dimensions}-dimensional first batch uploads intact`
    );
    t.deepEqual(
      await readFloat32Data(table.batches[1].gpuData.embedding),
      secondValues,
      `${dimensions}-dimensional second batch uploads intact`
    );
    t.deepEqual(
      Array.from(await readUint32Data(table.batches[0].gpuData.sourceIds)),
      [12, 40],
      'GPU-resident stable ID siblings preserve source rows'
    );

    const ownedBuffers = table.batches.flatMap(batch =>
      Object.values(batch.gpuData).map(data => data.buffer)
    );
    table.destroy();
    t.ok(
      ownedBuffers.every(buffer => buffer.destroyed),
      'the table owns every WebGPU buffer'
    );
  }

  t.end();
});

test('nullable FixedSizeList rows and physical padding upload correctly on actual WebGPU', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const embedding = arrow.vectorFromArray(
    [[1, 2, 3, null], [4, null, 6, 99], null],
    makeArrowEmbeddingType(4)
  ) as arrow.Vector<ArrowEmbeddingType>;
  const table = makeGPUTableFromArrowTable(device, new arrow.Table({embedding}), {
    shaderLayout: makeStorageShaderLayout('embedding'),
    fixedSizeListColumns: ['embedding'],
    validityColumns: {embedding: {name: 'embeddingValidity', dimensions: 3}}
  });

  t.deepEqual(
    Array.from(await readUint32Data(table.batches[0].gpuData.embeddingValidity)),
    [1, 0, 0],
    'actual GPU validity excludes nullable meaningful coordinates and null parents'
  );
  t.deepEqual(
    Array.from(await readFloat32Data(table.batches[0].gpuData.embedding)),
    [1, 2, 3, 0, 4, 0, 6, 99, 0, 0, 0, 0],
    'actual GPU storage retains physical row padding and omitted trailing null rows'
  );

  table.destroy();
  t.end();
});

function makeStorageShaderLayout(...names: string[]): ShaderLayout {
  return {
    attributes: [],
    bindings: names.map((name, location) => ({
      name,
      type: 'read-only-storage',
      group: 0,
      location
    }))
  };
}

function makeArrowEmbeddingType(dimensions: number): ArrowEmbeddingType {
  return new arrow.FixedSizeList(dimensions, new arrow.Field('value', new arrow.Float32(), true));
}

function makeArrowEmbeddingData(
  dimensions: number,
  values: Float32Array
): arrow.Data<ArrowEmbeddingType> {
  const child = arrow.makeData({type: new arrow.Float32(), length: values.length, data: values});
  return arrow.makeData({
    type: makeArrowEmbeddingType(dimensions),
    length: values.length / dimensions,
    child
  });
}

function makeArrowEmbeddingVector(
  dimensions: number,
  values: Float32Array
): arrow.Vector<ArrowEmbeddingType> {
  return new arrow.Vector<ArrowEmbeddingType>([makeArrowEmbeddingData(dimensions, values)]);
}

function makeArrowEmbeddingBatch(
  dimensions: number,
  values: Float32Array,
  sourceIds: Uint32Array
): arrow.RecordBatch {
  return new arrow.RecordBatch({
    embedding: makeArrowEmbeddingData(dimensions, values),
    sourceIds: arrow.makeData({type: new arrow.Uint32(), length: sourceIds.length, data: sourceIds})
  });
}

function getArrowRows(
  vector: arrow.Vector<ArrowEmbeddingType>
): Array<Array<number | null> | null> {
  const rows: Array<Array<number | null> | null> = [];
  for (let rowIndex = 0; rowIndex < vector.length; rowIndex++) {
    const row = vector.get(rowIndex);
    rows.push(row ? Array.from(row) : null);
  }
  return rows;
}

async function readFloat32Data(data: GPUData): Promise<Float32Array> {
  if (data.valueLength === 0) {
    return new Float32Array(0);
  }
  const bytes = await data.buffer.readAsync(
    data.byteOffset,
    data.valueLength * Float32Array.BYTES_PER_ELEMENT
  );
  return new Float32Array(bytes.buffer, bytes.byteOffset, data.valueLength);
}

async function readUint32Data(data: GPUData): Promise<Uint32Array> {
  if (data.length === 0) {
    return new Uint32Array(0);
  }
  const bytes = await data.buffer.readAsync(
    data.byteOffset,
    data.length * Uint32Array.BYTES_PER_ELEMENT
  );
  return new Uint32Array(bytes.buffer, bytes.byteOffset, data.length);
}
