// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {GPUData, GPUVector, type GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice, NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import {expectTypeOf} from 'vitest';

type ArrowEmbeddingType = arrow.FixedSizeList<arrow.Float32>;

it('unmapped Float16 fixed-size lists retain a usable broad GPU vector format', () => {
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
  expect(vector.format, 'retains the supported runtime Float16 vertex format').toBe('float16x4');

  vector.destroy();
  void 0;
});

it('Arrow GPU adapters represent high-dimensional FixedSizeList rows as table-native storage', async () => {
  const device = new NullDevice({});

  for (const dimensions of [5, 384, 768, 1536]) {
    const values = Float32Array.from({length: dimensions * 2}, (_, index) => index + 0.5);
    const source = makeArrowEmbeddingVector(dimensions, values);
    const data = makeGPUDataFromArrowData(device, source.data[0]);
    const vector = makeGPUVectorFromArrow(device, source, {name: 'embedding'});

    expect(data.format, 'data retains its row shape').toBe(
      `fixed-size-list<float32,${dimensions}>`
    );
    expect(vector.format, 'vector retains its row shape').toBe(
      `fixed-size-list<float32,${dimensions}>`
    );
    expect(data.length, 'GPUData length counts logical rows').toBe(2);
    expect(vector.length, 'GPUVector length counts logical rows').toBe(2);
    expect(data.valueLength, 'GPUData value length counts flattened values').toBe(values.length);
    expect(vector.valueLength, 'GPUVector value length counts flattened values').toBe(
      values.length
    );
    expect(data.stride, 'GPUData stride retains flattened row coordinates').toBe(dimensions);
    expect(vector.byteStride, 'retains row bytes').toBe(
      dimensions * Float32Array.BYTES_PER_ELEMENT
    );
    expect(await readFloat32Data(data), 'GPUData uploads the original coordinates').toEqual(values);
    expect(
      await readFloat32Data(vector.data[0]),
      'GPUVector uploads the original coordinates'
    ).toEqual(values);

    const dataBuffer = data.buffer;
    const vectorBuffer = vector.data[0].buffer;
    data.destroy();
    vector.destroy();
    expect(Boolean(dataBuffer.destroyed), 'GPUData destroys its own buffer').toBe(true);
    expect(Boolean(vectorBuffer.destroyed), 'GPUVector destroys its owned chunk').toBe(true);
  }

  void 0;
});

it('Arrow GPU adapters preserve existing short vertex formats and explicitly requested storage rows', () => {
  const device = new NullDevice({});

  for (const dimensions of [1, 2, 3, 4]) {
    const source = makeArrowEmbeddingVector(dimensions, Float32Array.from({length: dimensions}));
    const vertex = makeGPUVectorFromArrow(device, source);
    const storage = makeGPUVectorFromArrow(device, source, {
      format: `fixed-size-list<float32,${dimensions}>`
    });

    expect(
      vertex.format,
      'default short rows remain compatible with existing vertex attributes'
    ).toBe(dimensions === 1 ? 'float32' : `float32x${dimensions}`);
    expect(
      storage.format,
      'explicit short storage rows retain a first-class fixed-size-list format'
    ).toBe(`fixed-size-list<float32,${dimensions}>`);
    expect(storage.length, 'explicit storage rows remain row oriented').toBe(1);
    expect(storage.valueLength, 'explicit storage rows expose flattened values').toBe(dimensions);

    vertex.destroy();
    storage.destroy();
  }

  void 0;
});

it('Arrow GPU vectors preserve original FixedSizeList chunks, including empty chunks', async () => {
  const device = new NullDevice({});
  const source = new arrow.Vector<ArrowEmbeddingType>([
    makeArrowEmbeddingData(5, new Float32Array([1, 2, 3, 4, 5])),
    makeArrowEmbeddingData(5, new Float32Array(0)),
    makeArrowEmbeddingData(5, new Float32Array([6, 7, 8, 9, 10, 11, 12, 13, 14, 15]))
  ]);
  const vector = makeGPUVectorFromArrow(device, source);

  expect(
    vector.data.map(data => data.length),
    'every source chunk, including an empty chunk, remains independently owned'
  ).toEqual([1, 0, 2]);
  expect(
    vector.data.map(data => data.valueLength),
    'flattened coordinates remain chunk aligned'
  ).toEqual([5, 0, 10]);
  expect(vector.length, 'aggregate vectors count rows').toBe(3);
  expect(vector.valueLength, 'aggregate vectors count flattened coordinates').toBe(15);
  expect(
    Array.from(await readFloat32Data(vector.data[2])),
    'later source chunks start at their own allocation'
  ).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

  const reconstructed = await readArrowGPUVectorAsync<ArrowEmbeddingType>(vector);
  expect(reconstructed.data.length, 'Arrow readback preserves all source chunk boundaries').toBe(3);
  vector.destroy();
  void 0;
});

