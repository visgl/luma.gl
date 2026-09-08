// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  makeArrowFixedSizeListVector,
  makeGPURecordBatchFromArrowRecordBatch,
  makeGPUTableFromArrowTable
} from '@luma.gl/arrow';
import type {ShaderLayout} from '@luma.gl/core';
import {GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

it('GPUTable creates GPU vectors from shader-compatible Arrow table columns', () => {
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

  expect(Boolean('table' in gpuTable), 'does not retain the source Arrow table').toBe(false);
  expect(gpuTable.numRows, 'exposes source table row count').toBe(table.numRows);
  expect(gpuTable.numCols, 'exposes GPU schema column count').toBe(gpuTable.schema.fields.length);
  expect(gpuTable.nullCount, 'exposes source table null count').toBe(table.nullCount);
  expect(gpuTable.schema.metadata.get('table'), 'exposes GPU schema metadata').toBe('source');
  expect(gpuTable.schema.fields.length, 'exposes selected GPU fields').toBe(2);
  expect(
    gpuTable.schema.fields.map(field => field.name),
    'GPU schema fields use shader attribute names'
  ).toEqual(['positions', 'colors']);
  expect(gpuTable.bufferLayout, 'derives buffer layouts for matching shader attributes').toEqual([
    {name: 'positions', format: 'float32x2'},
    {name: 'colors', format: 'unorm8x4'}
  ]);
  expect(
    Boolean(gpuTable.gpuVectors.positions instanceof GPUVector),
    'creates a positions GPU vector'
  ).toBe(true);
  expect(
    Boolean(gpuTable.gpuVectors.colors instanceof GPUVector),
    'creates a colors GPU vector'
  ).toBe(true);
  expect(gpuTable.gpuVectors.positions.dataType, 'vector exposes type').toBe(
    table.getChild('positions')?.type
  );
  expect(gpuTable.gpuVectors.positions.length, 'vector exposes length').toBe(2);
  expect(gpuTable.gpuVectors.positions.stride, 'vector exposes stride').toBe(2);
  expect(gpuTable.gpuVectors.colors.stride, 'vector exposes color stride').toBe(4);
  expect(
    gpuTable.schema.fields[0].metadata.get('semantic'),
    'preserves same-name field metadata'
  ).toBe('position');
  expect(
    gpuTable.batches[0].gpuData.positions.buffer,
    'exposes positions as a Model attribute buffer'
  ).toBe(gpuTable.batches[0].gpuData.positions.buffer);
  expect(
    gpuTable.batches[0].gpuData.colors.buffer,
    'exposes colors as a Model attribute buffer'
  ).toBe(gpuTable.batches[0].gpuData.colors.buffer);
  expect(Boolean('attributes' in gpuTable), 'does not cache derived attribute buffers').toBe(false);

  gpuTable.destroy();
  void 0;
});

it('GPUTable maps shader attributes through Arrow paths', () => {
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

  expect(gpuTable.bufferLayout, 'derives buffer layouts from explicit Arrow paths').toEqual([
    {name: 'instanceColors', format: 'unorm8x4'}
  ]);
  expect(
    Boolean(gpuTable.batches[0].gpuData.instanceColors),
    'retains renamed shader attribute data'
  ).toBe(true);
  expect(
    gpuTable.schema.fields.map(field => field.name),
    'renamed GPU schema field uses shader attribute name'
  ).toEqual(['instanceColors']);
  expect(
    gpuTable.schema.fields[0].metadata.get('semantic'),
    'renamed GPU schema field preserves source field metadata'
  ).toBe('color');
  expect(
    gpuTable.schema.fields[0].format,
    'renamed GPU schema field preserves GPU memory format'
  ).toBe('unorm8x4');

  gpuTable.destroy();
  void 0;
});

it('GPUTable exposes storage-selected Arrow columns as GPUData', () => {
  const device = new NullDevice({});
  const table = makeGpuMetadataTable();
  const shaderLayout: ShaderLayout = {
    attributes: [],
    bindings: [{name: 'positions', type: 'read-only-storage', group: 0, location: 0}]
  };

  const gpuTable = makeGPUTableFromArrowTable(device, table, {shaderLayout});

  expect(
    gpuTable.schema.fields.map(field => field.name),
    'storage-backed table columns participate in the selected GPU schema'
  ).toEqual(['positions']);
  expect(gpuTable.numCols, 'storage-backed selected columns count toward table columns').toBe(1);
  expect(
    gpuTable.batches[0].gpuData.positions.buffer,
    'exposes the batch-local GPUData buffer as a model-ready storage binding'
  ).toBe(gpuTable.batches[0].gpuData.positions.buffer);
  expect(Boolean('bindings' in gpuTable), 'does not cache storage bindings').toBe(false);

  gpuTable.destroy();
  void 0;
});

it('GPUTable preserves nested Arrow field metadata', () => {
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

  expect(
    gpuTable.schema.fields[0].name,
    'nested path GPU schema field uses shader attribute name'
  ).toBe('instanceColors');
  expect(
    gpuTable.schema.fields[0].metadata.get('semantic'),
    'nested path GPU schema field preserves leaf field metadata'
  ).toBe('nested-color');
  gpuTable.destroy();
  void 0;
});

it('GPUTable preserves record batch boundaries with real batch-owned GPU buffers', () => {
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

  expect(gpuTable.numRows, 'keeps the full table row count').toBe(4);
  expect(gpuTable.batches.length, 'exposes one GPU record batch per Arrow batch').toBe(2);
  expect(
    Boolean(gpuTable.batches[0] instanceof GPURecordBatch),
    'creates GPURecordBatch views'
  ).toBe(true);
  expect(gpuTable.gpuVectors.positions.data.length, 'keeps vector data chunk boundaries').toBe(2);
  expect(
    Boolean(
      arrow.DataType.isFixedSizeList(gpuTable.gpuVectors.positions.dataType as arrow.DataType)
    ),
    'aggregate vectors preserve adapter data type metadata'
  ).toBe(true);
  expect(gpuTable.batches[1].numRows, 'tracks rows per record batch').toBe(2);
  expect(
    gpuTable.batches.map(batch => batch.sourceInfo),
    'retains source row offsets without retaining the CPU Arrow table'
  ).toEqual([
    {sourceBatchIndex: 0, sourceRowIndexOffset: 0, sourceRowCount: 2},
    {sourceBatchIndex: 1, sourceRowIndexOffset: 2, sourceRowCount: 2}
  ]);
  expect(
    gpuTable.batches[1].bufferLayout,
    'retains table buffer layout metadata on GPU batches'
  ).toEqual(gpuTable.bufferLayout);
  expect(
    gpuTable.batches[1].gpuData.positions.buffer,
    'record batches keep separate GPU buffers'
  ).not.toBe(gpuTable.batches[0].gpuData.positions.buffer);
  expect(
    gpuTable.gpuVectors.positions.data[0].buffer,
    'aggregate vectors expose the first batch chunk'
  ).toBe(gpuTable.batches[0].gpuData.positions.buffer);
  expect(
    gpuTable.gpuVectors.positions.data[1].buffer,
    'aggregate vectors expose the second batch chunk'
  ).toBe(gpuTable.batches[1].gpuData.positions.buffer);
  expect(gpuTable.gpuVectors.positions.data.length, 'aggregate vector has no direct buffer').toBe(
    2
  );

  gpuTable.destroy();
  void 0;
});

it('GPUTable packBatches collapses owned batches in place', () => {
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

  expect(gpuTable.batches.length, 'replaces all preserved batches with one packed batch').toBe(1);
  expect(gpuTable.batches[0].numRows, 'preserves the packed row count').toBe(4);
  expect(gpuTable.gpuVectors.positions.data.length, 'exposes one packed aggregate chunk').toBe(1);
  expect(
    Boolean(
      arrow.DataType.isFixedSizeList(gpuTable.gpuVectors.positions.dataType as arrow.DataType)
    ),
    'packed vectors preserve adapter data type metadata'
  ).toBe(true);
  expect(
    gpuTable.batches[0].gpuData.positions.buffer,
    'updates direct table attributes to the packed batch buffer'
  ).toBe(gpuTable.batches[0].gpuData.positions.buffer);
  expect(
    Boolean(firstPositionsBuffer.destroyed),
    'destroys the first superseded owned batch buffer'
  ).toBe(true);
  expect(
    Boolean(secondPositionsBuffer.destroyed),
    'destroys the second superseded owned batch buffer'
  ).toBe(true);

  gpuTable.destroy();
  void 0;
});

it('GPUTable packBatches greedily merges adjacent batches to the requested size', () => {
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

  expect(
    gpuTable.batches.map(batch => batch.numRows),
    'merges adjacent batches until each emitted batch reaches the threshold'
  ).toEqual([4, 2]);
  expect(gpuTable.gpuVectors.positions.data.length, 'retains one chunk per packed batch').toBe(2);

  gpuTable.destroy();
  void 0;
});

it('GPUTable addBatch appends an already-owned GPU record batch in place', () => {
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

  expect(gpuTable.batches.length, 'appends the supplied GPU batch').toBe(2);
  expect(gpuTable.numRows, 'updates the aggregate row count').toBe(4);
  expect(gpuTable.gpuVectors.positions.data.length, 'extends aggregate vector chunks').toBe(2);
  expect(
    gpuTable.gpuVectors.positions.data[1].buffer,
    'keeps the appended batch buffer identity visible through data[]'
  ).toBe(appendedPositionsBuffer);
  expect(
    gpuTable.batches[1].sourceInfo,
    'preserves explicit source-row metadata on appended Arrow batches'
  ).toEqual({sourceBatchIndex: 1, sourceRowIndexOffset: 2, sourceRowCount: 2});

  gpuTable.destroy();
  expect(
    Boolean(appendedPositionsBuffer.destroyed),
    'table destruction follows the appended batch destroy path'
  ).toBe(true);
  void 0;
});

it('GPUTable static batches bind UTF-8 storage through batch GPUData buffers', () => {
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

  expect(
    gpuTable.batches[0].gpuData.texts.buffer,
    'batch-local UTF-8 storage binding resolves through GPUData'
  ).toBe(gpuTable.gpuVectors.texts.data[0].buffer);
  expect(gpuTable.gpuVectors.texts.data.length, 'keeps UTF-8 aggregate chunk boundaries').toBe(2);
  expect(
    Boolean(arrow.DataType.isUtf8(gpuTable.gpuVectors.texts.dataType as arrow.DataType)),
    'aggregate UTF-8 vectors preserve adapter data type metadata'
  ).toBe(true);
  expect(
    () => gpuTable.packBatches(),
    'generic packing rejects variable-length storage payloads instead of truncating them'
  ).toThrow(/does not support variable-length GPUData "texts"/);

  gpuTable.destroy();
  void 0;
});

it('GPUTable select keeps requested columns and destroys dropped batch data', () => {
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

  expect(
    gpuTable.schema.fields.map(field => field.name),
    'retains only the requested table schema field'
  ).toEqual(['positions']);
  expect(
    gpuTable.batches[0].schema.fields.map(field => field.name),
    'restitches batch schemas to the selected column set'
  ).toEqual(['positions']);
  expect(Boolean(gpuTable.gpuVectors.positions), 'keeps selected aggregate vectors').toBe(true);
  expect(Boolean(gpuTable.gpuVectors.colors), 'removes dropped aggregate vectors').toBe(false);
  expect(Boolean(droppedColorsBuffer.destroyed), 'destroys dropped batch-local GPU vectors').toBe(
    true
  );

  gpuTable.destroy();
  void 0;
});

it('GPUTable select prunes dropped storage data', () => {
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

  expect(Boolean(gpuTable.batches[0].gpuData.texts), 'starts with batch-local storage data').toBe(
    true
  );

  gpuTable.select('positions');

  expect(Boolean(gpuTable.gpuVectors.texts), 'removes the dropped aggregate storage vector').toBe(
    false
  );
  expect(Boolean(gpuTable.batches[0].gpuData.texts), 'removes dropped batch storage data').toBe(
    false
  );
  expect(Boolean(droppedTextsBuffer.destroyed), 'destroys the dropped storage vector buffer').toBe(
    true
  );

  gpuTable.destroy();
  void 0;
});

it('GPUTable detachVector removes one live column and transfers its ownership', () => {
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

  expect(
    gpuTable.schema.fields.map(field => field.name),
    'removes the detached table column'
  ).toEqual(['positions']);
  expect(detachedColors.data.length, 'returns all detached batch data chunks').toBe(2);
  expect(
    Boolean(arrow.DataType.isFixedSizeList(detachedColors.dataType as arrow.DataType)),
    'detached vectors preserve adapter data type metadata'
  ).toBe(true);
  expect(
    Boolean(detachedColors.ownsBuffer),
    'detached vector retains the removed GPU ownership'
  ).toBe(true);

  gpuTable.destroy();
  expect(
    Boolean(colorsBuffers[0].destroyed),
    'table no longer destroys the first detached column buffer'
  ).toBe(false);
  expect(
    Boolean(colorsBuffers[1].destroyed),
    'table no longer destroys the second detached column buffer'
  ).toBe(false);
  detachedColors.destroy();
  expect(
    Boolean(colorsBuffers[0].destroyed),
    'detached vector destroys the first removed column buffer'
  ).toBe(true);
  expect(
    Boolean(colorsBuffers[1].destroyed),
    'detached vector destroys the second removed column buffer'
  ).toBe(true);
  void 0;
});

it('GPUTable detachBatches removes a live batch range and restitches aggregates', () => {
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

  expect(detachedBatches.length, 'returns the detached half-open batch range').toBe(1);
  expect(gpuTable.batches.length, 'removes detached batches from the table').toBe(2);
  expect(gpuTable.numRows, 'updates table row count after detaching').toBe(4);
  expect(gpuTable.gpuVectors.positions.data.length, 'restitches aggregate data chunks').toBe(2);

  gpuTable.destroy();
  expect(
    Boolean(detachedBatchBuffer.destroyed),
    'table no longer destroys detached batch buffers'
  ).toBe(false);
  detachedBatches[0].destroy();
  expect(
    Boolean(detachedBatchBuffer.destroyed),
    'detached batch retains normal destroy ownership'
  ).toBe(true);
  void 0;
});

it('GPURecordBatch creates GPUData from one Arrow record batch', () => {
  const device = new NullDevice({});
  const recordBatch = makeGpuMetadataTable().batches[0];
  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'positions', location: 0, type: 'vec2<f32>'}],
    bindings: []
  };

  const gpuRecordBatch = makeGPURecordBatchFromArrowRecordBatch(device, recordBatch, {
    shaderLayout
  });

  expect(gpuRecordBatch.numRows, 'exposes source batch row count').toBe(2);
  expect(
    gpuRecordBatch.schema.fields.map(field => field.name),
    'selects shader-compatible fields'
  ).toEqual(['positions']);
  expect(Boolean(gpuRecordBatch.gpuData.positions), 'retains batch-local attribute data').toBe(
    true
  );

  gpuRecordBatch.destroy();
  void 0;
});

