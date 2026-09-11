import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {GPUGather} from '../../src/gpu-core/gpu-gather';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('GPUGather reorders fixed-width float32x3 rows and zeroes invalid indices', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const source = new Float32Array([
    1, 2, 3,
    4, 5, 6,
    7, 8, 9,
    10, 11, 12
  ]);
  const indices = Uint32Array.from([2, 0, 3, 99]);
  const sourceBuffer = device.createBuffer({
    id: 'gather-source',
    data: source,
    usage: Buffer.STORAGE
  });
  const indexBuffer = device.createBuffer({
    id: 'gather-indices',
    data: indices,
    usage: Buffer.STORAGE
  });
  const outputBuffer = device.createBuffer({
    id: 'gather-output',
    byteLength: indices.length * 3 * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id: 'gather-graph'});
  const sourceView = graph.importGPUData(
    'source',
    new GPUData({buffer: sourceBuffer, format: 'float32x3', length: 4, ownsBuffer: false})
  );
  const indexView = graph.importGPUData(
    'indices',
    new GPUData({buffer: indexBuffer, format: 'uint32', length: indices.length, ownsBuffer: false})
  );
  const outputView = graph.importGPUData(
    'output',
    new GPUData({buffer: outputBuffer, format: 'float32x3', length: indices.length, ownsBuffer: false})
  );

  new GPUGather({source: sourceView, indices: indexView, output: outputView}).addToGraph(graph);
  const compiled = graph.compile();

  try {
    await encodeAndSubmit(device, compiled, 'typed-gather');
    const bytes = await outputBuffer.readAsync(0, outputBuffer.byteLength);
    expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 12))).toEqual([
      7, 8, 9,
      1, 2, 3,
      10, 11, 12,
      0, 0, 0
    ]);
  } finally {
    compiled.destroy();
    sourceBuffer.destroy();
    indexBuffer.destroy();
    outputBuffer.destroy();
  }
});

async function encodeAndSubmit(
  device: Device,
  compiled: ReturnType<GPUCommandGraph<void>['compile']>,
  id: string
): Promise<void> {
  const commandEncoder = device.createCommandEncoder({id});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}
