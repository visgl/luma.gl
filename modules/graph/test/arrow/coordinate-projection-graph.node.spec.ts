// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import * as arrow from 'apache-arrow';
import {NullDevice} from '@luma.gl/core/test-utils';
import {CoordinateProjectionGraph} from '@luma.gl/graph/gpu-project/graph';
import {projectArrowCoordinates} from '@luma.gl/graph/arrow';

test('Arrow and GPU coordinates share a reusable graph with independent result ownership', async () => {
  const device = new NullDevice({});
  const projection = {
    projectFlat<T extends number[] | Float32Array | Float64Array>(values: T): T {
      for (let index = 0; index < values.length; index++) values[index] *= 2;
      return values;
    }
  };
  const graph = new CoordinateProjectionGraph(device, {format: 'float32x2', projection});
  const source = arrow.vectorFromArray(
    [
      [1, 2],
      [3, 4]
    ],
    new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float32(), false))
  );
  const first = await projectArrowCoordinates(graph, source);
  const read = vi.spyOn(first.positions.data[0].buffer, 'readAsync');
  const second = await graph.run(first.positions);
  expect(read).toHaveBeenCalledTimes(1);
  expect(second.positions).not.toBe(first.positions);
  const bytes = await second.positions.data[0].buffer.readAsync(0, 16);
  expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 4))).toEqual([4, 8, 12, 16]);
  graph.destroy();
  expect(first.positions.length).toBe(2);
  first.destroy();
  second.destroy();
  device.destroy();
});
