// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {ArrowGPUTable, StreamingArrowGPUTable, StreamingArrowGPUVector} from '@luma.gl/arrow';
import type {ShaderLayout} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

type RecordedWrite = {
  data: ArrayBufferView;
  byteOffset: number;
};

test('StreamingArrowGPUVector appends one Arrow Data chunk without copying the source view', t => {
  const device = new NullDevice({});
  const values = new Float32Array([1, 2, 3, 4]);
  const data = new arrow.Data(new arrow.Float32(), 0, 4, 0, [undefined, values]);
  const vector = new StreamingArrowGPUVector({
    name: 'weights',
    device,
    arrowType: new arrow.Float32()
  });
  const writes = recordDynamicBufferWrites(vector.buffer);

  vector.appendData(data);

  t.equal(vector.length, 4, 'updates row count');
  t.equal(writes.length, 1, 'writes one source chunk');
  t.equal(writes[0].data.buffer, values.buffer, 'writes a view over the Arrow value buffer');
  t.equal(writes[0].byteOffset, 0, 'writes at the current append offset');

  vector.destroy();
  t.end();
});

test('StreamingArrowGPUVector appends chunked Arrow vectors one write per Data chunk', t => {
  const device = new NullDevice({});
  const firstValues = new Float32Array([1, 2]);
  const secondValues = new Float32Array([3, 4, 5]);
  const firstData = new arrow.Data(new arrow.Float32(), 0, 2, 0, [undefined, firstValues]);
  const secondData = new arrow.Data(new arrow.Float32(), 0, 3, 0, [undefined, secondValues]);
  const arrowVector = new arrow.Vector([firstData, secondData]);
  const gpuVector = new StreamingArrowGPUVector({
    name: 'weights',
    device,
    arrowType: new arrow.Float32()
  });
  const writes = recordDynamicBufferWrites(gpuVector.buffer);

  gpuVector.appendVector(arrowVector);

  t.equal(gpuVector.length, 5, 'updates row count across chunks');
  t.equal(writes.length, 2, 'writes each chunk separately');
  t.equal(writes[0].data.buffer, firstValues.buffer, 'writes first Arrow buffer directly');
  t.equal(writes[1].data.buffer, secondValues.buffer, 'writes second Arrow buffer directly');
  t.equal(writes[1].byteOffset, firstValues.byteLength, 'writes second chunk after first chunk');

  gpuVector.destroy();
  t.end();
});

test('StreamingArrowGPUVector appends sliced Arrow Data from the correct source offset', t => {
  const device = new NullDevice({});
  const values = new Float32Array([0, 1, 2, 3, 4, 5]);
  const data = new arrow.Data(new arrow.Float32(), 1, 2, 0, [undefined, values]);
  const vector = new StreamingArrowGPUVector({
    name: 'positions',
    device,
    arrowType: new arrow.Float32()
  });
  const writes = recordDynamicBufferWrites(vector.buffer);

  vector.appendData(data);

  t.equal(writes[0].data.buffer, values.buffer, 'writes a source-buffer view');
  t.equal(
    writes[0].data.byteOffset,
    values.byteOffset + Float32Array.BYTES_PER_ELEMENT,
    'uses the Arrow Data offset'
  );
  t.deepEqual(Array.from(writes[0].data as Float32Array), [1, 2], 'writes the sliced rows');

  vector.destroy();
  t.end();
});

test('StreamingArrowGPUVector appends sliced Arrow Vector data without double offsetting', t => {
  const device = new NullDevice({});
  const sourceVector = arrow.makeVector(new Float32Array([0, 1, 2, 3])).slice(1, 3);
  const vector = new StreamingArrowGPUVector({
    name: 'positions',
    device,
    arrowType: new arrow.Float32()
  });
  const writes = recordDynamicBufferWrites(vector.buffer);

  vector.appendVector(sourceVector);

  t.equal(writes.length, 1, 'writes one sliced data chunk');
  t.deepEqual(Array.from(writes[0].data as Float32Array), [1, 2], 'writes sliced values once');

  vector.destroy();
  t.end();
});

