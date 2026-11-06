// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {expect, test, vi} from 'vitest';
import * as arrow from 'apache-arrow';
import {NullDevice} from '@luma.gl/core/test-utils';
import {
  makeCPUVectorFromArrow,
  makeArrowVectorFromCPUVector,
  projectCPUVector,
  tessellateCPUVectorPolygons
} from '@luma.gl/graph/arrow';
import {
  makeGPUVectorFromCPUVector,
  makeCPUVectorFromGPUVector,
  CPUVector
} from '@luma.gl/graph/gpu-data';
import {projectionEngine} from '@math.gl/geospatial/projection';

test('numeric Arrow CPU GPU round trip retains sliced validity and chunk boundaries', async () => {
  const first = arrow.vectorFromArray([1, null, 3, 4], new arrow.Float32()).slice(1, 4);
  const second = arrow.vectorFromArray([5, null], new arrow.Float32());
  const source = first.concat(second);
  const cpu = makeCPUVectorFromArrow(source);
  expect(cpu.data.map(chunk => chunk.length)).toEqual([3, 2]);
  expect(makeArrowVectorFromCPUVector(cpu).toArray()).toEqual(source.toArray());
  const device = new NullDevice({});
  const gpu = makeGPUVectorFromCPUVector(device, cpu);
  try {
    const returned = makeArrowVectorFromCPUVector(await makeCPUVectorFromGPUVector(gpu));
    expect(Array.from(returned)).toEqual(Array.from(source));
    expect(returned.data.map(chunk => chunk.length)).toEqual([3, 2]);
  } finally {
    gpu.destroy();
    device.destroy();
  }
});

test('single-level coordinate lists project and tessellate through CPU vectors', async () => {
  const type = new arrow.List(
    new arrow.Field(
      'coordinates',
      new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float32(), false)),
      false
    )
  );
  const source = arrow.vectorFromArray(
    [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ],
      null
    ],
    type
  );
  const cpu = makeCPUVectorFromArrow(source);
  const roundtrip = makeArrowVectorFromCPUVector(cpu);
  expect(roundtrip.get(0)?.toArray().length).toBe(5);
  expect(roundtrip.get(1)).toBeNull();
  const projection = await projectionEngine.createProjectionAsync({
    from: 'EPSG:4326',
    to: 'EPSG:3857'
  });
  const projected = await projectCPUVector(cpu, projection);
  expect(makeArrowVectorFromCPUVector(projected).get(1)).toBeNull();
  const mesh = tessellateCPUVectorPolygons(projected);
  expect(mesh.positions).toBeInstanceOf(CPUVector);
  expect(mesh.indices.valueLength).toBe(6);
  expect(mesh.positions.data[0].valueOffsets?.length).toBe(3);
  const device = new NullDevice({});
  const gpu = makeGPUVectorFromCPUVector(device, mesh.indices, {
    usage: Buffer.INDEX
  });
  try {
    expect(gpu.data[0].buffer.usage & Buffer.INDEX).toBeTruthy();
    expect(gpu.data[0].buffer.indexType).toBe('uint32');
    const returned = await makeCPUVectorFromGPUVector(gpu);
    expect(returned.data[0].valueOffsets).toEqual(mesh.indices.data[0].valueOffsets);
    expect(returned.data[0].nullBitmap).toEqual(mesh.indices.data[0].nullBitmap);
  } finally {
    gpu.destroy();
    device.destroy();
  }
});

test('rejects nullable list elements instead of discarding child validity', () => {
  const type = new arrow.List(new arrow.Field('item', new arrow.Float32(), true));
  expect(() => makeCPUVectorFromArrow(arrow.vectorFromArray([[1, null, 3]], type))).toThrow();
});

test('Float16 values round-trip without decoding their stored bits', () => {
  const source = arrow.vectorFromArray([1, 2, null, -3], new arrow.Float16());
  const result = makeArrowVectorFromCPUVector(makeCPUVectorFromArrow(source));
  expect(result.type.toString()).toBe(source.type.toString());
  expect(Array.from(result)).toEqual(Array.from(source));
});

test('projects a point chunk in one batched call', async () => {
  const type = new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float32(), false));
  const source = makeCPUVectorFromArrow(
    arrow.vectorFromArray(
      [
        [1, 2],
        [3, 4],
        [5, 6]
      ],
      type
    )
  );
  const projectFlat = vi.fn(
    <T extends number[] | Float32Array | Float64Array>(values: T) => values
  );
  await projectCPUVector(source, {projectFlat});
  expect(projectFlat).toHaveBeenCalledTimes(1);
  expect(projectFlat.mock.calls[0][0].length).toBe(6);
});

test('direct GeoArrow adapters borrow coordinate buffers and preserve topology', async () => {
  const {makeGeoArrowColumnFromCPUVector, makeCPUVectorFromGeoArrowColumn} = await import(
    '@luma.gl/graph/gpu-project/geoarrow'
  );
  const source = makeCPUVectorFromArrow(
    arrow.vectorFromArray(
      [
        [1, 2],
        [3, 4]
      ],
      new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float32(), false))
    )
  );
  const column = makeGeoArrowColumnFromCPUVector(source);
  const returned = makeCPUVectorFromGeoArrowColumn(column);
  expect(returned.data[0].buffer).toBe(source.data[0].buffer);
  expect(returned.data[0].byteOffset).toBe(source.data[0].byteOffset);
  expect(returned.length).toBe(source.length);
});

test('direct GeoArrow tessellation handles polygon holes without Apache Arrow conversion', async () => {
  const {makeGeoArrowColumnFromGeometryRows} = await import('@math.gl/geospatial/geoarrow');
  const {tessellateGeoArrowColumnToCPUVectors} = await import('@luma.gl/graph/arrow');
  const column = makeGeoArrowColumnFromGeometryRows(
    [
      {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [4, 0],
            [4, 4],
            [0, 4],
            [0, 0]
          ],
          [
            [1, 1],
            [1, 2],
            [2, 2],
            [2, 1],
            [1, 1]
          ]
        ]
      }
    ],
    {encoding: 'geoarrow.polygon'}
  );
  const result = tessellateGeoArrowColumnToCPUVectors(column);
  expect(result.positions.valueLength).toBe(8);
  expect(result.indices.valueLength).toBe(24);
});

test('projection preserves value-list format and vector name', async () => {
  const {CPUData} = await import('@luma.gl/graph/gpu-data');
  const source = new CPUVector({
    name: 'named-paths',
    format: 'value-list<float32x2>',
    data: [
      new CPUData({
        format: 'value-list<float32x2>',
        buffer: new Float32Array([1, 2, 3, 4]),
        length: 1,
        valueLength: 2,
        valueOffsets: new Int32Array([0, 2])
      })
    ]
  });
  const projection = await projectionEngine.createProjectionAsync({
    from: 'EPSG:4326',
    to: 'EPSG:3857'
  });
  const result = await projectCPUVector(source, projection);
  expect(result.name).toBe(source.name);
  expect(result.format).toBe(source.format);
  expect(result.data[0].format).toBe(source.format);
});