it('explicit non-null FixedSizeList compaction preserves flattened row metadata', async () => {
  const device = new NullDevice({});
  const source = new arrow.Vector<ArrowEmbeddingType>([
    makeArrowEmbeddingData(5, new Float32Array([1, 2, 3, 4, 5])),
    makeArrowEmbeddingData(5, new Float32Array([6, 7, 8, 9, 10]))
  ]);
  const vector = makeGPUVectorFromArrow(device, source, {preserveDataChunks: false});

  expect(vector.data.length, 'explicit compaction combines source chunks only when requested').toBe(
    1
  );
  expect(vector.length, 'packed fixed-list columns retain logical row counts').toBe(2);
  expect(vector.valueLength, 'packed fixed-list columns retain flattened value counts').toBe(10);
  expect(
    Array.from(await readFloat32Data(vector.data[0])),
    'explicit compaction retains every source coordinate'
  ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  const sourceIds = new arrow.Vector<arrow.Uint32>([
    arrow.makeData({type: new arrow.Uint32(), length: 1, data: new Uint32Array([11])}),
    arrow.makeData({type: new arrow.Uint32(), length: 1, data: new Uint32Array([22])})
  ]);
  const compactIds = makeGPUVectorFromArrow(device, sourceIds, {preserveDataChunks: false});
  expect(compactIds.data.length, 'explicit non-null scalar compaction remains supported').toBe(1);
  expect(
    Array.from(await readUint32Data(compactIds.data[0])),
    'packed non-null source IDs retain their original values'
  ).toEqual([11, 22]);
  expect(
    Boolean(compactIds.data[0].nullBitmap),
    'non-null source IDs retain the allocation-free fast path'
  ).toBe(false);

  vector.destroy();
  compactIds.destroy();
  void 0;
});

it('nullable FixedSizeList compaction is rejected rather than discarding Arrow validity', () => {
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
    expect(
      () => makeGPUVectorFromArrow(device, source, {preserveDataChunks: false}),
      'explicit packing cannot silently discard nullable parent or child metadata'
    ).toThrow(/require preserved GPU data chunks/);
  }

  const nullableSourceIds = arrow.vectorFromArray([11, null, 22], new arrow.Uint32());
  expect(
    () => makeGPUVectorFromArrow(device, nullableSourceIds, {preserveDataChunks: false}),
    'nullable scalar source IDs cannot be compacted into invented valid zero IDs'
  ).toThrow(/require preserved GPU data chunks/);

  void 0;
});

it('Arrow FixedSizeList uploads apply parent and child displacements exactly once', async () => {
  const device = new NullDevice({});
  const backingValues = Float32Array.from({length: 32}, (_, index) => index);
  const child = new arrow.Data<arrow.Float32>(new arrow.Float32(), 2, 20, 0, {
    [arrow.BufferType.DATA]: backingValues
  });
  const parent = new arrow.Data<ArrowEmbeddingType>(makeArrowEmbeddingType(5), 1, 2, 0, {}, [
    child
  ]);
  const independentOffsets = makeGPUVectorFromArrow(device, new arrow.Vector([parent]));

  expect(
    Array.from(await readFloat32Data(independentOffsets.data[0])),
    'independent parent and child offsets each contribute once'
  ).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

  const source = makeArrowEmbeddingVector(
    5,
    Float32Array.from({length: 20}, (_, index) => index)
  );
  const sliced = makeGPUVectorFromArrow(device, source.slice(1, 3));
  expect(
    Array.from(await readFloat32Data(sliced.data[0])),
    'already-sliced Arrow child views are not displaced a second time'
  ).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

  independentOffsets.destroy();
  sliced.destroy();
  void 0;
});

