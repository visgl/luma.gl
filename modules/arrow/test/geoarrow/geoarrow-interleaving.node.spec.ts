// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {expect, it} from 'vitest';
import {
  convertGeoArrowTableToInterleaved,
  convertGeoArrowVectorToInterleaved
} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

const FIXTURE_PAIRS = [
  ['example_point.arrows', 'example_point_interleaved.arrows'],
  ['example_point-z.arrows', 'example_point-z_interleaved.arrows'],
  ['example_point-m.arrows', 'example_point-m_interleaved.arrows'],
  ['example_point-zm.arrows', 'example_point-zm_interleaved.arrows'],
  ['example_linestring.arrows', 'example_linestring_interleaved.arrows'],
  ['example_polygon.arrows', 'example_polygon_interleaved.arrows'],
  ['example_polygon-zm.arrows', 'example_polygon-zm_interleaved.arrows'],
  ['example_multipoint.arrows', 'example_multipoint_interleaved.arrows'],
  ['example_multilinestring.arrows', 'example_multilinestring_interleaved.arrows'],
  ['example_multipolygon.arrows', 'example_multipolygon_interleaved.arrows']
] as const;

it('convertGeoArrowTableToInterleaved matches native interleaved GeoArrow fixtures', () => {
  for (const [separatedFixture, interleavedFixture] of FIXTURE_PAIRS) {
    const separatedTable = loadGeoArrowFixture(separatedFixture);
    const interleavedTable = loadGeoArrowFixture(interleavedFixture);
    const convertedTable = convertGeoArrowTableToInterleaved(separatedTable);
    const convertedField = convertedTable.schema.fields.find(field => field.name === 'geometry')!;
    const interleavedField = interleavedTable.schema.fields.find(
      field => field.name === 'geometry'
    )!;
    const convertedGeometry = convertedTable.getChild('geometry')!;
    const interleavedGeometry = interleavedTable.getChild('geometry')!;

    expect(
      convertedField.metadata.get('ARROW:extension:name'),
      `${separatedFixture} preserves GeoArrow extension metadata`
    ).toBe(interleavedField.metadata.get('ARROW:extension:name'));
    expect(
      convertedGeometry.type.toString(),
      `${separatedFixture} converts to the interleaved fixture type`
    ).toBe(interleavedGeometry.type.toString());
    expect(
      getVectorRows(convertedGeometry),
      `${separatedFixture} converts coordinate values`
    ).toEqual(getVectorRows(interleavedGeometry));
  }
  void 0;
});

it('convertGeoArrowVectorToInterleaved returns already-interleaved vectors unchanged', () => {
  const table = loadGeoArrowFixture('example_multipolygon_interleaved.arrows');
  const geometry = table.getChild('geometry')!;

  expect(
    convertGeoArrowVectorToInterleaved(geometry),
    'returns the original vector when coordinate leaves are already interleaved'
  ).toBe(geometry);
  void 0;
});

function loadGeoArrowFixture(name: string): arrow.Table {
  const url = new URL(`../data/geoarrow-data/${name}`, import.meta.url);
  return arrow.tableFromIPC(readFileSync(url));
}

function getVectorRows(vector: arrow.Vector): unknown[] {
  const rows: unknown[] = [];
  for (let rowIndex = 0; rowIndex < vector.length; rowIndex++) {
    rows.push(getArrowValue(vector.get(rowIndex)));
  }
  return rows;
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
