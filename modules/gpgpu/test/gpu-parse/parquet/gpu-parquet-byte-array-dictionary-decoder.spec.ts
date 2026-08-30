// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUParquetByteArrayDictionaryDecoder} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('GPUParquetByteArrayDictionaryDecoder composes gathers and scan', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const dictionaryBytes = new TextEncoder().encode('catdoghorse');
  const paddedDictionary = new Uint8Array(12);
  paddedDictionary.set(dictionaryBytes);
  const data: (Uint8Array | Uint32Array)[] = [
    paddedDictionary,
    new Uint32Array([3, 3, 5]),
    new Uint32Array([0, 3, 6]),
    new Uint32Array([2, 0, 1, 2])
  ];
  const buffers = data.map(values =>
    device.createBuffer({data: values, usage: Buffer.STORAGE | Buffer.COPY_DST})
  );
  buffers.push(
    device.createBuffer({byteLength: 16, usage: Buffer.STORAGE | Buffer.COPY_SRC}),
    device.createBuffer({byteLength: 16, usage: Buffer.STORAGE | Buffer.COPY_SRC}),
    device.createBuffer({byteLength: 16, usage: Buffer.STORAGE | Buffer.COPY_SRC})
  );
  const graph = new GPUCommandGraph(device);
  const view = (index: number, id: string, length: number) => {
    const buffer = buffers[index];
    const handle = graph.importBuffer(
      {id, byteLength: buffer.byteLength, usage: buffer.usage},
      buffer
    );
    return graph.createDataView(handle, {format: 'uint32', length});
  };
  new GPUParquetByteArrayDictionaryDecoder({
    dictionary: view(0, 'dictionary', 3),
    dictionaryLengths: view(1, 'dictionary-lengths', 3),
    dictionaryOffsets: view(2, 'dictionary-offsets', 3),
    indices: view(3, 'indices', 4),
    outputLengths: view(4, 'lengths', 4),
    outputOffsets: view(5, 'offsets', 4),
    output: view(6, 'output', 4),
    dictionaryByteLength: dictionaryBytes.length,
    outputByteCapacity: 16
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-byte-array-dictionary-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const lengths = await buffers[4].readAsync();
    const offsets = await buffers[5].readAsync();
    const output = await buffers[6].readAsync();
    testCase.deepEqual(
      Array.from(new Uint32Array(lengths.buffer, lengths.byteOffset, 4)),
      [5, 3, 3, 5]
    );
    testCase.deepEqual(
      Array.from(new Uint32Array(offsets.buffer, offsets.byteOffset, 4)),
      [0, 5, 8, 11]
    );
    testCase.equal(new TextDecoder().decode(output), 'horsecatdoghorse');
  } finally {
    compiled.destroy();
    for (const buffer of buffers) buffer.destroy();
  }
  testCase.end();
});