test('StreamingArrowGPUVector appends sliced FixedSizeList Vector data without double offsetting', t => {
  const device = new NullDevice({});
  const sourceData = makeFixedSizeListData(
    new arrow.Float32(),
    2,
    new Float32Array([0, 1, 2, 3, 4, 5, 6, 7])
  );
  const sourceVector = arrow.makeVector(sourceData).slice(1, 3);
  const vector = new StreamingArrowGPUVector({
    name: 'positions',
    device,
    arrowType: sourceVector.type
  });
  const writes = recordDynamicBufferWrites(vector.buffer);

  vector.appendVector(sourceVector);

  t.equal(writes.length, 1, 'writes one sliced FixedSizeList data chunk');
  t.deepEqual(
    Array.from(writes[0].data as Float32Array),
    [2, 3, 4, 5],
    'writes sliced child values once'
  );

  vector.destroy();
  t.end();
});

test('StreamingArrowGPUVector grows capacity without replacing the public DynamicBuffer', t => {
  const device = new NullDevice({});
  const vector = new StreamingArrowGPUVector({
    name: 'weights',
    device,
    arrowType: new arrow.Float32(),
    initialCapacityRows: 3
  });
  const dynamicBuffer = vector.buffer;
  const initialBackingBuffer = dynamicBuffer.buffer;

  vector.appendData(
    new arrow.Data(new arrow.Float32(), 0, 1, 0, [undefined, new Float32Array([1])])
  );
  vector.appendData(
    new arrow.Data(new arrow.Float32(), 0, 3, 0, [undefined, new Float32Array([2, 3, 4])])
  );

  t.equal(vector.buffer, dynamicBuffer, 'keeps the public DynamicBuffer stable');
  t.notEqual(
    dynamicBuffer.buffer,
    initialBackingBuffer,
    'replaces the backing GPU buffer on growth'
  );
  t.ok(vector.capacityRows >= 4, 'grows capacity to fit appended rows');

  vector.destroy();
  t.end();
});

test('StreamingArrowGPUVector reset clears length and keeps reusable allocation', t => {
  const device = new NullDevice({});
  const vector = new StreamingArrowGPUVector({
    name: 'weights',
    device,
    arrowType: new arrow.Float32()
  });

  vector.appendData(
    new arrow.Data(new arrow.Float32(), 0, 2, 0, [undefined, new Float32Array([1, 2])])
  );
  const dynamicBuffer = vector.buffer;
  vector.reset();

  t.equal(vector.length, 0, 'clears logical rows');
  t.equal(vector.buffer, dynamicBuffer, 'keeps DynamicBuffer allocation');

  vector.destroy();
  t.end();
});

test('StreamingArrowGPUVector readAsync returns appended rows only', async t => {
  const device = new NullDevice({});
  const vector = new StreamingArrowGPUVector({
    name: 'weights',
    device,
    arrowType: new arrow.Float32(),
    initialCapacityRows: 3
  });

  vector.appendData(
    new arrow.Data(new arrow.Float32(), 0, 1, 0, [undefined, new Float32Array([1])])
  );
  vector.appendData(
    new arrow.Data(new arrow.Float32(), 0, 3, 0, [undefined, new Float32Array([2, 3, 4])])
  );

  const result = await vector.readAsync();

  t.ok(vector.capacityRows > vector.length, 'has unused capacity after growth');
  t.equal(result.length, 4, 'returns logical row count');
  t.deepEqual(Array.from(result.toArray()), [1, 2, 3, 4], 'reads appended rows');

  vector.destroy();
  t.end();
});

