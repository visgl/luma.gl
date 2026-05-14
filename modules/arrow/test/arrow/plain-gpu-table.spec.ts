// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {GPURecordBatch, GPUVector, GPUTable} from '@luma.gl/arrow';
import type {ShaderLayout} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

test('GPUTable creates GPU vectors from shader-compatible Arrow table columns', t => {
  const device = new NullDevice({});
  const table = makeGpuMetadataTable();
  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'positions', location: 0, type: 'vec2<f32>'},
      {name: 'colors', location: 1, type: 'vec4<f32>'},
      {name: 'missing', location: 2, type: 'vec4<f32>'}
    ],
    bindings: []
  };

  const gpuTable = new GPUTable(device, table, {shaderLayout});

  t.notOk('table' in gpuTable, 'does not retain the source Arrow table');
  t.equal(gpuTable.numRows, table.numRows, 'exposes source table row count');
  t.equal(gpuTable.numCols, gpuTable.schema.fields.length, 'exposes GPU schema column count');
  t.equal(gpuTable.nullCount, table.nullCount, 'exposes source table null count');
  t.equal(gpuTable.schema.metadata.get('table'), 'source', 'exposes GPU schema metadata');
  t.equal(gpuTable.schema.fields.length, 2, 'exposes selected GPU fields');
  t.deepEqual(
    gpuTable.schema.fields.map(field => field.name),
    ['positions', 'colors'],
    'GPU schema fields use shader attribute names'
  );
  t.deepEqual(
    gpuTable.bufferLayout,
    [
      {name: 'positions', format: 'float32x2'},
      {name: 'colors', format: 'unorm8x4'}
    ],
    'derives buffer layouts for matching shader attributes'
  );
  t.ok(gpuTable.gpuVectors.positions instanceof GPUVector, 'creates a positions GPU vector');
  t.ok(gpuTable.gpuVectors.colors instanceof GPUVector, 'creates a colors GPU vector');
  t.equal(
    gpuTable.gpuVectors.positions.type,
    table.getChild('positions')?.type,
    'vector exposes type'
  );
  t.equal(gpuTable.gpuVectors.positions.length, 2, 'vector exposes length');
  t.equal(gpuTable.gpuVectors.positions.stride, 2, 'vector exposes stride');
  t.equal(gpuTable.gpuVectors.colors.stride, 4, 'vector exposes color stride');
  t.equal(
    gpuTable.schema.fields[0].metadata.get('semantic'),
    'position',
    'preserves same-name field metadata'
  );
  t.equal(
    gpuTable.attributes.positions,
    gpuTable.batches[0].gpuVectors.positions.buffer,
    'exposes positions as a Model attribute buffer'
  );
  t.equal(
    gpuTable.attributes.colors,
    gpuTable.batches[0].gpuVectors.colors.buffer,
    'exposes colors as a Model attribute buffer'
  );
  t.notOk(gpuTable.attributes.missing, 'skips missing table columns');

  gpuTable.destroy();
  t.end();
});

test('GPUTable maps shader attributes through Arrow paths', t => {
  const device = new NullDevice({});
  const table = makeGpuMetadataTable();
  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'instanceColors', location: 0, type: 'vec4<f32>'}],
    bindings: []
  };

  const gpuTable = new GPUTable(device, table, {
    shaderLayout,
    arrowPaths: {instanceColors: 'colors'}
  });

  t.deepEqual(
    gpuTable.bufferLayout,
    [{name: 'instanceColors', format: 'unorm8x4'}],
    'derives buffer layouts from explicit Arrow paths'
  );
  t.ok(gpuTable.attributes.instanceColors, 'exposes renamed shader attribute buffer');
  t.deepEqual(
    gpuTable.schema.fields.map(field => field.name),
    ['instanceColors'],
    'renamed GPU schema field uses shader attribute name'
  );
  t.equal(
    gpuTable.schema.fields[0].metadata.get('semantic'),
    'color',
    'renamed GPU schema field preserves source field metadata'
  );
  t.equal(
    gpuTable.schema.fields[0].type,
    table.getChild('colors')?.type,
    'renamed GPU schema field preserves source field type'
  );

  gpuTable.destroy();
  t.end();
});

