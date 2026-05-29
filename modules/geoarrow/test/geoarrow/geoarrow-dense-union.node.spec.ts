// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  convertGeoArrowTableToDenseUnion,
  convertGeoArrowVectorToDenseUnion,
  tessellateArrowPolygons
} from '@math.gl/geoarrow';
import * as arrow from 'apache-arrow';

const GEOMETRY_FIXTURE_PAIRS = [
  ['example_point_wkb.arrows', 'example_point_wkt.arrows', 2],
  ['example_point-z_wkb.arrows', 'example_point-z_wkt.arrows', 3],
  ['example_point-m_wkb.arrows', 'example_point-m_wkt.arrows', 3],
  ['example_point-zm_wkb.arrows', 'example_point-zm_wkt.arrows', 4],
  ['example_linestring_wkb.arrows', 'example_linestring_wkt.arrows', 2],
  ['example_polygon_wkb.arrows', 'example_polygon_wkt.arrows', 2],
  ['example_multipoint_wkb.arrows', 'example_multipoint_wkt.arrows', 2],
  ['example_multilinestring_wkb.arrows', 'example_multilinestring_wkt.arrows', 2],
  ['example_multipolygon_wkb.arrows', 'example_multipolygon_wkt.arrows', 2],
  ['example_multipolygon-zm_wkb.arrows', 'example_multipolygon-zm_wkt.arrows', 4]
] as const;

test('convertGeoArrowTableToDenseUnion converts WKB/WKT mixed geometry fixtures', t => {
  for (const [wkbFixture, wktFixture, expectedDimension] of GEOMETRY_FIXTURE_PAIRS) {
    const wkbTable = loadGeoArrowFixture(wkbFixture);
    const wktTable = loadGeoArrowFixture(wktFixture);
    const convertedWKBTable = convertGeoArrowTableToDenseUnion(wkbTable);
    const convertedWKTTable = convertGeoArrowTableToDenseUnion(wktTable);
    const convertedWKBField = convertedWKBTable.schema.fields.find(
      field => field.name === 'geometry'
    )!;
    const convertedWKBGeometry = convertedWKBTable.getChild('geometry')!;
    const convertedWKTGeometry = convertedWKTTable.getChild('geometry')!;

    t.equal(
      convertedWKBField.metadata.get('ARROW:extension:name'),
      'geoarrow.geometry',
      `${wkbFixture} updates the field extension metadata`
    );
    t.equal(
      getDenseUnionCoordinateDimension(convertedWKBGeometry),
      expectedDimension,
      `${wkbFixture} preserves the coordinate dimension`
    );
    t.deepEqual(
      getDenseUnionRows(convertedWKBGeometry),
      getDenseUnionRows(convertedWKTGeometry),
      `${wkbFixture} and ${wktFixture} produce equivalent dense union rows`
    );
  }
  t.end();
});

test('convertGeoArrowVectorToDenseUnion converts vectors and returns dense unions unchanged', t => {
  const geometry = arrow.vectorFromArray(
    [
      'POINT (30 10)',
      'LINESTRING (30 10, 10 30, 40 40)',
      'POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))'
    ],
    new arrow.Utf8()
  );
  const convertedGeometry = convertGeoArrowVectorToDenseUnion(geometry, {encoding: 'geoarrow.wkt'});

  t.ok(
    arrow.DataType.isDenseUnion(convertedGeometry.type),
    'converts a WKT vector to a DenseUnion vector'
  );
  t.deepEqual(
    getDenseUnionRows(convertedGeometry).slice(0, 3),
    [
      {typeId: 1, value: [30, 10]},
      {
        typeId: 2,
        value: [
          [30, 10],
          [10, 30],
          [40, 40]
        ]
      },
      {
        typeId: 3,
        value: [
          [
            [30, 10],
            [40, 40],
            [20, 40],
            [10, 20],
            [30, 10]
          ]
        ]
      }
    ],
    'parses point, linestring, and polygon rows'
  );
  t.equal(
    convertGeoArrowVectorToDenseUnion(convertedGeometry),
    convertedGeometry,
    'returns an existing DenseUnion vector unchanged'
  );
  t.end();
});

test('convertGeoArrowTableToDenseUnion converts explicitly selected WKT columns', t => {
  const sourceTable = new arrow.Table({
    id: arrow.vectorFromArray([7], new arrow.Int32()),
    geometry: arrow.vectorFromArray(['POINT (1 2)'], new arrow.Utf8())
  });

  t.equal(
    convertGeoArrowTableToDenseUnion(sourceTable, {encoding: 'geoarrow.wkt'}),
    sourceTable,
    'does not infer non-metadata table columns from encoding alone'
  );

  const convertedTable = convertGeoArrowTableToDenseUnion(sourceTable, {
    geometryColumn: 'geometry',
    encoding: 'geoarrow.wkt'
  });

  t.equal(
    convertedTable.getChild('id')!.type.toString(),
    sourceTable.getChild('id')!.type.toString(),
    'preserves non-geometry columns'
  );
  t.deepEqual(
    getDenseUnionRows(convertedTable.getChild('geometry')!),
    [{typeId: 1, value: [1, 2]}],
    'converts the selected column'
  );
  t.end();
});