test('StreamingArrowGPUVector readAsync returns an empty vector after reset', async t => {
  const device = new NullDevice({});
  const vector = new StreamingArrowGPUVector({
    name: 'weights',
    device,
    arrowType: new arrow.Float32()
  });

  vector.appendData(
    new arrow.Data(new arrow.Float32(), 0, 2, 0, [undefined, new Float32Array([1, 2])])
  );
  vector.reset();

  const result = await vector.readAsync();

  t.ok(arrow.util.compareTypes(result.type, new arrow.Float32()), 'preserves Arrow type');
  t.equal(result.length, 0, 'returns no rows');
  t.deepEqual(Array.from(result.toArray()), [], 'returns empty values');

  vector.destroy();
  t.end();
});

test('StreamingArrowGPUVector rejects nullable and unsupported sources', t => {
  const device = new NullDevice({});
  const vector = new StreamingArrowGPUVector({
    name: 'weights',
    device,
    arrowType: new arrow.Float32()
  });
  const nullableData = new arrow.Data(new arrow.Float32(), 0, 1, 1, [
    new Uint8Array([0]),
    new Float32Array([1])
  ]);

  t.throws(() => vector.appendData(nullableData), /nullable data/, 'rejects nullable chunks');
  t.throws(
    () =>
      new StreamingArrowGPUVector({
        name: 'labels',
        device,
        arrowType: new arrow.Utf8() as unknown as arrow.Float32
      }),
    /does not support Arrow type/,
    'rejects non-attribute Arrow types'
  );

  vector.destroy();
  t.end();
});

test('StreamingArrowGPUTable matches ArrowGPUTable selection and arrowPaths behavior', t => {
  const device = new NullDevice({});
  const table = makeGpuMetadataTable([0, 0, 1, 1], [255, 0, 0, 255, 0, 255, 0, 255]);
  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'instanceColors', location: 0, type: 'vec4<f32>'}],
    bindings: []
  };
  const streamingTable = new StreamingArrowGPUTable({
    device,
    schema: table.schema,
    shaderLayout,
    arrowPaths: {instanceColors: 'colors'}
  });
  const staticTable = new ArrowGPUTable(device, table, {
    shaderLayout,
    arrowPaths: {instanceColors: 'colors'}
  });

  t.deepEqual(streamingTable.bufferLayout, staticTable.bufferLayout, 'matches static table layout');
  t.deepEqual(
    streamingTable.schema.fields.map(field => field.name),
    staticTable.schema.fields.map(field => field.name),
    'matches static table selected schema names'
  );
  t.ok(
    streamingTable.attributes['instanceColors'] instanceof DynamicBuffer,
    'exposes DynamicBuffer attributes'
  );

  streamingTable.destroy();
  staticTable.destroy();
  t.end();
});

test('StreamingArrowGPUTable appends record batches and tables into stable attributes', t => {
  const device = new NullDevice({});
  const firstBatch = makeGpuMetadataRecordBatch([0, 0, 1, 1], [255, 0, 0, 255, 0, 255, 0, 255]);
  const secondBatch = makeGpuMetadataRecordBatch([2, 2], [0, 0, 255, 255]);
  const streamingTable = new StreamingArrowGPUTable({
    device,
    schema: firstBatch.schema,
    shaderLayout: makePositionColorShaderLayout(),
    initialCapacityRows: 1
  });
  const positionsAttribute = streamingTable.attributes['positions'];

  streamingTable.appendRecordBatch(firstBatch);
  streamingTable.appendTable(new arrow.Table([secondBatch]));

  t.equal(streamingTable.numRows, 3, 'updates table row count across appends');
  t.equal(streamingTable.gpuVectors['positions'].length, 3, 'updates vector row count');
  t.equal(
    streamingTable.attributes['positions'],
    positionsAttribute,
    'keeps attribute object stable'
  );
  t.equal(streamingTable.numCols, 2, 'exposes selected column count');

  streamingTable.destroy();
  t.end();
});

