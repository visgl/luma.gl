// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {CPUData, CPUVector} from '@luma.gl/graph/gpu-data';
import {CPUProjectionOperation} from '@luma.gl/graph/gpu-project';
import {projectionEngine} from '@math.gl/geospatial/projection';

test('CPU vectors preserve borrowed views, list metadata and chunks', () => {
  const values = new Float32Array([99, 1, 2, 3, 4, 99]);
  const offsets = new Int32Array([0, 1, 2]);
  const chunk = new CPUData({
    buffer: values.subarray(1, 5),
    format: 'vertex-list<float32x2>',
    length: 2,
    valueLength: 2,
    valueOffsets: offsets
  });
  const vector = new CPUVector({format: 'vertex-list<float32x2>', data: [chunk]});
  expect(chunk.buffer).toBe(values.buffer);
  expect(chunk.byteOffset).toBe(4);
  expect(chunk.valueOffsets).toBe(offsets);
  expect(vector.data[0]).toBe(chunk);
  expect(vector.length).toBe(2);
  expect(
    () => new CPUData({buffer: values.subarray(1, 3), format: 'float32x2', length: 2})
  ).toThrow();
  expect(new CPUVector({format: 'float32', data: []}).length).toBe(0);
});

test('CPU projection matches math.gl and preserves source arrays and chunks', async () => {
  const projection = await projectionEngine.createProjectionAsync({
    from: 'EPSG:4326',
    to: 'EPSG:3857'
  });
  const values = new Float32Array([0, 0, 10, 20]);
  const operation = new CPUProjectionOperation({
    id: 'project',
    input: 'source',
    output: 'result',
    format: 'float32x2',
    projection
  });
  const expected = values.slice();
  projection.projectFlat(expected, 2);
  const result = await operation.execute({
    inputs: {
      positions: {
        format: 'float32x2',
        length: 2,
        chunks: [
          {values, length: 2},
          {values: new Float32Array(0), length: 0}
        ],
        pack: () => values.slice()
      }
    }
  });
  const output = result.result;
  if (!('chunks' in output)) throw new Error('Expected chunks');
  expect(output.chunks[0].values).toEqual(expected);
  expect(output.chunks[1].values.length).toBe(0);
  expect(values).toEqual(new Float32Array([0, 0, 10, 20]));
});
