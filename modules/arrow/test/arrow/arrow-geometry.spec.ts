// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  ArrowTableGeometry,
  makeArrowFixedSizeListVector,
  makeGPUGeometryFromArrow,
  type ArrowMeshTable
} from '@luma.gl/arrow';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

it('ArrowTableGeometry creates interleaved GPU geometry from a Mesh Arrow table', () => {
  const device = new NullDevice({});
  const arrowMesh = makeArrowMeshTable();
  const geometry = new ArrowTableGeometry(device, {arrowMesh});

  expect(geometry.topology, 'uses mesh topology').toBe('triangle-list');
  expect(geometry.vertexCount, 'uses Arrow row count for non-indexed geometry').toBe(3);
  expect(Object.keys(geometry.attributes), 'creates one interleaved buffer').toEqual(['geometry']);
  expect(
    geometry.bufferLayout,
    'maps Mesh Arrow attributes into one interleaved buffer layout'
  ).toEqual([
    {
      name: 'geometry',
      stepMode: 'vertex',
      byteStride: 36,
      attributes: [
        {attribute: 'positions', format: 'float32x3', byteOffset: 0},
        {attribute: 'normals', format: 'float32x3', byteOffset: 12},
        {attribute: 'colors', format: 'unorm8x4', byteOffset: 24},
        {attribute: 'texCoords', format: 'float32x2', byteOffset: 28}
      ]
    }
  ]);
  expect(geometry.attributes.geometry.byteLength, 'uploads packed interleaved bytes').toBe(108);

  geometry.destroy();
  void 0;
});

it('ArrowTableGeometry creates separate GPU buffers when interleaving is disabled', () => {
  const device = new NullDevice({});
  const geometry = new ArrowTableGeometry(device, {
    arrowMesh: makeArrowMeshTable(),
    interleaved: false
  });

  expect(
    Object.keys(geometry.attributes),
    'creates one GPU buffer per Mesh Arrow attribute'
  ).toEqual(['positions', 'normals', 'colors', 'texCoords']);
  expect(geometry.bufferLayout, 'creates one buffer layout per Mesh Arrow attribute').toEqual([
    {name: 'positions', stepMode: 'vertex', format: 'float32x3'},
    {name: 'normals', stepMode: 'vertex', format: 'float32x3'},
    {name: 'colors', stepMode: 'vertex', format: 'unorm8x4'},
    {name: 'texCoords', stepMode: 'vertex', format: 'float32x2'}
  ]);

  geometry.destroy();
  void 0;
});

it('ArrowTableGeometry reads indexed Mesh Arrow indices from row 0', () => {
  const device = new NullDevice({});
  const arrowMesh = makeArrowMeshTable({indices: new Int32Array([0, 1, 2, 2, 1, 0])});
  const geometry = new ArrowTableGeometry(device, {arrowMesh});

  expect(geometry.vertexCount, 'uses index count for indexed geometry').toBe(6);
  expect(Boolean(geometry.indices), 'creates an index buffer').toBe(true);
  expect(geometry.indices?.byteLength, 'uploads uint16 indices when possible').toBe(12);

  geometry.destroy();
  void 0;
});

it('ArrowTableGeometry accepts raw Arrow tables and reads topology metadata', () => {
  const device = new NullDevice({});
  const table = makeArrowMeshTable().data;
  const geometry = new ArrowTableGeometry(device, {arrowMesh: table});

  expect(geometry.topology, 'uses topology from Arrow schema metadata').toBe('triangle-list');
  expect(geometry.vertexCount, 'uses raw Arrow table row count').toBe(3);

  geometry.destroy();
  void 0;
});

