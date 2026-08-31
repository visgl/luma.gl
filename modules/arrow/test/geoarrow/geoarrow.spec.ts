// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  convertGeoArrowTableToInterleavedAsync,
  convertGeoArrowVectorToInterleaved,
  makeGeoArrowColumnFromArrowVector
} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

it('convertGeoArrowTableToInterleavedAsync converts separated coordinates', async () => {
  const table = makeSeparatedPointTable();
  const convertedTable = await convertGeoArrowTableToInterleavedAsync(table);
  const geometry = convertedTable.getChild('geometry')!;

  expect(
    convertedTable.schema.fields[0].metadata.get('ARROW:extension:name'),
    'preserves GeoArrow metadata'
  ).toBe('geoarrow.point');
  expect(geometry.type.toString(), 'creates interleaved XYZ rows').toBe(
    'FixedSizeList[3]<Float64>'
  );
  expect(getVectorRows(geometry), 'returns interleaved coordinates').toEqual([
    [1, 2, 3],
    [4, 5, 6]
  ]);
  void 0;
});

it('convertGeoArrowVectorToInterleaved normalizes sliced separated coordinate offsets', () => {
  const vector = makeSeparatedPointVector(
    [
      [10, 20, 30],
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9]
    ],
    [true, false, true, true]
  );
  const slicedVector = vector.slice(1, 4);
  const convertedVector = convertGeoArrowVectorToInterleaved(slicedVector);

  expect(convertedVector.data[0].offset, 'resets the compacted FixedSizeList chunk offset').toBe(0);
  expect(getVectorRows(convertedVector), 'preserves sliced validity and coordinate rows').toEqual([
    null,
    [4, 5, 6],
    [7, 8, 9]
  ]);
  void 0;
});

it('convertGeoArrowVectorToInterleaved preserves validity after a byte-aligned slice', () => {
  const coordinates = Array.from({length: 12}, (_, index) => [index, index + 100, index + 200]);
  const validRows = Array.from({length: 12}, () => true);
  validRows[0] = false;
  validRows[9] = false;
  const convertedVector = convertGeoArrowVectorToInterleaved(
    makeSeparatedPointVector(coordinates, validRows).slice(8, 11)
  );

  expect(getVectorRows(convertedVector), 'uses the full Arrow validity bitmap offset').toEqual([
    coordinates[8],
    null,
    coordinates[10]
  ]);
  void 0;
});

it('makeGeoArrowColumnFromArrowVector borrows Arrow coordinate buffers', () => {
  const vector = makeSeparatedPointVector([
    [1, 2, 3],
    [4, 5, 6]
  ]);
  const column = makeGeoArrowColumnFromArrowVector(vector, {encoding: 'geoarrow.point'});
  const chunk = column.chunks[0];

  expect(column.dimension, 'infers the semantic dimension').toBe('xyz');
  expect(column.coordinateLayout, 'infers the coordinate layout').toBe('separated');
  expect(
    Boolean(chunk.kind === 'struct'),
    'adapts separated coordinates as a struct descriptor'
  ).toBe(true);
  if (chunk.kind === 'struct' && chunk.children.x.kind === 'primitive') {
    expect(chunk.children.x.values, 'borrows the Arrow typed-array view without copying').toBe(
      vector.data[0].children[0].values
    );
  }
  void 0;
});

function makeSeparatedPointTable(): arrow.Table {
  const geometry = makeSeparatedPointVector([
    [1, 2, 3],
    [4, 5, 6]
  ]);
  const geometryField = new arrow.Field(
    'geometry',
    geometry.type,
    true,
    new Map([['ARROW:extension:name', 'geoarrow.point']])
  );
  const schema = new arrow.Schema([geometryField]);
  const recordBatchData = new arrow.Data(
    new arrow.Struct([geometryField]),
    0,
    geometry.length,
    0,
    {},
    [geometry.data[0]]
  );

  return new arrow.Table(schema, [new arrow.RecordBatch(schema, recordBatchData)]);
}

function makeSeparatedPointVector(coordinates: number[][], validRows?: boolean[]): arrow.Vector {
  const dimension = coordinates[0].length;
  const fields = ['x', 'y', 'z', 'm']
    .slice(0, dimension)
    .map(name => new arrow.Field(name, new arrow.Float64(), false));
  const children = fields.map((field, componentIndex) => {
    const values = Float64Array.from(coordinates.map(coordinate => coordinate[componentIndex]));
    return new arrow.Data(field.type, 0, values.length, 0, {
      [arrow.BufferType.DATA]: values
    });
  });
  const type = new arrow.Struct(fields);
  const buffers = validRows ? {[arrow.BufferType.VALIDITY]: arrow.util.packBools(validRows)} : {};
  const nullCount = validRows ? validRows.filter(isInvalidRow).length : 0;

  return new arrow.Vector([
    new arrow.Data(type, 0, coordinates.length, nullCount, buffers, children)
  ]);
}

function isInvalidRow(valid: boolean): boolean {
  return !valid;
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