test('StreamingArrowGPUTable appends table record batches as separate data uploads', t => {
  const device = new NullDevice({});
  const firstBatch = makeGpuMetadataRecordBatch([0, 0, 1, 1], [255, 0, 0, 255, 0, 255, 0, 255]);
  const secondBatch = makeGpuMetadataRecordBatch([2, 2], [0, 0, 255, 255]);
  const streamingTable = new StreamingArrowGPUTable({
    device,
    schema: firstBatch.schema,
    shaderLayout: makePositionColorShaderLayout()
  });
  const positionWrites = recordDynamicBufferWrites(streamingTable.gpuVectors['positions'].buffer);

  streamingTable.appendTable(new arrow.Table([firstBatch, secondBatch]));

  t.equal(positionWrites.length, 2, 'writes one chunk per table record batch');
  t.deepEqual(
    Array.from(positionWrites[0].data as Float32Array),
    [0, 0, 1, 1],
    'writes first batch values'
  );
  t.deepEqual(
    Array.from(positionWrites[1].data as Float32Array),
    [2, 2],
    'writes second batch values'
  );
  t.equal(streamingTable.numRows, 3, 'updates row count across table batches');

  streamingTable.destroy();
  t.end();
});

test('StreamingArrowGPUTable initializes from synchronous record batch sources', t => {
  const device = new NullDevice({});
  const firstBatch = makeGpuMetadataRecordBatch([0, 0], [255, 0, 0, 255]);
  const secondBatch = makeGpuMetadataRecordBatch([1, 1, 2, 2], [0, 255, 0, 255, 0, 0, 255, 255]);
  const streamingTable = new StreamingArrowGPUTable({
    device,
    recordBatches: [firstBatch, secondBatch],
    shaderLayout: makePositionColorShaderLayout()
  });

  t.equal(streamingTable.numRows, 3, 'consumes iterable record batches during construction');
  t.equal(streamingTable.gpuVectors['positions'].length, 3, 'uploads every iterable row');
  t.equal(streamingTable.nullCount, 0, 'tracks appended null count');

  streamingTable.destroy();
  t.end();
});

test('StreamingArrowGPUTable initializes from async record batch sources', async t => {
  const device = new NullDevice({});
  const firstBatch = makeGpuMetadataRecordBatch([0, 0], [255, 0, 0, 255]);
  const secondBatch = makeGpuMetadataRecordBatch([1, 1], [0, 255, 0, 255]);
  const streamingTable = new StreamingArrowGPUTable({
    device,
    schema: firstBatch.schema,
    asyncRecordBatches: makeAsyncRecordBatches([firstBatch, secondBatch]),
    shaderLayout: makePositionColorShaderLayout()
  });

  t.equal(streamingTable.numRows, 0, 'starts before async constructor source is consumed');
  await streamingTable.ready;
  t.equal(streamingTable.numRows, 2, 'consumes async record batches through ready');
  t.equal(streamingTable.gpuVectors['colors'].length, 2, 'uploads async source rows');

  streamingTable.destroy();
  t.end();
});

test('StreamingArrowGPUTable appends async record batch sources after construction', async t => {
  const device = new NullDevice({});
  const firstBatch = makeGpuMetadataRecordBatch([0, 0], [255, 0, 0, 255]);
  const streamingTable = new StreamingArrowGPUTable({
    device,
    schema: firstBatch.schema,
    shaderLayout: makePositionColorShaderLayout()
  });

  await streamingTable.appendRecordBatchesAsync(makeAsyncRecordBatches([firstBatch]));

  t.equal(streamingTable.numRows, 1, 'appends async source rows');

  streamingTable.destroy();
  t.end();
});

