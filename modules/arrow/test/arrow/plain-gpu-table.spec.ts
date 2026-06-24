// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  makeArrowFixedSizeListVector,
  makeGPURecordBatchFromArrowRecordBatch,
  makeGPUTableFromArrowTable
} from '@luma.gl/arrow';
import type {ShaderLayout} from '@luma.gl/core';
import {GPURecordBatch, GPUVector, GPUTable} from '@luma.gl/tables';
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

  const gpuTable = makeGPUTableFromArrowTable(device, table, {shaderLayout});

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
    gpuTable.gpuVectors.positions.dataType,
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
    gpuTable.batches[0].gpuData.positions.buffer,
    gpuTable.batches[0].gpuData.positions.buffer,
    'exposes positions as a Model attribute buffer'
  );
  t.equal(
    gpuTable.batches[0].gpuData.colors.buffer,
    gpuTable.batches[0].gpuData.colors.buffer,
    'exposes colors as a Model attribute buffer'
  );
  t.notOk('attributes' in gpuTable, 'does not cache derived attribute buffers');

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

  const gpuTable = makeGPUTableFromArrowTable(device, table, {
    shaderLayout,
    arrowPaths: {instanceColors: 'colors'}
  });

  t.deepEqual(
    gpuTable.bufferLayout,
    [{name: 'instanceColors', format: 'unorm8x4'}],
    'derives buffer layouts from explicit Arrow paths'
  );
  t.ok(gpuTable.batches[0].gpuData.instanceColors, 'retains renamed shader attribute data');
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
    gpuTable.schema.fields[0].format,
    'unorm8x4',
    'renamed GPU schema field preserves GPU memory format'
  );

  gpuTable.destroy();
  t.end();
});

