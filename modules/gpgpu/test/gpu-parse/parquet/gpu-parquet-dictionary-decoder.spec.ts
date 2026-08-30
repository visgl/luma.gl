// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GPUParquetRleDictionaryDecoder,
  parseParquetRleBitPackedRunPlan
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('GPUParquetRleDictionaryDecoder expands composed fixed-width dictionary values', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const encoded = Uint8Array.from([
    6,
    2,
    3,
    ...encodeBitPacked([0, 1, 2, 0, 1, 0, 0, 0], 2),
    0,
    0,
    0
  ]);
  const plan = parseParquetRleBitPackedRunPlan(encoded, 2, 8);
  const dictionary = Uint8Array.from([10, 11, 12, 20, 21, 22, 30, 31, 32, 0, 0, 0]);
  const inputBuffer = device.createBuffer({data: encoded, usage: Buffer.STORAGE | Buffer.COPY_DST});
  const descriptorBuffer = device.createBuffer({
    data: plan.runDescriptors,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const dictionaryBuffer = device.createBuffer({
    data: dictionary,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    byteLength: 24,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device);
  const input = importUint32View(graph, 'input', inputBuffer, 2);
  const runDescriptors = importUint32View(graph, 'descriptors', descriptorBuffer, 8);
  const dictionaryView = importUint32View(graph, 'dictionary', dictionaryBuffer, 3);
  const output = importUint32View(graph, 'output', outputBuffer, 6);
  new GPUParquetRleDictionaryDecoder({
    input,
    runDescriptors,
    dictionary: dictionaryView,
    output,
    encodedByteLength: plan.bytesConsumed,
    valueCount: 8,
    runCount: plan.runCount,
    bitWidth: 2,
    dictionaryValueCount: 3,
    byteWidth: 3
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-rle-dictionary-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const result = await outputBuffer.readAsync();
    testCase.deepEqual(
      Array.from(new Uint8Array(result.buffer, result.byteOffset, 24)),
      [
        30, 31, 32, 30, 31, 32, 30, 31, 32, 10, 11, 12, 20, 21, 22, 30, 31, 32, 10, 11, 12, 20, 21,
        22
      ]
    );
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    descriptorBuffer.destroy();
    dictionaryBuffer.destroy();
    outputBuffer.destroy();
  }
  testCase.end();
});

function importUint32View(graph: GPUCommandGraph, id: string, buffer: Buffer, length: number) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format: 'uint32', length});
}

function encodeBitPacked(values: number[], bitWidth: number): number[] {
  const bytes = new Uint8Array((values.length * bitWidth) / 8);
  values.forEach((value, valueIndex) => {
    for (let bitIndex = 0; bitIndex < bitWidth; bitIndex++) {
      if ((value & (1 << bitIndex)) !== 0) {
        const outputBitIndex = valueIndex * bitWidth + bitIndex;
        bytes[Math.floor(outputBitIndex / 8)] |= 1 << (outputBitIndex % 8);
      }
    }
  });
  return Array.from(bytes);
}