it('ArrowTableGeometry validates Mesh Arrow input', () => {
  const device = new NullDevice({});
  const tableWithoutPosition = new arrow.Table({
    NORMAL: makeArrowFixedSizeListVector(new arrow.Float32(), 3, new Float32Array([0, 0, 1]))
  });
  const invalidAttributeTable = new arrow.Table({
    POSITION: makeArrowFixedSizeListVector(new arrow.Float32(), 3, new Float32Array([0, 0, 0])),
    NAME: arrow.vectorFromArray(['a'], new arrow.Utf8())
  });
  const invalidIndicesSchema = new arrow.Schema([
    new arrow.Field(
      'POSITION',
      new arrow.FixedSizeList(3, new arrow.Field('value', new arrow.Float32(), false)),
      false
    ),
    new arrow.Field('indices', new arrow.Int32(), false)
  ]);
  const invalidIndicesTable = new arrow.Table(invalidIndicesSchema, {
    POSITION: makeArrowFixedSizeListVector(new arrow.Float32(), 3, new Float32Array([0, 0, 0])),
    indices: arrow.makeVector(new Int32Array([0]))
  });

  expect(
    () => new ArrowTableGeometry(device, {arrowMesh: tableWithoutPosition}),
    'requires POSITION'
  ).toThrow(/POSITION/);
  expect(
    () => new ArrowTableGeometry(device, {arrowMesh: invalidAttributeTable}),
    'rejects non-numeric attribute columns'
  ).toThrow(/numeric/);
  expect(
    () => new ArrowTableGeometry(device, {arrowMesh: invalidIndicesTable}),
    'rejects malformed indices columns'
  ).toThrow(/indices column must be a List/);

  void 0;
});

it('Arrow geometry factory keeps the Mesh Arrow surface available', () => {
  const device = new NullDevice({});
  const arrowMesh = makeArrowMeshTable();
  const geometry = makeGPUGeometryFromArrow(device, {arrowMesh});

  expect(
    Boolean(geometry instanceof ArrowTableGeometry),
    'factory returns ArrowTableGeometry'
  ).toBe(true);

  geometry.destroy();
  void 0;
});

function makeArrowMeshTable(options: {indices?: Int32Array} = {}): ArrowMeshTable {
  const positions = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    3,
    new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])
  );
  const normals = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    3,
    new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])
  );
  const colors = makeArrowFixedSizeListVector(
    new arrow.Uint8(),
    4,
    new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255])
  );
  const texCoords = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([0, 0, 1, 0, 0, 1])
  );
  const fields = [
    new arrow.Field(
      'POSITION',
      new arrow.FixedSizeList(3, new arrow.Field('value', new arrow.Float32(), false)),
      false
    ),
    new arrow.Field(
      'NORMAL',
      new arrow.FixedSizeList(3, new arrow.Field('value', new arrow.Float32(), false)),
      false
    ),
    new arrow.Field(
      'COLOR_0',
      new arrow.FixedSizeList(4, new arrow.Field('value', new arrow.Uint8(), false)),
      false,
      new Map([['normalized', 'true']])
    ),
    new arrow.Field(
      'TEXCOORD_0',
      new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float32(), false)),
      false
    )
  ];
  let columns: Record<string, arrow.Vector> = {
    POSITION: positions,
    NORMAL: normals,
    COLOR_0: colors,
    TEXCOORD_0: texCoords
  };

  if (options.indices) {
    fields.splice(
      1,
      0,
      new arrow.Field(
        'indices',
        new arrow.List(new arrow.Field('item', new arrow.Int32(), false)),
        true
      )
    );
    columns = {
      POSITION: positions,
      indices: makeIndicesVector(options.indices, positions.length),
      NORMAL: normals,
      COLOR_0: colors,
      TEXCOORD_0: texCoords
    };
  }

  return {
    shape: 'arrow-table',
    topology: 'triangle-list',
    data: new arrow.Table(
      new arrow.Schema(fields, new Map([['topology', 'triangle-list']])),
      columns
    )
  };
}

function makeIndicesVector(indices: Int32Array, vertexCount: number): arrow.Vector {
  const indicesType = new arrow.List(new arrow.Field('item', new arrow.Int32(), false));
  const valueOffsets = new Int32Array(vertexCount + 1);
  if (vertexCount > 0) {
    valueOffsets.fill(indices.length, 1);
  }

  const nullBitmap = new Uint8Array(Math.ceil(vertexCount / 8));
  if (vertexCount > 0) {
    nullBitmap[0] = 1;
  }

  const valuesData = new arrow.Data<arrow.Int32>(
    indicesType.children[0].type,
    0,
    indices.length,
    0,
    {
      [arrow.BufferType.DATA]: indices
    }
  );
  const indicesData = new arrow.Data<arrow.List<arrow.Int32>>(
    indicesType,
    0,
    vertexCount,
    Math.max(0, vertexCount - 1),
    {
      [arrow.BufferType.OFFSET]: valueOffsets,
      [arrow.BufferType.VALIDITY]: nullBitmap
    },
    [valuesData]
  );

  return new arrow.Vector([indicesData]);
}