it('nullable FixedSizeList Arrow readback preserves parent and child validity', async () => {
  const device = new NullDevice({});
  const source = arrow.vectorFromArray(
    [[0, 1, 2, 3, 4], null, [10, null, 12, 13, 14], [15, 16, 17, 18, 19]],
    makeArrowEmbeddingType(5)
  ) as arrow.Vector<ArrowEmbeddingType>;
  const vector = makeGPUVectorFromArrow(device, source.slice(1, 4));
  const data = await readArrowGPUDataAsync<ArrowEmbeddingType>(vector.data[0]);
  const reconstructed = await readArrowGPUVectorAsync<ArrowEmbeddingType>(vector);

  expect(vector.data[0].readbackMetadata?.kind, 'keeps compact null metadata').toBe(
    'fixed-size-list'
  );
  expect(
    Array.from(vector.data[0].nullBitmap ?? []),
    'generic row validity combines sliced parent and child nulls'
  ).toEqual([4]);
  expect(
    Array.from(vector.data[0].readbackMetadata?.nullBitmap ?? []),
    'Arrow readback metadata independently preserves original parent validity'
  ).toEqual([6]);
  expect(data.nullCount, 'retains parent null rows').toBe(1);
  expect(data.children[0].nullCount, 'retains null parent coordinates and nullable children').toBe(
    6
  );
  expect(
    getArrowRows(reconstructed),
    'readback reconstructs sliced parent and child nulls'
  ).toEqual([null, [10, null, 12, 13, 14], [15, 16, 17, 18, 19]]);

  vector.destroy();
  void 0;
});

it('nullable short FixedSizeList vertex rows retain existing formats and correct readback', async () => {
  const device = new NullDevice({});
  const source = arrow.vectorFromArray(
    [[1, 2, 3], null, [4, null, 6], [7, 8, 9]],
    makeArrowEmbeddingType(3)
  ) as arrow.Vector<ArrowEmbeddingType>;
  const vector = makeGPUVectorFromArrow(device, source.slice(1, 4));

  expect(vector.format, 'nullable short lists retain the existing vertex format').toBe('float32x3');
  expect(
    getArrowRows(await readArrowGPUVectorAsync<ArrowEmbeddingType>(vector)),
    'nullable sliced short-list parents and children survive readback'
  ).toEqual([null, [4, null, 6], [7, 8, 9]]);

  vector.destroy();
  void 0;
});

it('nullable numeric Arrow GPU data retains normalized row validity and readback', async () => {
  const device = new NullDevice({});
  const values: Array<number | null> = Array.from({length: 12}, (_, rowIndex) => rowIndex + 10);
  values[10] = null;
  const source = arrow.vectorFromArray(values, new arrow.Uint32()).slice(9, 12);
  const vector = makeGPUVectorFromArrow(device, source);
  const data = await readArrowGPUDataAsync<arrow.Uint32>(vector.data[0]);
  const reconstructed = await readArrowGPUVectorAsync<arrow.Uint32>(vector);

  expect(vector.format, 'nullable IDs remain ordinary scalar table data').toBe('uint32');
  expect(Array.from(vector.data[0].nullBitmap ?? []), 'normalizes a sliced row bitmap').toEqual([
    5
  ]);
  expect(vector.data[0].readbackMetadata?.kind, 'retains compact scalar null metadata').toBe(
    'numeric'
  );
  expect(data.nullCount, 'retains nullable row counts on direct chunk readback').toBe(1);
  expect(Array.from(reconstructed), 'numeric Arrow readback preserves nullable source IDs').toEqual(
    [19, null, 21]
  );

  const nonNullVector = makeGPUVectorFromArrow(device, arrow.makeVector(new Uint32Array([11, 22])));
  expect(
    Boolean(nonNullVector.data[0].nullBitmap),
    'non-null scalar chunks avoid validity copies'
  ).toBe(false);
  expect(
    Boolean(nonNullVector.data[0].readbackMetadata),
    'non-null scalar readback stays allocation free'
  ).toBe(false);

  vector.destroy();
  nonNullVector.destroy();
  void 0;
});