test('GPUTable preserves nested Arrow field metadata', t => {
  const device = new NullDevice({});
  const table = makeNestedGpuMetadataTable();
  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'instanceColors', location: 0, type: 'vec4<f32>'}],
    bindings: []
  };

  const gpuTable = new GPUTable(device, table, {
    shaderLayout,
    arrowPaths: {instanceColors: 'style.colors'}
  });

  t.equal(
    gpuTable.schema.fields[0].name,
    'instanceColors',
    'nested path GPU schema field uses shader attribute name'
  );
  t.equal(
    gpuTable.schema.fields[0].metadata.get('semantic'),
    'nested-color',
    'nested path GPU schema field preserves leaf field metadata'
  );
  gpuTable.destroy();
  t.end();
});

test('GPUTable preserves record batch boundaries with real batch-owned GPU buffers', t => {
  const device = new NullDevice({});
  const firstBatch = makeGpuMetadataTable().batches[0];
  const secondBatch = makeGpuMetadataTable().batches[0];
  const table = new arrow.Table([firstBatch, secondBatch]);
  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'positions', location: 0, type: 'vec2<f32>'},
      {name: 'colors', location: 1, type: 'vec4<f32>'}
    ],
    bindings: []
  };

  const gpuTable = new GPUTable(device, table, {shaderLayout});

  t.equal(gpuTable.numRows, 4, 'keeps the full table row count');
  t.equal(gpuTable.batches.length, 2, 'exposes one GPU record batch per Arrow batch');
  t.ok(gpuTable.batches[0] instanceof GPURecordBatch, 'creates GPURecordBatch views');
  t.equal(gpuTable.gpuVectors.positions.data.length, 2, 'keeps vector data chunk boundaries');
  t.equal(gpuTable.batches[1].numRows, 2, 'tracks rows per record batch');
  t.deepEqual(
    gpuTable.batches[1].bufferLayout,
    gpuTable.bufferLayout,
    'retains table buffer layout metadata on GPU batches'
  );
  t.notEqual(
    gpuTable.batches[1].gpuVectors.positions.buffer,
    gpuTable.batches[0].gpuVectors.positions.buffer,
    'record batches keep separate GPU buffers'
  );
  t.equal(
    gpuTable.gpuVectors.positions.data[0].buffer.buffer,
    gpuTable.batches[0].gpuVectors.positions.buffer,
    'aggregate vectors expose the first batch chunk'
  );
  t.equal(
    gpuTable.gpuVectors.positions.data[1].buffer.buffer,
    gpuTable.batches[1].gpuVectors.positions.buffer,
    'aggregate vectors expose the second batch chunk'
  );
  t.throws(
    () => gpuTable.gpuVectors.positions.buffer,
    /multi-buffer vectors/,
    'aggregate multi-batch vectors do not expose a misleading single buffer'
  );

  gpuTable.destroy();
  t.end();
});

test('GPUTable packBatches collapses owned batches in place', t => {
  const device = new NullDevice({});
  const firstBatch = makeGpuMetadataTable().batches[0];
  const secondBatch = makeGpuMetadataTable().batches[0];
  const table = new arrow.Table([firstBatch, secondBatch]);
  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'positions', location: 0, type: 'vec2<f32>'},
      {name: 'colors', location: 1, type: 'vec4<f32>'}
    ],
    bindings: []
  };
  const gpuTable = new GPUTable(device, table, {shaderLayout});
  const firstPositionsBuffer = gpuTable.batches[0].gpuVectors.positions.buffer;
  const secondPositionsBuffer = gpuTable.batches[1].gpuVectors.positions.buffer;

  gpuTable.packBatches();

  t.equal(gpuTable.batches.length, 1, 'replaces all preserved batches with one packed batch');
  t.equal(gpuTable.batches[0].numRows, 4, 'preserves the packed row count');
  t.equal(gpuTable.gpuVectors.positions.data.length, 1, 'exposes one packed aggregate chunk');
  t.equal(
    gpuTable.attributes.positions,
    gpuTable.batches[0].gpuVectors.positions.buffer,
    'updates direct table attributes to the packed batch buffer'
  );
  t.ok(firstPositionsBuffer.destroyed, 'destroys the first superseded owned batch buffer');
  t.ok(secondPositionsBuffer.destroyed, 'destroys the second superseded owned batch buffer');

  gpuTable.destroy();
  t.end();
});

