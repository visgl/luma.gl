// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {tesselateAsync, tessellateArrowPolygons} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

it('@luma.gl/arrow tessellateArrowPolygons delegates geometry work to math.gl', () => {
  const coordinateData = makeFixedSizeListData(
    new arrow.Float32(),
    2,
    Float32Array.from([0, 0, 1, 0, 1, 1])
  );
  const polygons = arrow.makeVector(makeListData(coordinateData, Int32Array.from([0, 3])));

  const result = tessellateArrowPolygons({polygons}, {tessellated: true});

  expect(Array.from(result.indices), 'returns tessellated triangle indices').toEqual([0, 1, 2]);
  expect(result.vertexCount, 'returns output vertices').toBe(3);
  void 0;
});

it('@luma.gl/arrow tesselateAsync preserves the compatibility entrypoint', async () => {
  const coordinateData = makeFixedSizeListData(
    new arrow.Float32(),
    2,
    Float32Array.from([0, 0, 1, 0, 1, 1])
  );
  const polygons = arrow.makeVector(makeListData(coordinateData, Int32Array.from([0, 3])));

  const result = await tesselateAsync({polygons}, {tessellated: true});

  expect(Array.from(result.indices), 'returns async triangle indices').toEqual([0, 1, 2]);
  void 0;
});

function makeFixedSizeListData<T extends arrow.DataType>(
  childType: T,
  listSize: number,
  values: T['TArray']
): arrow.Data<arrow.FixedSizeList<T>> {
  const childData = new arrow.Data(childType, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  const listType = new arrow.FixedSizeList(listSize, new arrow.Field('value', childType, false));
  return new arrow.Data(listType, 0, values.length / listSize, 0, {}, [childData]);
}

function makeListData<T extends arrow.DataType>(
  childData: arrow.Data<T>,
  offsets: Int32Array
): arrow.Data<arrow.List<T>> {
  const listType = new arrow.List(new arrow.Field('values', childData.type, false));
  return new arrow.Data(listType, 0, offsets.length - 1, 0, {[arrow.BufferType.OFFSET]: offsets}, [
    childData
  ]);
}