it('Arrow FixedSizeList adapters zero-pad child coordinates omitted for trailing null rows', async () => {
  const device = new NullDevice({});
  const values = Float32Array.from({length: 384}, (_, index) => index + 1);
  const source = arrow.vectorFromArray(
    [Array.from(values), null, null],
    makeArrowEmbeddingType(384)
  ) as arrow.Vector<ArrowEmbeddingType>;
  const vector = makeGPUVectorFromArrow(device, source);
  const uploaded = await readFloat32Data(vector.data[0]);

  expect(source.data[0].children[0].length, 'Arrow omitted both trailing null child rows').toBe(
    384
  );
  expect(vector.length, 'GPU storage retains every logical parent row').toBe(3);
  expect(vector.valueLength, 'GPU storage allocates every physical row').toBe(3 * 384);
  expect(uploaded.subarray(0, 384), 'the present row remains unchanged').toEqual(values);
  expect(
    Boolean(uploaded.subarray(384).every(value => value === 0)),
    'missing null rows become zero padding'
  ).toBe(true);
  expect(
    getArrowRows(await readArrowGPUVectorAsync<ArrowEmbeddingType>(vector)),
    'readback preserves omitted trailing parent null rows'
  ).toEqual([Array.from(values), null, null]);

  const sliced = makeGPUVectorFromArrow(device, source.slice(1));
  expect(sliced.length, 'sliced trailing null rows remain logical rows').toBe(2);
  expect(
    Boolean((await readFloat32Data(sliced.data[0])).every(value => value === 0)),
    'sliced trailing null coordinates remain safely zero padded'
  ).toBe(true);

  vector.destroy();
  sliced.destroy();
  void 0;
});

it('Arrow FixedSizeList adapters reject missing child values for non-null parent rows', () => {
  const device = new NullDevice({});
  const child = arrow.makeData({
    type: new arrow.Float32(),
    length: 5,
    data: new Float32Array([1, 2, 3, 4, 5])
  });
  const parent = new arrow.Data<ArrowEmbeddingType>(makeArrowEmbeddingType(5), 0, 2, 0, {}, [
    child
  ]);

  expect(
    () => makeGPUDataFromArrowData(device, parent),
    'corrupt non-null rows are not silently padded'
  ).toThrow(/shorter than their logical row count/);

  void 0;
});

it('Arrow GPU tables preserve embedding batches, stable ID columns, and source provenance', async () => {
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

  expect(Boolean(table instanceof GPUTable), 'uses the existing generic table owner').toBe(true);
  expect(
    Boolean(table.batches[0] instanceof GPURecordBatch),
    'uses existing generic record batches'
  ).toBe(true);
  expect(
    Boolean(table.gpuVectors.embedding instanceof GPUVector),
    'uses existing generic vector views'
  ).toBe(true);
  expect(
    Boolean(table.batches[0].gpuData.embedding instanceof GPUData),
    'uses existing generic data chunks'
  ).toBe(true);
  expect(table.gpuVectors.embedding.format, 'keeps row shape').toBe('fixed-size-list<float32,384>');
  expect(table.gpuVectors.embedding.length, 'embedding column length counts table rows').toBe(3);
  expect(
    table.gpuVectors.embedding.data.map(data => data.length),
    'preserves Arrow record-batch boundaries'
  ).toEqual([2, 1]);
  expect(
    table.batches.map(batch => batch.sourceInfo),
    'preserves stable source-batch and source-row provenance'
  ).toEqual([
    {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 2},
    {sourceBatchIndex: 1, sourceRowIndexOffset: 2, sourceRowCount: 1}
  ]);
  expect(
    Array.from(await readUint32Data(table.batches[0].gpuData.sourceIds)),
    'stable IDs remain an ordinary uint32 sibling column'
  ).toEqual([91, 7]);
  expect(
    Array.from(await readUint32Data(table.batches[1].gpuData.sourceIds)),
    'stable IDs preserve batch boundaries'
  ).toEqual([42]);
  expect(
    Array.from(await readUint32Data(table.batches[0].gpuData.embeddingValidity)),
    'explicit validity siblings contain nonzero flags for valid rows'
  ).toEqual([1, 1]);
  expect(table.bufferLayout, 'embedding storage does not become a vertex layout').toEqual([]);

  const ownedBuffers = table.batches.flatMap(batch =>
    Object.values(batch.gpuData).map(data => data.buffer)
  );
  table.destroy();
  expect(
    Boolean(ownedBuffers.every(buffer => buffer.destroyed)),
    'only the table hierarchy owns its buffers'
  ).toBe(true);
  void 0;
});