test('GPUTable exposes storage-selected Arrow columns as GPUData', t => {
  const device = new NullDevice({});
  const table = makeGpuMetadataTable();
  const shaderLayout: ShaderLayout = {
    attributes: [],
    bindings: [{name: 'positions', type: 'read-only-storage', group: 0, location: 0}]
  };

  const gpuTable = makeGPUTableFromArrowTable(device, table, {shaderLayout});

  t.deepEqual(
    gpuTable.schema.fields.map(field => field.name),
    ['positions'],
    'storage-backed table columns participate in the selected GPU schema'
  );
  t.equal(gpuTable.numCols, 1, 'storage-backed selected columns count toward table columns');
  t.equal(
    gpuTable.batches[0].gpuData.positions.buffer,
    gpuTable.batches[0].gpuData.positions.buffer,
    'exposes the batch-local GPUData buffer as a model-ready storage binding'
  );
  t.notOk('bindings' in gpuTable, 'does not cache storage bindings');

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

  const gpuTable = makeGPUTableFromArrowTable(device, table, {
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

  const gpuTable = makeGPUTableFromArrowTable(device, table, {shaderLayout});

  t.equal(gpuTable.numRows, 4, 'keeps the full table row count');
  t.equal(gpuTable.batches.length, 2, 'exposes one GPU record batch per Arrow batch');
  t.ok(gpuTable.batches[0] instanceof GPURecordBatch, 'creates GPURecordBatch views');
  t.equal(gpuTable.gpuVectors.positions.data.length, 2, 'keeps vector data chunk boundaries');
  t.ok(
    arrow.DataType.isFixedSizeList(gpuTable.gpuVectors.positions.dataType as arrow.DataType),
    'aggregate vectors preserve adapter data type metadata'
  );
  t.equal(gpuTable.batches[1].numRows, 2, 'tracks rows per record batch');
  t.deepEqual(
    gpuTable.batches.map(batch => batch.sourceInfo),
    [
      {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 2},
      {sourceBatchIndex: 1, sourceRowIndexOffset: 2, sourceRowCount: 2}
    ],
    'retains source row offsets without retaining the CPU Arrow table'
  );
  t.deepEqual(
    gpuTable.batches[1].bufferLayout,
    gpuTable.bufferLayout,
    'retains table buffer layout metadata on GPU batches'
  );
  t.notEqual(
    gpuTable.batches[1].gpuData.positions.buffer,
    gpuTable.batches[0].gpuData.positions.buffer,
    'record batches keep separate GPU buffers'
  );
  t.equal(
    gpuTable.gpuVectors.positions.data[0].buffer,
    gpuTable.batches[0].gpuData.positions.buffer,
    'aggregate vectors expose the first batch chunk'
  );
  t.equal(
    gpuTable.gpuVectors.positions.data[1].buffer,
    gpuTable.batches[1].gpuData.positions.buffer,
    'aggregate vectors expose the second batch chunk'
  );
  t.equal(gpuTable.gpuVectors.positions.data.length, 2, 'aggregate vector has no direct buffer');

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
  const gpuTable = makeGPUTableFromArrowTable(device, table, {shaderLayout});
  const firstPositionsBuffer = gpuTable.batches[0].gpuData.positions.buffer;
  const secondPositionsBuffer = gpuTable.batches[1].gpuData.positions.buffer;

  gpuTable.packBatches();

  t.equal(gpuTable.batches.length, 1, 'replaces all preserved batches with one packed batch');
  t.equal(gpuTable.batches[0].numRows, 4, 'preserves the packed row count');
  t.equal(gpuTable.gpuVectors.positions.data.length, 1, 'exposes one packed aggregate chunk');
  t.ok(
    arrow.DataType.isFixedSizeList(gpuTable.gpuVectors.positions.dataType as arrow.DataType),
    'packed vectors preserve adapter data type metadata'
  );
  t.equal(
    gpuTable.batches[0].gpuData.positions.buffer,
    gpuTable.batches[0].gpuData.positions.buffer,
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
  const gpuTable = makeGPUTableFromArrowTable(device, table, {shaderLayout});

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
  const gpuTable = makeGPUTableFromArrowTable(device, new arrow.Table([firstBatch]), {
    shaderLayout
  });
  const gpuRecordBatch = makeGPURecordBatchFromArrowRecordBatch(device, secondBatch, {
    shaderLayout,
    sourceInfo: {sourceBatchIndex: 1, sourceRowIndexOffset: 2, sourceRowCount: 2}
  });
  const appendedPositionsBuffer = gpuRecordBatch.gpuData.positions.buffer;

  gpuTable.addBatch(gpuRecordBatch);

  t.equal(gpuTable.batches.length, 2, 'appends the supplied GPU batch');
  t.equal(gpuTable.numRows, 4, 'updates the aggregate row count');
  t.equal(gpuTable.gpuVectors.positions.data.length, 2, 'extends aggregate vector chunks');
  t.equal(
    gpuTable.gpuVectors.positions.data[1].buffer,
    appendedPositionsBuffer,
    'keeps the appended batch buffer identity visible through data[]'
  );
  t.deepEqual(
    gpuTable.batches[1].sourceInfo,
    {sourceBatchIndex: 1, sourceRowIndexOffset: 2, sourceRowCount: 2},
    'preserves explicit source-row metadata on appended Arrow batches'
  );

  gpuTable.destroy();
  t.ok(
    appendedPositionsBuffer.destroyed,
    'table destruction follows the appended batch destroy path'
  );
  t.end();
});

test('GPUTable static batches bind UTF-8 storage through batch GPUData buffers', t => {
  const device = new NullDevice({});
  const positions = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([0, 0, 1, 1])
  );
  const texts = arrow.vectorFromArray(['alpha', 'beta'], new arrow.Utf8());
  const sourceTable = new arrow.Table([
    new arrow.Table({positions, texts}).batches[0],
    new arrow.Table({positions, texts}).batches[0]
  ]);
  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'positions', location: 0, type: 'vec2<f32>'}],
    bindings: [{name: 'texts', type: 'read-only-storage', group: 0, location: 0}]
  };
  const gpuTable = makeGPUTableFromArrowTable(device, sourceTable, {shaderLayout});

  t.equal(
    gpuTable.batches[0].gpuData.texts.buffer,
    gpuTable.batches[0].gpuData.texts.buffer,
    'batch-local UTF-8 storage binding resolves through GPUData'
  );
  t.equal(gpuTable.gpuVectors.texts.data.length, 2, 'keeps UTF-8 aggregate chunk boundaries');
  t.ok(
    arrow.DataType.isUtf8(gpuTable.gpuVectors.texts.dataType as arrow.DataType),
    'aggregate UTF-8 vectors preserve adapter data type metadata'
  );

  gpuTable.destroy();
  t.end();
});

