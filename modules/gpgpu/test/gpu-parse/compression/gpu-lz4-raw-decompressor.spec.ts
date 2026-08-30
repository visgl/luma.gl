// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPULZ4RawDecompressor, parseLZ4RawDecompressionPlan} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('GPULZ4RawDecompressor resolves overlapping matches', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const compressed = Uint8Array.from([0x14, 65, 1, 0, 0x50, 66, 67, 68, 69, 70]);
  const plan = parseLZ4RawDecompressionPlan(compressed);
  const paddedCompressed = new Uint8Array(12);
  paddedCompressed.set(compressed);
  const inputBuffer = device.createBuffer({
    data: paddedCompressed,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const descriptorBuffer = device.createBuffer({
    data: plan.sequenceDescriptors,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    byteLength: 16,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device);
  const inputHandle = graph.importBuffer(
    {id: 'input', byteLength: inputBuffer.byteLength, usage: inputBuffer.usage},
    inputBuffer
  );
  const descriptorHandle = graph.importBuffer(
    {id: 'descriptors', byteLength: descriptorBuffer.byteLength, usage: descriptorBuffer.usage},
    descriptorBuffer
  );
  const outputHandle = graph.importBuffer(
    {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
    outputBuffer
  );
  new GPULZ4RawDecompressor({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 3}),
    sequenceDescriptors: graph.createDataView(descriptorHandle, {format: 'uint32', length: 10}),
    output: graph.createDataView(outputHandle, {format: 'uint32', length: 4}),
    compressedByteLength: plan.compressedByteLength,
    outputByteLength: plan.outputByteLength,
    sequenceCount: plan.sequenceCount
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-lz4-raw-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const result = await outputBuffer.readAsync();
    testCase.deepEqual(
      Array.from(new Uint8Array(result.buffer, result.byteOffset, plan.outputByteLength)),
      [65, 65, 65, 65, 65, 65, 65, 65, 65, 66, 67, 68, 69, 70]
    );
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    descriptorBuffer.destroy();
    outputBuffer.destroy();
  }
  testCase.end();
});