it('Arrow GPU source-ID siblings preserve nullable scalar bitmaps instead of inventing ID zero', async () => {
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

  expect(sourceIdData.format, 'source IDs remain ordinary uint32 table data').toBe('uint32');
  expect(Array.from(sourceIdData.nullBitmap ?? []), 'null source IDs remain observable').toEqual([
    5
  ]);
  expect(
    Array.from(await readUint32Data(sourceIdData)),
    'the physical zero placeholder remains distinguishable through the null bitmap'
  ).toEqual([11, 0, 22]);
  expect(
    Array.from(await readArrowGPUVectorAsync<arrow.Uint32>(table.gpuVectors.sourceIds)),
    'source-ID Arrow readback retains nulls rather than inventing a valid zero ID'
  ).toEqual([11, null, 22]);

  table.destroy();
  void 0;
});

it('Arrow GPU record batches expose explicit FixedSizeList validity siblings', async () => {
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

  expect(batch.gpuData.embedding.format, 'keeps fixed row format').toBe(
    'fixed-size-list<float32,5>'
  );
  expect(
    Array.from(await readUint32Data(batch.gpuData.embeddingValidity)),
    'combines sliced parent validity and child-coordinate validity'
  ).toEqual([0, 0, 1]);
  expect(
    Array.from(await readUint32Data(batch.gpuData.sourceIds)),
    'explicit source IDs remain aligned with the sliced rows'
  ).toEqual([90, 70, 50]);
  expect(batch.sourceInfo, 'preserves explicit record-batch provenance').toEqual({
    sourceBatchIndex: 3,
    sourceRowIndexOffset: 25,
    sourceRowCount: 3
  });
  expect(
    batch.schema.fields.map(field => field.name),
    'the requested validity sibling participates in the ordinary GPU schema'
  ).toEqual(['embedding', 'sourceIds', 'embeddingValidity']);

  batch.destroy();
  void 0;
});

it('sliced Arrow FixedSizeList validity remains aligned across bitmap byte boundaries', async () => {
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

  expect(
    Array.from(await readUint32Data(table.batches[0].gpuData.embeddingValidity)),
    'parent and child offsets remain correct after crossing bitmap byte boundaries'
  ).toEqual([0, 0, 1]);
  expect(
    getArrowRows(await readArrowGPUVectorAsync<ArrowEmbeddingType>(table.gpuVectors.embedding)),
    'Arrow readback retains sliced validity after the eighth parent row'
  ).toEqual([null, [50, null, 52, 53, 54], [55, 56, 57, 58, 59]]);

  table.destroy();
  void 0;
});

it('Arrow GPU tables distinguish semantic dimensions from nullable physical row padding', async () => {
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

  expect(
    semanticTable.gpuVectors.embedding.format,
    'explicitly requested short storage rows retain physical width'
  ).toBe('fixed-size-list<float32,4>');
  expect(semanticTable.gpuVectors.embedding.byteStride, 'retains padded row byte stride').toBe(16);
  expect(
    Array.from(semanticTable.batches[0].gpuData.embedding.nullBitmap ?? []),
    'generic physical-row validity conservatively includes nullable trailing padding'
  ).toEqual([0]);
  expect(
    Array.from(await readUint32Data(semanticTable.batches[0].gpuData.embeddingValidity)),
    'nullable trailing padding does not invalidate meaningful leading coordinates'
  ).toEqual([1, 0, 0]);
  expect(
    Array.from(await readUint32Data(fullWidthTable.batches[0].gpuData.embeddingValidity)),
    'default validity checks every physical child coordinate'
  ).toEqual([0, 0, 0]);

  semanticTable.destroy();
  fullWidthTable.destroy();
  void 0;
});

it('Arrow GPU tables preserve existing short-list rendering layouts', () => {
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

  expect(vertexTable.gpuVectors.positions.format, 'vertex columns remain unchanged').toBe(
    'float32x3'
  );
  expect(
    vertexTable.bufferLayout,
    'existing shader-facing vertex layouts remain unchanged'
  ).toEqual([{name: 'positions', format: 'float32x3'}]);
  expect(
    storageTable.gpuVectors.positions.format,
    'existing short storage columns remain unchanged unless explicitly opted in'
  ).toBe('float32x3');

  vertexTable.destroy();
  storageTable.destroy();
  void 0;
});

