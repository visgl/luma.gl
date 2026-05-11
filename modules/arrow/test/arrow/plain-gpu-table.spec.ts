// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {ArrowGPUVector, ArrowGPUTable} from '@luma.gl/arrow';
import type {ShaderLayout} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

test('ArrowGPUTable creates GPU vectors from shader-compatible Arrow table columns', t => {
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

  const gpuTable = new ArrowGPUTable(device, table, {shaderLayout});

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
  t.ok(gpuTable.gpuVectors.positions instanceof ArrowGPUVector, 'creates a positions GPU vector');
  t.ok(gpuTable.gpuVectors.colors instanceof ArrowGPUVector, 'creates a colors GPU vector');
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
    gpuTable.gpuVectors.positions.buffer,
    'exposes positions as a Model attribute buffer'
  );
  t.equal(
    gpuTable.attributes.colors,
    gpuTable.gpuVectors.colors.buffer,
    'exposes colors as a Model attribute buffer'
  );
  t.notOk(gpuTable.attributes.missing, 'skips missing table columns');

  gpuTable.destroy();
  t.end();
});

test('ArrowGPUTable maps shader attributes through Arrow paths', t => {
  const device = new NullDevice({});
  const table = makeGpuMetadataTable();
  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'instanceColors', location: 0, type: 'vec4<f32>'}],
    bindings: []
  };

  const gpuTable = new ArrowGPUTable(device, table, {
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

test('ArrowGPUTable preserves nested Arrow field metadata', t => {
  const device = new NullDevice({});
  const table = makeNestedGpuMetadataTable();
  const shaderLayout: ShaderLayout = {
    attributes: [{name: 'instanceColors', location: 0, type: 'vec4<f32>'}],
    bindings: []
  };

  const gpuTable = new ArrowGPUTable(device, table, {
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
