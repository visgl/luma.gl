// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, GPUScatter} from '@luma.gl/gpgpu/gpu-core';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('GPUScatter scatters fixed-width float rows and ignores invalid destinations', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const sourceData = new Float32Array([
    1, 2, 3,
    4, 5, 6,
    7, 8, 9
  ]);
  const indicesData = new Uint32Array([2, 0, 99]);
  const sourceBuffer = device.createBuffer({data: sourceData, usage: Buffer.STORAGE});
  const indicesBuffer = device.createBuffer({data: indicesData, usage: Buffer.STORAGE});
  const outputBuffer = device.createBuffer({
    byteLength: 4 * 3 * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
  });
  outputBuffer.write(new Float32Array(12));

  const graph = new GPUCommandGraph(device, {id: 'scatter-graph'});
  const source = graph.importGPUData(
    'source',
    new GPUData({buffer: sourceBuffer, format: 'float32x3', length: 3, ownsBuffer: false})
  );
  const indices = graph.importGPUData(
    'indices',
    new GPUData({buffer: indicesBuffer, format: 'uint32', length: 3, ownsBuffer: false})
  );
  const output = graph.importGPUData(
    'output',
    new GPUData({buffer: outputBuffer, format: 'float32x3', length: 4, ownsBuffer: false})
  );

  new GPUScatter({source, indices, output}).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const encoder = device.createCommandEncoder({id: 'scatter'});
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());

    const bytes = await outputBuffer.readAsync();
    expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 12))).toEqual([
      4, 5, 6,
      0, 0, 0,
      1, 2, 3,
      0, 0, 0
    ]);
  } finally {
    compiled.destroy();
    sourceBuffer.destroy();
    indicesBuffer.destroy();
    outputBuffer.destroy();
  }
});

it('GPUScatter rejects duplicate-buffer output aliases', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const dataBuffer = device.createBuffer({
    data: new Uint32Array([1, 2]),
    usage: Buffer.STORAGE
  });
  const indexBuffer = device.createBuffer({
    data: new Uint32Array([1, 0]),
    usage: Buffer.STORAGE
  });
  const graph = new GPUCommandGraph(device, {id: 'scatter-validation'});
  const data = graph.importGPUData(
    'data',
    new GPUData({buffer: dataBuffer, format: 'uint32', length: 2, ownsBuffer: false})
  );
  const indices = graph.importGPUData(
    'indices',
    new GPUData({buffer: indexBuffer, format: 'uint32', length: 2, ownsBuffer: false})
  );

  expect(() => new GPUScatter({source: data, indices, output: data})).toThrow(/separate buffer/);
  dataBuffer.destroy();
  indexBuffer.destroy();
});
