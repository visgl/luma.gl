// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUVectorBindings} from '../../src/model/gpu-vector-bindings';

it('only shares layouts when all chunks describe the same interleaved storage', () => {
  const device = new NullDevice({});
  const buffers = [0, 1, 2].map(() => device.createBuffer({byteLength: 64}));
  const vector = (offsets: number[], bufferIndexes: number[], byteStride = 16) =>
    new GPUVector({
      type: 'data',
      format: 'float32',
      data: offsets.map(
        (byteOffset, index) =>
          new GPUData({
            buffer: buffers[bufferIndexes[index]],
            format: 'float32',
            length: 2,
            byteOffset,
            byteStride
          })
      )
    });
  const first = vector([0, 0], [0, 1]);
  const bindings = new GPUVectorBindings(device, 'layout-test');
  for (const second of [
    vector([4, 8], [0, 1]), // Different relative offsets across batches.
    vector([4, 4], [0, 2]), // A different buffer in the second batch.
    vector([16, 16], [0, 1]), // Same allocation, but a different row range.
    vector([4, 4], [0, 1], 8) // Different strides.
  ]) {
    bindings.setInputs({first, second}, undefined, 'instance');
    expect(bindings.layouts).toHaveLength(2);
  }
  bindings.setInputs({first, second: vector([4, 4], [0, 1])}, undefined, 'instance');
  expect(bindings.layouts).toHaveLength(1);
  expect(bindings.instanceCount).toBe(4);
  bindings.destroy();
  for (const buffer of buffers) buffer.destroy();
});
