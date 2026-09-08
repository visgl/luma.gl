// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {expect, it} from 'vitest';
import {
  convertGeoArrowTableToDenseUnion,
  convertGeoArrowVectorToDenseUnion,
  tessellateArrowPolygons
} from '@luma.gl/arrow';
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

it('convertGeoArrowTableToDenseUnion converts WKB/WKT mixed geometry fixtures', () => {
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

    expect(
      convertedWKBField.metadata.get('ARROW:extension:name'),
      `${wkbFixture} updates the field extension metadata`
    ).toBe('geoarrow.geometry');
    expect(
      getDenseUnionCoordinateDimension(convertedWKBGeometry),
      `${wkbFixture} preserves the coordinate dimension`
    ).toBe(expectedDimension);
    expect(
      normalizeDenseUnionNullTypeIds(getDenseUnionRows(convertedWKBGeometry)),
      `${wkbFixture} and ${wktFixture} produce equivalent dense union rows`
    ).toEqual(normalizeDenseUnionNullTypeIds(getDenseUnionRows(convertedWKTGeometry)));
  }
  void 0;
});

it('convertGeoArrowVectorToDenseUnion converts vectors and returns dense unions unchanged', () => {
  const geometry = arrow.vectorFromArray(
    [
      'POINT (30 10)',
      'LINESTRING (30 10, 10 30, 40 40)',
      'POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))'
    ],
    new arrow.Utf8()
  );
  const convertedGeometry = convertGeoArrowVectorToDenseUnion(geometry, {encoding: 'geoarrow.wkt'});

  expect(
    Boolean(arrow.DataType.isDenseUnion(convertedGeometry.type)),
    'converts a WKT vector to a DenseUnion vector'
  ).toBe(true);
  expect(
    getDenseUnionRows(convertedGeometry).slice(0, 3),
    'parses point, linestring, and polygon rows'
  ).toEqual([
    {typeId: 1, value: [30, 10]},
    {
      typeId: 5,
      value: [
        [30, 10],
        [10, 30],
        [40, 40]
      ]
    },
    {
      typeId: 9,
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
  ]);
  expect(
    convertGeoArrowVectorToDenseUnion(convertedGeometry),
    'returns an existing DenseUnion vector unchanged'
  ).toBe(convertedGeometry);
  void 0;
});

it('convertGeoArrowVectorToDenseUnion preserves serialized null rows', () => {
  const geometry = arrow.vectorFromArray(
    ['POINT (1 2)', null, 'LINESTRING (0 0, 1 1)'],
    new arrow.Utf8()
  );
  const convertedGeometry = convertGeoArrowVectorToDenseUnion(geometry, {
    encoding: 'geoarrow.wkt'
  });

  expect(convertedGeometry.get(1), 'preserves a null through the dense-union adapter').toBe(null);
  void 0;
});

it('convertGeoArrowVectorToDenseUnion lets math.gl infer WKB dimensions and preserve chunks', () => {
  const sourceGeometry = loadGeoArrowFixture('example_point-z_wkb.arrows').getChild('geometry')!;
  const splitRow = 2;
  const chunkedGeometry = new arrow.Vector([
    sourceGeometry.slice(0, splitRow).data[0],
    sourceGeometry.slice(splitRow).data[0]
  ]);
  const convertedGeometry = convertGeoArrowVectorToDenseUnion(chunkedGeometry);

  expect(convertedGeometry.data.length, 'preserves both source Arrow chunks').toBe(2);
  expect(
    getDenseUnionCoordinateDimension(convertedGeometry),
    'uses the WKB headers to infer XYZ coordinates'
  ).toBe(3);
  expect(
    getDenseUnionRows(convertedGeometry),
    'preserves all geometry rows across chunk boundaries'
  ).toEqual(getDenseUnionRows(convertGeoArrowVectorToDenseUnion(sourceGeometry)));
  void 0;
});

it('convertGeoArrowVectorToDenseUnion preserves EWKT dimensions and strips SRID prefixes', () => {
  const geometry = arrow.vectorFromArray(['SRID=4326;POINT Z (1 2 3)'], new arrow.Utf8());
  const convertedGeometry = convertGeoArrowVectorToDenseUnion(geometry, {
    encoding: 'geoarrow.wkt'
  });

  expect(
    getDenseUnionCoordinateDimension(convertedGeometry),
    'preserves the EWKT coordinate dimension'
  ).toBe(3);
  expect(
    getDenseUnionRows(convertedGeometry),
    'decodes the geometry after removing the SRID prefix'
  ).toEqual([{typeId: 2, value: [1, 2, 3]}]);
  void 0;
});

it('convertGeoArrowTableToDenseUnion converts explicitly selected WKT columns', () => {
  const sourceTable = new arrow.Table({
    id: arrow.vectorFromArray([7], new arrow.Int32()),
    geometry: arrow.vectorFromArray(['POINT (1 2)'], new arrow.Utf8())
  });

  expect(
    convertGeoArrowTableToDenseUnion(sourceTable, {encoding: 'geoarrow.wkt'}),
    'does not infer non-metadata table columns from encoding alone'
  ).toBe(sourceTable);

  const convertedTable = convertGeoArrowTableToDenseUnion(sourceTable, {
    geometryColumn: 'geometry',
    encoding: 'geoarrow.wkt'
  });

  expect(convertedTable.getChild('id')!.type.toString(), 'preserves non-geometry columns').toBe(
    sourceTable.getChild('id')!.type.toString()
  );
  expect(
    getDenseUnionRows(convertedTable.getChild('geometry')!),
    'converts the selected column'
  ).toEqual([{typeId: 1, value: [1, 2]}]);
  void 0;
});

it('convertGeoArrowTableToDenseUnion output tessellates polygon rows', () => {
  const wkbTable = convertGeoArrowTableToDenseUnion(
    loadGeoArrowFixture('example_multipolygon_wkb.arrows')
  );
  const wktTable = convertGeoArrowTableToDenseUnion(
    loadGeoArrowFixture('example_multipolygon_wkt.arrows')
  );
  const wkbResult = tessellateArrowPolygons({polygons: wkbTable.getChild('geometry')!});
  const wktResult = tessellateArrowPolygons({polygons: wktTable.getChild('geometry')!});

  expect(wkbResult.rowCount, 'keeps the source geometry row count').toBe(5);
  expect(Boolean(wkbResult.polygonCount > 0), 'tessellates multipolygon rows').toBe(true);
  expect(Array.from(wkbResult.positions), 'positions match').toEqual(
    Array.from(wktResult.positions)
  );
  expect(Array.from(wkbResult.indices), 'indices match').toEqual(Array.from(wktResult.indices));
  expect(Array.from(wkbResult.rowIndices), 'source row indices match').toEqual(
    Array.from(wktResult.rowIndices)
  );
  void 0;
});

it('convertGeoArrowTableToDenseUnion rejects WKB/WKT GeometryCollection rows', () => {
  expect(
    () =>
      convertGeoArrowTableToDenseUnion(
        loadGeoArrowFixture('example_geometrycollection_wkb.arrows')
      ),
    'rejects WKB GeometryCollection rows with a target-specific error'
  ).toThrow(/GeometryCollection conversion requires geoarrow\.geometrycollection output/);
  expect(
    () =>
      convertGeoArrowTableToDenseUnion(
        loadGeoArrowFixture('example_geometrycollection_wkt.arrows')
      ),
    'rejects WKT GeometryCollection rows with a target-specific error'
  ).toThrow(/GeometryCollection conversion requires geoarrow\.geometrycollection output/);
  void 0;
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

function normalizeDenseUnionNullTypeIds(
  rows: {typeId: number; value: unknown}[]
): {typeId: number; value: unknown}[] {
  return rows.map(row => (row.value === null ? {typeId: 0, value: null} : row));
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