it('GPUTable creates metadata from existing GPU vectors', () => {
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

  expect(gpuTable.numRows, 'deduces row count').toBe(2);
  expect(gpuTable.numCols, 'deduces column count').toBe(2);
  expect(
    gpuTable.schema.fields.map(field => field.name),
    'deduces schema fields from vector names'
  ).toEqual(['positions', 'weights']);
  expect(gpuTable.bufferLayout, 'synthesizes buffer layouts for regular vectors').toEqual([
    {name: 'positions', byteStride: 8, format: 'float32x2'},
    {name: 'weights', byteStride: 4, format: 'float32'}
  ]);
  expect(gpuTable.batches[0].gpuData.positions.buffer, '').toBe(positions.data[0].buffer);
  expect(gpuTable.batches[0].gpuData.weights.buffer, '').toBe(weights.data[0].buffer);

  gpuTable.destroy();
  void 0;
});

it('GPUTable creates metadata from interleaved GPU vectors', () => {
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

  expect(gpuTable.schema.fields[0].name, 'uses vector name in schema').toBe('instances');
  expect(
    Boolean(gpuTable.schema.fields[0].format),
    'does not synthesize one format for interleaved rows'
  ).toBe(false);
  expect(gpuTable.bufferLayout, 'uses interleaved buffer layout from vector').toEqual([
    {
      name: 'instances',
      byteStride: 16,
      attributes: [
        {attribute: 'positions', format: 'float32x3', byteOffset: 0},
        {attribute: 'colors', format: 'uint8x4', byteOffset: 12}
      ]
    }
  ]);
  expect(Object.keys(gpuTable.batches[0].gpuData), 'keeps shared layout data').toEqual([
    'instances'
  ]);
  expect(gpuTable.batches[0].gpuData.instances.buffer, '').toBe(instances.data[0].buffer);

  gpuTable.destroy();
  void 0;
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
