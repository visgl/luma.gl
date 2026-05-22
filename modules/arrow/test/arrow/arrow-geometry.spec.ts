// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  ArrowGeometry,
  ArrowTableGeometry,
  makeArrowFixedSizeListVector,
  makeGPUGeometryFromArrow,
  type ArrowMeshTable
} from '@luma.gl/arrow';
import {NullDevice} from '@luma.gl/test-utils';
import {
  BufferType,
  Data,
  Field,
  FixedSizeList,
  Float32,
  Int32,
  List,
  Schema,
  Table,
  Uint8,
  Utf8,
  Vector,
  makeVector,
  vectorFromArray
} from 'apache-arrow';

test('ArrowTableGeometry creates interleaved GPU geometry from a Mesh Arrow table', t => {
  const device = new NullDevice({});
  const arrowMesh = makeArrowMeshTable();
  const geometry = new ArrowTableGeometry(device, {arrowMesh});

  t.equal(geometry.topology, 'triangle-list', 'uses mesh topology');
  t.equal(geometry.vertexCount, 3, 'uses Arrow row count for non-indexed geometry');
  t.deepEqual(Object.keys(geometry.attributes), ['geometry'], 'creates one interleaved buffer');
  t.deepEqual(
    geometry.bufferLayout,
    [
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
    ],
    'maps Mesh Arrow attributes into one interleaved buffer layout'
  );
  t.equal(geometry.attributes.geometry.byteLength, 108, 'uploads packed interleaved bytes');

  geometry.destroy();
  t.end();
});

test('ArrowTableGeometry creates separate GPU buffers when interleaving is disabled', t => {
  const device = new NullDevice({});
  const geometry = new ArrowTableGeometry(device, {
    arrowMesh: makeArrowMeshTable(),
    interleaved: false
  });

  t.deepEqual(
    Object.keys(geometry.attributes),
    ['positions', 'normals', 'colors', 'texCoords'],
    'creates one GPU buffer per Mesh Arrow attribute'
  );
  t.deepEqual(
    geometry.bufferLayout,
    [
      {name: 'positions', stepMode: 'vertex', format: 'float32x3'},
      {name: 'normals', stepMode: 'vertex', format: 'float32x3'},
      {name: 'colors', stepMode: 'vertex', format: 'unorm8x4'},
      {name: 'texCoords', stepMode: 'vertex', format: 'float32x2'}
    ],
    'creates one buffer layout per Mesh Arrow attribute'
  );

  geometry.destroy();
  t.end();
});

test('ArrowTableGeometry reads indexed Mesh Arrow indices from row 0', t => {
  const device = new NullDevice({});
  const arrowMesh = makeArrowMeshTable({indices: new Int32Array([0, 1, 2, 2, 1, 0])});
  const geometry = new ArrowTableGeometry(device, {arrowMesh});

  t.equal(geometry.vertexCount, 6, 'uses index count for indexed geometry');
  t.ok(geometry.indices, 'creates an index buffer');
  t.equal(geometry.indices?.byteLength, 12, 'uploads uint16 indices when possible');

  geometry.destroy();
  t.end();
});

test('ArrowTableGeometry accepts raw Arrow tables and reads topology metadata', t => {
  const device = new NullDevice({});
  const table = makeArrowMeshTable().data;
  const geometry = new ArrowTableGeometry(device, {arrowMesh: table});

  t.equal(geometry.topology, 'triangle-list', 'uses topology from Arrow schema metadata');
  t.equal(geometry.vertexCount, 3, 'uses raw Arrow table row count');

  geometry.destroy();
  t.end();
});