test('convertGeoArrowTableToDenseUnion output tessellates polygon rows', t => {
  const wkbTable = convertGeoArrowTableToDenseUnion(
    loadGeoArrowFixture('example_multipolygon_wkb.arrows')
  );
  const wktTable = convertGeoArrowTableToDenseUnion(
    loadGeoArrowFixture('example_multipolygon_wkt.arrows')
  );
  const wkbResult = tessellateArrowPolygons({polygons: wkbTable.getChild('geometry')!});
  const wktResult = tessellateArrowPolygons({polygons: wktTable.getChild('geometry')!});

  t.equal(wkbResult.rowCount, 5, 'keeps the source geometry row count');
  t.ok(wkbResult.polygonCount > 0, 'tessellates multipolygon rows');
  t.deepEqual(Array.from(wkbResult.positions), Array.from(wktResult.positions), 'positions match');
  t.deepEqual(Array.from(wkbResult.indices), Array.from(wktResult.indices), 'indices match');
  t.deepEqual(
    Array.from(wkbResult.rowIndices),
    Array.from(wktResult.rowIndices),
    'source row indices match'
  );
  t.end();
});

test('convertGeoArrowTableToDenseUnion rejects WKB/WKT GeometryCollection rows', t => {
  t.throws(
    () =>
      convertGeoArrowTableToDenseUnion(
        loadGeoArrowFixture('example_geometrycollection_wkb.arrows')
      ),
    /GeometryCollection conversion requires geoarrow\.geometrycollection output/,
    'rejects WKB GeometryCollection rows with a target-specific error'
  );
  t.throws(
    () =>
      convertGeoArrowTableToDenseUnion(
        loadGeoArrowFixture('example_geometrycollection_wkt.arrows')
      ),
    /GeometryCollection conversion requires geoarrow\.geometrycollection output/,
    'rejects WKT GeometryCollection rows with a target-specific error'
  );
  t.end();
});

function loadGeoArrowFixture(name: string): arrow.Table {
  const url = new URL(`../data/geoarrow-data/${name}`, import.meta.url);
  return arrow.tableFromIPC(readFileSync(url));
}

function getDenseUnionCoordinateDimension(vector: arrow.Vector): number {
  const type = vector.type as arrow.DenseUnion;
  const firstField = type.children[0];
  return getCoordinateDimension(firstField.type);
}

function getCoordinateDimension(type: arrow.DataType): number {
  if (arrow.DataType.isFixedSizeList(type)) {
    return type.listSize;
  }
  if (arrow.DataType.isList(type)) {
    return getCoordinateDimension(type.children[0].type);
  }
  throw new Error(`Unexpected dense union child type ${type.toString()}`);
}

function getDenseUnionRows(vector: arrow.Vector): {typeId: number; value: unknown}[] {
  const rows: {typeId: number; value: unknown}[] = [];
  for (let rowIndex = 0; rowIndex < vector.length; rowIndex++) {
    rows.push({
      typeId: getDenseUnionTypeId(vector, rowIndex),
      value: getArrowValue(vector.get(rowIndex))
    });
  }
  return rows;
}

function getDenseUnionTypeId(vector: arrow.Vector, rowIndex: number): number {
  let remainingRowIndex = rowIndex;
  for (const data of vector.data as arrow.Data<arrow.DenseUnion>[]) {
    if (remainingRowIndex < data.length) {
      return data.typeIds[data.offset + remainingRowIndex];
    }
    remainingRowIndex -= data.length;
  }
  throw new Error(`DenseUnion row ${rowIndex} is out of bounds`);
}

function getArrowValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  if (ArrayBuffer.isView(value)) {
    return Array.from(value as ArrayLike<number>);
  }
  if (Array.isArray(value)) {
    return value.map(item => getArrowValue(item));
  }
  if (isVectorLike(value)) {
    const values: unknown[] = [];
    for (let index = 0; index < value.length; index++) {
      values.push(getArrowValue(value.get(index)));
    }
    return values;
  }
  return value;
}

function isVectorLike(value: unknown): value is {length: number; get: (index: number) => unknown} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'length' in value &&
    'get' in value &&
    typeof (value as {get?: unknown}).get === 'function'
  );
}
