// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUTableComputation} from '@luma.gl/experimental/gpu-tables';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, test} from 'vitest';

// WebGPU's default minStorageBufferOffsetAlignment, which every adapter supports.
const STORAGE_OFFSET_ALIGNMENT = 256;

test('GPUTableComputation binds fixed-size-list rows without trailing physical padding', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    skip('WebGPU unavailable');
    return;
  }
  const embeddings = new GPUVector({
    type: 'buffer',
    name: 'embeddings',
    buffer: device.createBuffer({byteLength: STORAGE_OFFSET_ALIGNMENT + 28}),
    format: 'fixed-size-list<float32,3>',
    length: 2,
    byteOffset: STORAGE_OFFSET_ALIGNMENT,
    byteStride: 16,
    ownsBuffer: true
  });
  const computation = new GPUTableComputation(device, {inputVectors: {embeddings}});

  expect(computation.bindings.embeddings).toEqual({
    buffer: embeddings.data[0].buffer,
    offset: STORAGE_OFFSET_ALIGNMENT,
    size: 28
  });

  embeddings.destroy();
});

test('GPUTableComputation never truncates padded rows with shorter explicit value spans', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    skip('WebGPU unavailable');
    return;
  }
  const limitedData = new GPUData({
    buffer: device.createBuffer({byteLength: 28}),
    format: 'fixed-size-list<float32,3>',
    length: 2,
    byteStride: 16,
    valueByteLength: 24,
    ownsBuffer: true
  });
  const limited = new GPUVector({
    type: 'data',
    name: 'limited',
    data: [limitedData],
    ownsData: false
  });
  const empty = new GPUVector({
    type: 'buffer',
    name: 'empty',
    buffer: device.createBuffer({byteLength: STORAGE_OFFSET_ALIGNMENT + 4}),
    format: 'fixed-size-list<float32,3>',
    length: 0,
    byteOffset: STORAGE_OFFSET_ALIGNMENT,
    ownsBuffer: true
  });
  const limitedComputation = new GPUTableComputation(device, {inputVectors: {limited}});
  const emptyComputation = new GPUTableComputation(device, {inputVectors: {empty}});

  expect(limitedComputation.bindings.limited).toEqual({
    buffer: limitedData.buffer,
    offset: 0,
    size: 28
  });
  expect(emptyComputation.bindings.empty).toEqual({
    buffer: empty.data[0].buffer,
    offset: STORAGE_OFFSET_ALIGNMENT,
    size: 0
  });

  limited.destroy();
  limitedData.destroy();
  empty.destroy();
});