test('GPUTable packBatches greedily merges adjacent batches to the requested size', t => {
  const device = new NullDevice({});
  const batches = [
    makeGpuMetadataTable().batches[0],
    makeGpuMetadataTable().batches[0],
    makeGpuMetadataTable().batches[0]
  ];
  const table = new arrow.Table(batches);
  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'positions', location: 0, type: 'vec2<f32>'},
      {name: 'colors', location: 1, type: 'vec4<f32>'}
    ],
    bindings: []
  };
  const gpuTable = new GPUTable(device, table, {shaderLayout});

  gpuTable.packBatches({minBatchSize: 3});

  t.deepEqual(
    gpuTable.batches.map(batch => batch.numRows),
    [4, 2],
    'merges adjacent batches until each emitted batch reaches the threshold'
  );
  t.equal(gpuTable.gpuVectors.positions.data.length, 2, 'retains one chunk per packed batch');

  gpuTable.destroy();
  t.end();
});

test('GPUTable addBatch appends an already-owned GPU record batch in place', t => {
  const device = new NullDevice({});
  const firstBatch = makeGpuMetadataTable().batches[0];
  const secondBatch = makeGpuMetadataTable().batches[0];
  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'positions', location: 0, type: 'vec2<f32>'},
      {name: 'colors', location: 1, type: 'vec4<f32>'}
    ],
    bindings: []
  };
  const gpuTable = new GPUTable(device, new arrow.Table([firstBatch]), {shaderLayout});
  const gpuRecordBatch = new GPURecordBatch(device, secondBatch, {shaderLayout});
  const appendedPositionsBuffer = gpuRecordBatch.gpuVectors.positions.buffer;

  gpuTable.addBatch(gpuRecordBatch);

  t.equal(gpuTable.batches.length, 2, 'appends the supplied GPU batch');
  t.equal(gpuTable.numRows, 4, 'updates the aggregate row count');
  t.equal(gpuTable.gpuVectors.positions.data.length, 2, 'extends aggregate vector chunks');
  t.equal(
    gpuTable.gpuVectors.positions.data[1].buffer.buffer,
    appendedPositionsBuffer,
    'keeps the appended batch buffer identity visible through data[]'
  );

  gpuTable.destroy();
  t.ok(
    appendedPositionsBuffer.destroyed,
    'table destruction follows the appended batch destroy path'
  );
  t.end();
});

test('GPUTable addToLastBatch appends Arrow batches into one mutable trailing GPU batch', t => {
  const device = new NullDevice({});
  const sourceTable = makeGpuMetadataTable();
  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'positions', location: 0, type: 'vec2<f32>'},
      {name: 'colors', location: 1, type: 'vec4<f32>'}
    ],
    bindings: []
  };
  const gpuTable = new GPUTable({
    type: 'appendable',
    device,
    schema: sourceTable.schema,
    shaderLayout,
    initialCapacityRows: 1
  });

  gpuTable.addToLastBatch(sourceTable.batches[0]);
  gpuTable.addToLastBatch(sourceTable.batches[0]);

  t.equal(gpuTable.batches.length, 1, 'keeps one mutable trailing batch');
  t.equal(gpuTable.numRows, 4, 'updates table rows across append operations');
  t.equal(gpuTable.batches[0].numRows, 4, 'updates trailing batch row count');
  t.equal(gpuTable.gpuVectors.positions.data.length, 2, 'restitches aggregate GPU ranges');
  t.ok(
    gpuTable.attributes.positions instanceof DynamicBuffer,
    'exposes DynamicBuffer attributes through the regular table API'
  );

  gpuTable.resetLastBatch();
  t.equal(gpuTable.numRows, 0, 'resetLastBatch clears mutable rows from the table count');
  t.equal(gpuTable.batches[0].numRows, 0, 'resetLastBatch clears mutable batch rows');

  gpuTable.destroy();
  t.end();
});

test('GPUTable select keeps requested columns and destroys dropped batch vectors', t => {
  const device = new NullDevice({});
  const table = makeGpuMetadataTable();
  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'positions', location: 0, type: 'vec2<f32>'},
      {name: 'colors', location: 1, type: 'vec4<f32>'}
    ],
    bindings: []
  };
  const gpuTable = new GPUTable(device, table, {shaderLayout});
  const droppedColorsBuffer = gpuTable.batches[0].gpuVectors.colors.buffer;

  gpuTable.select('positions');

  t.deepEqual(
    gpuTable.schema.fields.map(field => field.name),
    ['positions'],
    'retains only the requested table schema field'
  );
  t.deepEqual(
    gpuTable.batches[0].schema.fields.map(field => field.name),
    ['positions'],
    'restitches batch schemas to the selected column set'
  );
  t.ok(gpuTable.gpuVectors.positions, 'keeps selected aggregate vectors');
  t.notOk(gpuTable.gpuVectors.colors, 'removes dropped aggregate vectors');
  t.ok(droppedColorsBuffer.destroyed, 'destroys dropped batch-local GPU vectors');

  gpuTable.destroy();
  t.end();
});