test('StreamingArrowGPUTable validates append schemas and reset/destroy lifecycle', t => {
  const device = new NullDevice({});
  const batch = makeGpuMetadataRecordBatch([0, 0], [255, 0, 0, 255]);
  const streamingTable = new StreamingArrowGPUTable({
    device,
    recordBatch: batch,
    shaderLayout: makePositionColorShaderLayout()
  });
  const missingPositionsBatch = makeColorsOnlyRecordBatch([0, 0, 255, 255]);
  const positionsBuffer = streamingTable.gpuVectors['positions'].buffer;

  t.equal(streamingTable.numRows, 1, 'appends constructor record batch');
  t.throws(
    () => streamingTable.appendRecordBatch(missingPositionsBatch),
    /does not match the source schema/,
    'rejects mismatched schemas'
  );

  streamingTable.reset();
  t.equal(streamingTable.numRows, 0, 'reset clears table rows');
  t.equal(streamingTable.gpuVectors['positions'].length, 0, 'reset clears vector rows');

  streamingTable.destroy();
  t.ok(positionsBuffer.destroyed, 'destroy releases owned dynamic buffers');
  t.end();
});

function recordDynamicBufferWrites(buffer: DynamicBuffer): RecordedWrite[] {
  const writes: RecordedWrite[] = [];
  const originalWrite = buffer.write.bind(buffer);
  buffer.write = (data: ArrayBuffer | SharedArrayBuffer | ArrayBufferView, byteOffset = 0) => {
    writes.push({data: data as ArrayBufferView, byteOffset});
    originalWrite(data, byteOffset);
  };
  return writes;
}

function makePositionColorShaderLayout(): ShaderLayout {
  return {
    attributes: [
      {name: 'positions', location: 0, type: 'vec2<f32>'},
      {name: 'colors', location: 1, type: 'vec4<f32>'}
    ],
    bindings: []
  };
}

function makeGpuMetadataTable(positions: number[], colors: number[]): arrow.Table {
  return new arrow.Table([makeGpuMetadataRecordBatch(positions, colors)]);
}

function makeGpuMetadataRecordBatch(positions: number[], colors: number[]): arrow.RecordBatch {
  const positionsData = makeFixedSizeListData(new arrow.Float32(), 2, new Float32Array(positions));
  const colorsData = makeFixedSizeListData(new arrow.Uint8(), 4, new Uint8Array(colors));
  const schema = new arrow.Schema(
    [
      new arrow.Field('positions', positionsData.type, false, new Map([['semantic', 'position']])),
      new arrow.Field('colors', colorsData.type, false, new Map([['semantic', 'color']]))
    ],
    new Map([['table', 'source']])
  );
  const structData = arrow.makeData({
    type: new arrow.Struct(schema.fields),
    length: positionsData.length,
    nullCount: 0,
    nullBitmap: null,
    children: [positionsData, colorsData]
  });
  return new arrow.RecordBatch(schema, structData);
}

function makeColorsOnlyRecordBatch(colors: number[]): arrow.RecordBatch {
  const colorsData = makeFixedSizeListData(new arrow.Uint8(), 4, new Uint8Array(colors));
  const schema = new arrow.Schema([new arrow.Field('colors', colorsData.type, false)]);
  const structData = arrow.makeData({
    type: new arrow.Struct(schema.fields),
    length: colorsData.length,
    nullCount: 0,
    nullBitmap: null,
    children: [colorsData]
  });
  return new arrow.RecordBatch(schema, structData);
}

async function* makeAsyncRecordBatches(
  recordBatches: arrow.RecordBatch[]
): AsyncGenerator<arrow.RecordBatch> {
  for (const recordBatch of recordBatches) {
    yield recordBatch;
  }
}

function makeFixedSizeListData<T extends arrow.DataType>(
  childType: T,
  listSize: 2 | 3 | 4,
  values: T['TArray']
): arrow.Data<arrow.FixedSizeList<T>> {
  const childData = new arrow.Data(childType, 0, values.length, 0, [undefined, values]);
  const listType = new arrow.FixedSizeList(listSize, new arrow.Field('value', childType));
  return new arrow.Data(listType, 0, values.length / listSize, 0, undefined, [childData]);
}
