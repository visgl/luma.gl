// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {tesselateAsync, tessellateArrowPolygons} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

test('@luma.gl/arrow re-exports tessellateArrowPolygons from @math.gl/geoarrow', t => {
  const coordinateData = makeFixedSizeListData(
    new arrow.Float32(),
    2,
    Float32Array.from([0, 0, 1, 0, 1, 1])
  );
  const polygons = arrow.makeVector(makeListData(coordinateData, Int32Array.from([0, 3])));

  const result = tessellateArrowPolygons({polygons}, {tessellated: true});

  t.deepEqual(Array.from(result.indices), [0, 1, 2], 'returns tessellated triangle indices');
  t.equal(result.vertexCount, 3, 'returns output vertices');
  t.end();
});

test('@luma.gl/arrow re-exports tesselateAsync from @math.gl/geoarrow', async t => {
  const coordinateData = makeFixedSizeListData(
    new arrow.Float32(),
    2,
    Float32Array.from([0, 0, 1, 0, 1, 1])
  );
  const polygons = arrow.makeVector(makeListData(coordinateData, Int32Array.from([0, 3])));

  const result = await tesselateAsync({polygons}, {tessellated: true});

  t.deepEqual(Array.from(result.indices), [0, 1, 2], 'returns async triangle indices');
  t.end();
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