it('empty Arrow GPU table schemas preserve FixedSizeList storage columns and validity siblings', () => {
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

  expect(table.numRows, 'the table retains its empty row count').toBe(0);
  expect(table.batches.length, 'no synthetic source batch is introduced').toBe(0);
  expect(
    table.schema.fields.map(field => [field.name, field.format]),
    'the empty schema retains every selected storage and validity column'
  ).toEqual([
    ['embedding', 'fixed-size-list<float32,768>'],
    ['sourceIds', 'uint32'],
    ['embeddingValidity', 'uint32']
  ]);

  table.destroy();
  void 0;
});

it('Arrow GPU table fixed-list and validity options reject inconsistent selections', () => {
  const device = new NullDevice({});
  const sourceTable = new arrow.Table({
    embedding: makeArrowEmbeddingVector(4, new Float32Array([1, 2, 3, 4])),
    sourceIds: arrow.makeVector(new Uint32Array([10]))
  });
  const storageLayout = makeStorageShaderLayout('embedding', 'sourceIds');

  expect(
    () =>
      makeGPUTableFromArrowTable(device, sourceTable, {
        shaderLayout: storageLayout,
        fixedSizeListColumns: ['missing']
      }),
    'rejects fixed-list columns that were not selected'
  ).toThrow(/selected storage binding/);
  expect(
    () =>
      makeGPUTableFromArrowTable(device, sourceTable, {
        shaderLayout: storageLayout,
        fixedSizeListColumns: ['sourceIds']
      }),
    'rejects scalar columns requested as fixed-size lists'
  ).toThrow(/FixedSizeList source data/);
  expect(
    () =>
      makeGPUTableFromArrowTable(device, sourceTable, {
        shaderLayout: storageLayout,
        validityColumns: {embedding: 'sourceIds'}
      }),
    'rejects validity siblings that collide with existing table columns'
  ).toThrow(/unique output/);
  expect(
    () =>
      makeGPUTableFromArrowTable(device, sourceTable, {
        shaderLayout: storageLayout,
        validityColumns: {embedding: {name: 'embeddingValidity', dimensions: 5}}
      }),
    'rejects meaningful dimensions wider than the physical Arrow list'
  ).toThrow(/validity dimensions/);
  expect(
    () =>
      makeGPUTableFromArrowTable(device, sourceTable, {
        shaderLayout: {
          attributes: [{name: 'embedding', location: 0, type: 'vec4<f32>'}],
          bindings: []
        },
        fixedSizeListColumns: ['embedding']
      }),
    'rejects fixed-size-list columns exposed as vertex attributes'
  ).toThrow(/storage shader binding/);

  void 0;
});

it('Arrow FixedSizeList table columns upload preserved batches to actual WebGPU buffers', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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

    expect(device.type, 'the adapter uses a real browser WebGPU device').toBe('webgpu');
    expect(
      table.batches.map(batch => batch.numRows),
      `${dimensions}-dimensional rows preserve source record batches`
    ).toEqual([2, 1]);
    expect(
      await readFloat32Data(table.batches[0].gpuData.embedding),
      `${dimensions}-dimensional first batch uploads intact`
    ).toEqual(firstValues);
    expect(
      await readFloat32Data(table.batches[1].gpuData.embedding),
      `${dimensions}-dimensional second batch uploads intact`
    ).toEqual(secondValues);
    expect(
      Array.from(await readUint32Data(table.batches[0].gpuData.sourceIds)),
      'GPU-resident stable ID siblings preserve source rows'
    ).toEqual([12, 40]);

    const ownedBuffers = table.batches.flatMap(batch =>
      Object.values(batch.gpuData).map(data => data.buffer)
    );
    table.destroy();
    expect(
      Boolean(ownedBuffers.every(buffer => buffer.destroyed)),
      'the table owns every WebGPU buffer'
    ).toBe(true);
  }

  void 0;
});

it('nullable FixedSizeList rows and physical padding upload correctly on actual WebGPU', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
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

  expect(
    Array.from(await readUint32Data(table.batches[0].gpuData.embeddingValidity)),
    'actual GPU validity excludes nullable meaningful coordinates and null parents'
  ).toEqual([1, 0, 0]);
  expect(
    Array.from(await readFloat32Data(table.batches[0].gpuData.embedding)),
    'actual GPU storage retains physical row padding and omitted trailing null rows'
  ).toEqual([1, 2, 3, 0, 4, 0, 6, 99, 0, 0, 0, 0]);

  table.destroy();
  void 0;
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