test('GPUTable detachVector removes one live column and transfers its ownership', t => {
  const device = new NullDevice({});
  const firstBatch = makeGpuMetadataTable().batches[0];
  const secondBatch = makeGpuMetadataTable().batches[0];
  const table = new arrow.Table([firstBatch, secondBatch]);
  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'positions', location: 0, type: 'vec2<f32>'},
      {name: 'colors', location: 1, type: 'vec4<f32>'}
    ],
    bindings: []
  };
  const gpuTable = new GPUTable(device, table, {shaderLayout});
  const colorsBuffers = gpuTable.batches.map(batch => batch.gpuVectors.colors.buffer);

  const detachedColors = gpuTable.detachVector('colors');

  t.deepEqual(
    gpuTable.schema.fields.map(field => field.name),
    ['positions'],
    'removes the detached table column'
  );
  t.equal(detachedColors.data.length, 2, 'returns all detached batch data chunks');
  t.ok(detachedColors.ownsBuffer, 'detached vector retains the removed GPU ownership');

  gpuTable.destroy();
  t.notOk(colorsBuffers[0].destroyed, 'table no longer destroys the first detached column buffer');
  t.notOk(colorsBuffers[1].destroyed, 'table no longer destroys the second detached column buffer');
  detachedColors.destroy();
  t.ok(colorsBuffers[0].destroyed, 'detached vector destroys the first removed column buffer');
  t.ok(colorsBuffers[1].destroyed, 'detached vector destroys the second removed column buffer');
  t.end();
});

test('GPUTable detachBatches removes a live batch range and restitches aggregates', t => {
  const device = new NullDevice({});
  const batches = [
    makeGpuMetadataTable().batches[0],
    makeGpuMetadataTable().batches[0],
    makeGpuMetadataTable().batches[0]
  ];
  const table = new arrow.Table(batches);
  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'positions', location: 0, type: 'vec2<f32>'},
      {name: 'colors', location: 1, type: 'vec4<f32>'}
    ],
    bindings: []
  };
  const gpuTable = new GPUTable(device, table, {shaderLayout});
  const detachedBatchBuffer = gpuTable.batches[1].gpuVectors.positions.buffer;

  const detachedBatches = gpuTable.detachBatches({first: 1, last: 2});

  t.equal(detachedBatches.length, 1, 'returns the detached half-open batch range');
  t.equal(gpuTable.batches.length, 2, 'removes detached batches from the table');
  t.equal(gpuTable.numRows, 4, 'updates table row count after detaching');
  t.equal(gpuTable.gpuVectors.positions.data.length, 2, 'restitches aggregate data chunks');

  gpuTable.destroy();
  t.notOk(detachedBatchBuffer.destroyed, 'table no longer destroys detached batch buffers');
  detachedBatches[0].destroy();
  t.ok(detachedBatchBuffer.destroyed, 'detached batch retains normal destroy ownership');
  t.end();
});

test('GPURecordBatch creates GPU vectors from one Arrow record batch', t => {
  const device = new NullDevice({});
  const recordBatch = makeGpuMetadataTable().batches[0];
  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'positions', location: 0, type: 'vec2<f32>'}],
    bindings: []
  };

  const gpuRecordBatch = new GPURecordBatch(device, recordBatch, {shaderLayout});

  t.equal(gpuRecordBatch.numRows, 2, 'exposes source batch row count');
  t.deepEqual(
    gpuRecordBatch.schema.fields.map(field => field.name),
    ['positions'],
    'selects shader-compatible fields'
  );
  t.ok(gpuRecordBatch.attributes.positions, 'exposes model-ready attributes');

  gpuRecordBatch.destroy();
  t.end();
});

test('GPUTable creates metadata from existing GPU vectors', t => {
  const device = new NullDevice({});
  const positions = new GPUVector({
    type: 'buffer',
    name: 'positions',
    buffer: device.createBuffer({byteLength: 16}),
    arrowType: new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float32())),
    length: 2,
    ownsBuffer: true
  });
  const weights = new GPUVector({
    type: 'buffer',
    name: 'weights',
    buffer: device.createBuffer({byteLength: 8}),
    arrowType: new arrow.Float32(),
    length: 2,
    ownsBuffer: true
  });

  const gpuTable = new GPUTable({vectors: {positions, weights}});

  t.equal(gpuTable.numRows, 2, 'deduces row count');
  t.equal(gpuTable.numCols, 2, 'deduces column count');
  t.deepEqual(
    gpuTable.schema.fields.map(field => field.name),
    ['positions', 'weights'],
    'deduces schema fields from vector names'
  );
  t.deepEqual(
    gpuTable.bufferLayout,
    [
      {name: 'positions', byteStride: 8, format: 'float32x2'},
      {name: 'weights', byteStride: 4, format: 'float32'}
    ],
    'synthesizes buffer layouts for regular vectors'
  );
  t.equal(gpuTable.attributes.positions, positions.buffer, 'maps positions attribute');
  t.equal(gpuTable.attributes.weights, weights.buffer, 'maps weights attribute');

  gpuTable.destroy();
  t.end();
});