test('GPUTable select keeps requested columns and destroys dropped batch data', t => {
  const device = new NullDevice({});
  const table = makeGpuMetadataTable();
  const shaderLayout: ShaderLayout = {
    attributes: [
      {name: 'positions', location: 0, type: 'vec2<f32>'},
      {name: 'colors', location: 1, type: 'vec4<f32>'}
    ],
    bindings: []
  };
  const gpuTable = makeGPUTableFromArrowTable(device, table, {shaderLayout});
  const droppedColorsBuffer = gpuTable.batches[0].gpuData.colors.buffer;

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

test('GPUTable select prunes dropped storage data', t => {
  const device = new NullDevice({});
  const positions = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([0, 0, 1, 1])
  );
  const texts = arrow.vectorFromArray(['alpha', 'beta'], new arrow.Utf8());
  const table = new arrow.Table({positions, texts});
  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'positions', location: 0, type: 'vec2<f32>'}],
    bindings: [{name: 'texts', type: 'read-only-storage', group: 0, location: 0}]
  };
  const gpuTable = makeGPUTableFromArrowTable(device, table, {shaderLayout});
  const droppedTextsBuffer = gpuTable.batches[0].gpuData.texts.buffer;

  t.ok(gpuTable.batches[0].gpuData.texts, 'starts with batch-local storage data');

  gpuTable.select('positions');

  t.notOk(gpuTable.gpuVectors.texts, 'removes the dropped aggregate storage vector');
  t.notOk(gpuTable.batches[0].gpuData.texts, 'removes dropped batch storage data');
  t.ok(droppedTextsBuffer.destroyed, 'destroys the dropped storage vector buffer');

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
  const gpuTable = makeGPUTableFromArrowTable(device, table, {shaderLayout});
  const colorsBuffers = gpuTable.batches.map(batch => batch.gpuData.colors.buffer);

  const detachedColors = gpuTable.detachVector('colors');

  t.deepEqual(
    gpuTable.schema.fields.map(field => field.name),
    ['positions'],
    'removes the detached table column'
  );
  t.equal(detachedColors.data.length, 2, 'returns all detached batch data chunks');
  t.ok(
    arrow.DataType.isFixedSizeList(detachedColors.dataType as arrow.DataType),
    'detached vectors preserve adapter data type metadata'
  );
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
  const gpuTable = makeGPUTableFromArrowTable(device, table, {shaderLayout});
  const detachedBatchBuffer = gpuTable.batches[1].gpuData.positions.buffer;

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

test('GPURecordBatch creates GPUData from one Arrow record batch', t => {
  const device = new NullDevice({});
  const recordBatch = makeGpuMetadataTable().batches[0];
  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'positions', location: 0, type: 'vec2<f32>'}],
    bindings: []
  };

  const gpuRecordBatch = makeGPURecordBatchFromArrowRecordBatch(device, recordBatch, {
    shaderLayout
  });

  t.equal(gpuRecordBatch.numRows, 2, 'exposes source batch row count');
  t.deepEqual(
    gpuRecordBatch.schema.fields.map(field => field.name),
    ['positions'],
    'selects shader-compatible fields'
  );
  t.ok(gpuRecordBatch.gpuData.positions, 'retains batch-local attribute data');

  gpuRecordBatch.destroy();
  t.end();
});

test('GPUTable creates metadata from existing GPU vectors', t => {
  const device = new NullDevice({});
  const positions = new GPUVector({
    type: 'buffer',
    name: 'positions',
    buffer: device.createBuffer({byteLength: 16}),
    dataType: new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float32())),
    format: 'float32x2',
    length: 2,
    stride: 2,
    byteStride: 8,
    ownsBuffer: true
  });
  const weights = new GPUVector({
    type: 'buffer',
    name: 'weights',
    buffer: device.createBuffer({byteLength: 8}),
    dataType: new arrow.Float32(),
    format: 'float32',
    length: 2,
    byteStride: 4,
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
  t.equal(gpuTable.batches[0].gpuData.positions.buffer, positions.data[0].buffer);
  t.equal(gpuTable.batches[0].gpuData.weights.buffer, weights.data[0].buffer);

  gpuTable.destroy();
  t.end();
});

test('GPUTable creates metadata from interleaved GPU vectors', t => {
  const device = new NullDevice({});
  const instances = new GPUVector({
    type: 'interleaved',
    name: 'instances',
    buffer: device.createBuffer({byteLength: 32}),
    dataType: new arrow.Binary(),
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
  t.notOk(gpuTable.schema.fields[0].format, 'does not synthesize one format for interleaved rows');
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
  t.deepEqual(Object.keys(gpuTable.batches[0].gpuData), ['instances'], 'keeps shared layout data');
  t.equal(gpuTable.batches[0].gpuData.instances.buffer, instances.data[0].buffer);

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
