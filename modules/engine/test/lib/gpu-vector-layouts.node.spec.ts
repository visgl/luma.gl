// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {drawGPUVectorGroups} from '../../src/model/gpu-vector-draw-batches';
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

it('retains full-group inference while drawing batches with different sharing', () => {
  const device = new NullDevice({});
  const buffers = [0, 1, 2].map(() => device.createBuffer({byteLength: 32}));
  const vector = (indexes: number[], byteOffset: number) =>
    new GPUVector({
      type: 'data',
      format: 'float32',
      data: indexes.map(
        index =>
          new GPUData({
            buffer: buffers[index],
            format: 'float32',
            length: 2,
            byteOffset,
            byteStride: 8
          })
      )
    });
  const geometry = new GPUVectorBindings(device, 'geometry');
  const attributes = new GPUVectorBindings(device, 'attributes');
  attributes.setInputs({first: vector([0, 1], 0), second: vector([0, 2], 4)}, undefined, 'vertex');
  const model = {
    vertexCount: 4,
    instanceCount: 0,
    isInstanced: false,
    indexBuffer: null,
    setVertexCount(value: number) {
      this.vertexCount = value;
    },
    setInstanceCount(value: number) {
      this.instanceCount = value;
    }
  };
  let draws = 0;
  drawGPUVectorGroups(
    model,
    geometry,
    attributes,
    () => {
      expect(attributes.layouts).toHaveLength(2);
    },
    () => {
      draws++;
      return true;
    }
  );
  expect(draws).toBe(2);
  expect(attributes.sourceLayouts).toBeUndefined();
  geometry.destroy();
  attributes.destroy();
  for (const buffer of buffers) buffer.destroy();
});