test('GPUTable creates metadata from interleaved GPU vectors', t => {
  const device = new NullDevice({});
  const instances = new GPUVector({
    type: 'interleaved',
    name: 'instances',
    buffer: device.createBuffer({byteLength: 32}),
    length: 2,
    byteStride: 16,
    attributes: [
      {attribute: 'positions', format: 'float32x3', byteOffset: 0},
      {attribute: 'colors', format: 'uint8x4', byteOffset: 12}
    ],
    ownsBuffer: true
  });

  const gpuTable = new GPUTable({vectors: [instances]});

  t.equal(gpuTable.schema.fields[0].name, 'instances', 'uses vector name in schema');
  t.ok(arrow.DataType.isBinary(gpuTable.schema.fields[0].type), 'uses binary schema for storage');
  t.deepEqual(
    gpuTable.bufferLayout,
    [
      {
        name: 'instances',
        byteStride: 16,
        attributes: [
          {attribute: 'positions', format: 'float32x3', byteOffset: 0},
          {attribute: 'colors', format: 'uint8x4', byteOffset: 12}
        ]
      }
    ],
    'uses interleaved buffer layout from vector'
  );
  t.equal(gpuTable.attributes.positions, instances.buffer, 'maps positions to shared buffer');
  t.equal(gpuTable.attributes.colors, instances.buffer, 'maps colors to shared buffer');

  gpuTable.destroy();
  t.end();
});

function makeGpuMetadataTable(): arrow.Table {
  const positionsData = makeFixedSizeListData(
    new arrow.Float32(),
    2,
    new Float32Array([0, 0, 1, 1])
  );
  const colorsData = makeFixedSizeListData(
    new arrow.Uint8(),
    4,
    new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255])
  );
  const schema = new arrow.Schema(
    [
      new arrow.Field('positions', positionsData.type, false, new Map([['semantic', 'position']])),
      new arrow.Field('colors', colorsData.type, false, new Map([['semantic', 'color']]))
    ],
    new Map([['table', 'source']])
  );
  const structData = arrow.makeData({
    type: new arrow.Struct(schema.fields),
    length: 2,
    nullCount: 0,
    nullBitmap: null,
    children: [positionsData, colorsData]
  });

  return new arrow.Table([new arrow.RecordBatch(schema, structData)]);
}

function makeNestedGpuMetadataTable(): arrow.Table {
  const colorsData = makeFixedSizeListData(
    new arrow.Uint8(),
    4,
    new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255])
  );
  const nestedSchema = new arrow.Schema([
    new arrow.Field('colors', colorsData.type, false, new Map([['semantic', 'nested-color']]))
  ]);
  const nestedStructData = arrow.makeData({
    type: new arrow.Struct(nestedSchema.fields),
    length: 2,
    nullCount: 0,
    nullBitmap: null,
    children: [colorsData]
  });
  const schema = new arrow.Schema(
    [new arrow.Field('style', nestedStructData.type)],
    new Map([['table', 'nested-source']])
  );
  const structData = arrow.makeData({
    type: new arrow.Struct(schema.fields),
    length: 2,
    nullCount: 0,
    nullBitmap: null,
    children: [nestedStructData]
  });

  return new arrow.Table([new arrow.RecordBatch(schema, structData)]);
}

function makeFixedSizeListData<T extends arrow.DataType>(
  childType: T,
  listSize: 2 | 3 | 4,
  values: T['TArray']
): arrow.Data<arrow.FixedSizeList<T>> {
  const childData = arrow.makeData({
    type: childType,
    length: values.length,
    nullCount: 0,
    nullBitmap: null,
    data: values
  });
  const listType = new arrow.FixedSizeList(listSize, new arrow.Field('value', childType));
  return arrow.makeData({
    type: listType,
    length: values.length / listSize,
    nullCount: 0,
    nullBitmap: null,
    child: childData
  });
}
