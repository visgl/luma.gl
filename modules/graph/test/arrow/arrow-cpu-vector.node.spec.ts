// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
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
  const gpu = makeGPUVectorFromCPUVector(device, mesh.indices);
  try {
    const returned = await makeCPUVectorFromGPUVector(gpu);
    expect(returned.data[0].valueOffsets).toEqual(mesh.indices.data[0].valueOffsets);
    expect(returned.data[0].nullBitmap).toEqual(mesh.indices.data[0].nullBitmap);
  } finally {
    gpu.destroy();
    device.destroy();
  }
});
