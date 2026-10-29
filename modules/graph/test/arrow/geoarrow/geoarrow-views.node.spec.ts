// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import * as arrow from 'apache-arrow';
import {materializeGeoArrowRows} from '@math.gl/geospatial/geoarrow';
import {
  getGeoArrowRowViewFromArrowVector,
  iterateGeoArrowBatchesFromArrowVector
} from '@luma.gl/graph/arrow';

it('borrowed views preserve sliced chunks, null rows, and coordinate buffers', () => {
  const type = new arrow.FixedSizeList(2, new arrow.Field('xy', new arrow.Float64(), false));
  const source = arrow.vectorFromArray([[0, 1], [2, 3], null, [6, 7], [8, 9]], type);
  const first = source.slice(1, 3);
  const second = source.slice(3, 5);
  const vector = new arrow.Vector([...first.data, ...second.data]);
  const batches = Array.from(iterateGeoArrowBatchesFromArrowVector(vector));
  expect(batches.map(batch => [batch.chunkIndex, batch.rowOffset])).toEqual([
    [0, 0],
    [1, 2]
  ]);
  const expectedRows = [
    {type: 'Point', coordinates: [2, 3]},
    null,
    {type: 'Point', coordinates: [6, 7]},
    {type: 'Point', coordinates: [8, 9]}
  ];
  expect(batches.map(batch => materializeGeoArrowRows(batch.column))).toEqual([
    expectedRows.slice(0, 2),
    expectedRows.slice(2)
  ]);
  for (const batch of batches) {
    const chunk = batch.column.chunks[0];
    expect(chunk.kind).toBe('fixed-size-list');
    if (chunk.kind === 'fixed-size-list' && chunk.child.kind === 'primitive') {
      expect(chunk.child.values.buffer).toBe(source.data[0].children[0].values.buffer);
    }
  }
  for (let rowIndex = 0; rowIndex < vector.length; rowIndex++) {
    const row = getGeoArrowRowViewFromArrowVector(vector, rowIndex);
    expect(row.chunkIndex).toBe(Math.floor(rowIndex / 2));
    expect(row.chunkRowIndex).toBe(rowIndex % 2);
    expect(materializeGeoArrowRows(row.column)).toEqual([expectedRows[rowIndex]]);
  }
  expect(() => getGeoArrowRowViewFromArrowVector(vector, -1)).toThrow(RangeError);
  expect(() => getGeoArrowRowViewFromArrowVector(vector, vector.length)).toThrow(RangeError);
});
