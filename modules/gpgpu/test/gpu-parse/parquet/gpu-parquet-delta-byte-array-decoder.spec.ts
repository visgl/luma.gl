// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GPUParquetDeltaByteArrayDecoder,
  parseParquetDeltaByteArrayPlan
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

const ENCODED = Uint8Array.from([
  128, 1, 4, 4, 0, 5, 3, 0, 0, 0, 37, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 1, 4, 4, 6, 3, 3, 0, 0,
  0, 104, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99, 97, 116, 114, 116, 111, 111, 110, 100, 111, 103
]);

test('GPUParquetDeltaByteArrayDecoder reconstructs prefix-compressed values', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const plan = parseParquetDeltaByteArrayPlan(ENCODED);
  const paddedEncoded = new Uint8Array(56);
  paddedEncoded.set(ENCODED);
  const inputBuffer = device.createBuffer({
    data: paddedEncoded,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const prefixDescriptorBuffer = device.createBuffer({
    data: plan.prefixLengthPlan.miniBlockDescriptors,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const suffixDescriptorBuffer = device.createBuffer({
    data: plan.suffixLengthPlan.miniBlockDescriptors,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const prefixLengthsBuffer = device.createBuffer({
    byteLength: 16,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const suffixLengthsBuffer = device.createBuffer({
    byteLength: 16,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const valueOffsetsBuffer = device.createBuffer({
    byteLength: 16,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const outputBuffer = device.createBuffer({
    byteLength: 16,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device);
  const input = importView(graph, inputBuffer, 'input', 14);
  const prefixDescriptors = importView(graph, prefixDescriptorBuffer, 'prefix-descriptors', 5);
  const suffixDescriptors = importView(graph, suffixDescriptorBuffer, 'suffix-descriptors', 5);
  const prefixLengths = importView(graph, prefixLengthsBuffer, 'prefix-lengths', 4);
  const suffixLengths = importView(graph, suffixLengthsBuffer, 'suffix-lengths', 4);
  const valueOffsets = importView(graph, valueOffsetsBuffer, 'value-offsets', 4);
  const output = importView(graph, outputBuffer, 'output', 4);
  new GPUParquetDeltaByteArrayDecoder({
    input,
    prefixMiniBlockDescriptors: prefixDescriptors,
    suffixMiniBlockDescriptors: suffixDescriptors,
    prefixLengths,
    suffixLengths,
    valueOffsets,
    output,
    encodedByteLength: ENCODED.length,
    suffixDataByteOffset: plan.suffixDataByteOffset,
    suffixDataByteLength: plan.suffixDataByteLength,
    outputByteCapacity: 16,
    valueCount: 4,
    prefixDescriptorCount: plan.prefixLengthPlan.descriptorCount,
    suffixDescriptorCount: plan.suffixLengthPlan.descriptorCount,
    firstPrefixLength: plan.prefixLengthPlan.firstValue,
    firstSuffixLength: plan.suffixLengthPlan.firstValue
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-delta-byte-array-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const decodedPrefixLengths = await prefixLengthsBuffer.readAsync();
    const decodedSuffixLengths = await suffixLengthsBuffer.readAsync();
    const decodedValueOffsets = await valueOffsetsBuffer.readAsync();
    const decodedOutput = await outputBuffer.readAsync();
    testCase.deepEqual(readUint32(decodedPrefixLengths, 4), [0, 2, 3, 0]);
    testCase.deepEqual(readUint32(decodedSuffixLengths, 4), [3, 1, 4, 3]);
    testCase.deepEqual(readUint32(decodedValueOffsets, 4), [0, 3, 6, 13]);
    testCase.equal(new TextDecoder().decode(decodedOutput), 'catcarcartoondog');
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    prefixDescriptorBuffer.destroy();
    suffixDescriptorBuffer.destroy();
    prefixLengthsBuffer.destroy();
    suffixLengthsBuffer.destroy();
    valueOffsetsBuffer.destroy();
    outputBuffer.destroy();
  }
  testCase.end();
});

function importView(graph: GPUCommandGraph, buffer: Buffer, id: string, length: number) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format: 'uint32', length});
}

function readUint32(bytes: Uint8Array, length: number): number[] {
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}
