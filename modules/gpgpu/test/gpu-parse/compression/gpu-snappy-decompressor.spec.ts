// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUSnappyDecompressor, parseSnappyDecompressionPlan} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('GPUSnappyDecompressor resolves raw Snappy backreferences', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const compressed = Uint8Array.from([10, 8, 97, 98, 99, 22, 3, 0, 0, 33, 0, 0]);
  const plan = parseSnappyDecompressionPlan(compressed.subarray(0, 10));
  const inputBuffer = device.createBuffer({
    data: compressed,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const descriptorBuffer = device.createBuffer({
    data: plan.descriptors,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    byteLength: 12,
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
  new GPUSnappyDecompressor({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 3}),
    descriptors: graph.createDataView(descriptorHandle, {format: 'uint32', length: 12}),
    output: graph.createDataView(outputHandle, {format: 'uint32', length: 3}),
    compressedByteLength: plan.compressedByteLength,
    outputByteLength: plan.outputByteLength,
    descriptorCount: plan.descriptorCount
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-snappy-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const result = await outputBuffer.readAsync();
    testCase.equal(
      new TextDecoder().decode(new Uint8Array(result.buffer, result.byteOffset, 10)),
      'abcabcabc!'
    );
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    descriptorBuffer.destroy();
    outputBuffer.destroy();
  }
  testCase.end();
});