test('ArrowTableGeometry validates Mesh Arrow input', t => {
  const device = new NullDevice({});
  const tableWithoutPosition = new Table({
    NORMAL: makeArrowFixedSizeListVector(new Float32(), 3, new Float32Array([0, 0, 1]))
  });
  const invalidAttributeTable = new Table({
    POSITION: makeArrowFixedSizeListVector(new Float32(), 3, new Float32Array([0, 0, 0])),
    NAME: vectorFromArray(['a'], new Utf8())
  });
  const invalidIndicesSchema = new Schema([
    new Field('POSITION', new FixedSizeList(3, new Field('value', new Float32(), false)), false),
    new Field('indices', new Int32(), false)
  ]);
  const invalidIndicesTable = new Table(invalidIndicesSchema, {
    POSITION: makeArrowFixedSizeListVector(new Float32(), 3, new Float32Array([0, 0, 0])),
    indices: makeVector(new Int32Array([0]))
  });

  t.throws(
    () => new ArrowTableGeometry(device, {arrowMesh: tableWithoutPosition}),
    /POSITION/,
    'requires POSITION'
  );
  t.throws(
    () => new ArrowTableGeometry(device, {arrowMesh: invalidAttributeTable}),
    /numeric/,
    'rejects non-numeric attribute columns'
  );
  t.throws(
    () => new ArrowTableGeometry(device, {arrowMesh: invalidIndicesTable}),
    /indices column must be a List/,
    'rejects malformed indices columns'
  );

  t.end();
});

test('Arrow geometry factory and legacy alias keep the Mesh Arrow surface available', t => {
  const device = new NullDevice({});
  const arrowMesh = makeArrowMeshTable();
  const geometry = makeGPUGeometryFromArrow(device, {arrowMesh});
  const legacyGeometry = new ArrowGeometry(device, {arrowMesh});

  t.ok(geometry instanceof ArrowTableGeometry, 'factory returns ArrowTableGeometry');
  t.ok(legacyGeometry instanceof ArrowTableGeometry, 'legacy ArrowGeometry aliases the new class');

  geometry.destroy();
  legacyGeometry.destroy();
  t.end();
});

function makeArrowMeshTable(options: {indices?: Int32Array} = {}): ArrowMeshTable {
  const positions = makeArrowFixedSizeListVector(
    new Float32(),
    3,
    new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])
  );
  const normals = makeArrowFixedSizeListVector(
    new Float32(),
    3,
    new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])
  );
  const colors = makeArrowFixedSizeListVector(
    new Uint8(),
    4,
    new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255])
  );
  const texCoords = makeArrowFixedSizeListVector(
    new Float32(),
    2,
    new Float32Array([0, 0, 1, 0, 0, 1])
  );
  const fields = [
    new Field('POSITION', new FixedSizeList(3, new Field('value', new Float32(), false)), false),
    new Field('NORMAL', new FixedSizeList(3, new Field('value', new Float32(), false)), false),
    new Field(
      'COLOR_0',
      new FixedSizeList(4, new Field('value', new Uint8(), false)),
      false,
      new Map([['normalized', 'true']])
    ),
    new Field('TEXCOORD_0', new FixedSizeList(2, new Field('value', new Float32(), false)), false)
  ];
  let columns: Record<string, Vector> = {
    POSITION: positions,
    NORMAL: normals,
    COLOR_0: colors,
    TEXCOORD_0: texCoords
  };

  if (options.indices) {
    fields.splice(
      1,
      0,
      new Field('indices', new List(new Field('item', new Int32(), false)), true)
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
    data: new Table(new Schema(fields, new Map([['topology', 'triangle-list']])), columns)
  };
}

function makeIndicesVector(indices: Int32Array, vertexCount: number): Vector {
  const indicesType = new List(new Field('item', new Int32(), false));
  const valueOffsets = new Int32Array(vertexCount + 1);
  if (vertexCount > 0) {
    valueOffsets.fill(indices.length, 1);
  }

  const nullBitmap = new Uint8Array(Math.ceil(vertexCount / 8));
  if (vertexCount > 0) {
    nullBitmap[0] = 1;
  }

  const valuesData = new Data<Int32>(indicesType.children[0].type, 0, indices.length, 0, {
    [BufferType.DATA]: indices
  });
  const indicesData = new Data<List<Int32>>(
    indicesType,
    0,
    vertexCount,
    Math.max(0, vertexCount - 1),
    {
      [BufferType.OFFSET]: valueOffsets,
      [BufferType.VALIDITY]: nullBitmap
    },
    [valuesData]
  );

  return new Vector([indicesData]);
}
