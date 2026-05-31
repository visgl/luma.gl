// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  convertGeoArrowTableToInterleavedAsync,
  convertGeoArrowVectorToInterleaved
} from '@math.gl/geoarrow';
import * as arrow from 'apache-arrow';

test('convertGeoArrowTableToInterleavedAsync converts separated coordinates', async t => {
  const table = makeSeparatedPointTable();
  const convertedTable = await convertGeoArrowTableToInterleavedAsync(table);
  const geometry = convertedTable.getChild('geometry')!;

  t.equal(
    convertedTable.schema.fields[0].metadata.get('ARROW:extension:name'),
    'geoarrow.point',
    'preserves GeoArrow metadata'
  );
  t.equal(geometry.type.toString(), 'FixedSizeList[3]<Float64>', 'creates interleaved XYZ rows');
  t.deepEqual(
    getVectorRows(geometry),
    [
      [1, 2, 3],
      [4, 5, 6]
    ],
    'returns interleaved coordinates'
  );
  t.end();
});

test('convertGeoArrowVectorToInterleaved normalizes sliced separated coordinate offsets', t => {
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

  t.equal(convertedVector.data[0].offset, 0, 'resets the compacted FixedSizeList chunk offset');
  t.deepEqual(
    getVectorRows(convertedVector),
    [null, [4, 5, 6], [7, 8, 9]],
    'preserves sliced validity and coordinate rows'
  );
  t.end();
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
