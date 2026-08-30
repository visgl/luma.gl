// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GPUParquetDeltaBinaryPackedDecoder,
  parseParquetDeltaBinaryPackedPlan
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

const ENCODED = Uint8Array.from([
  128, 1, 4, 5, 20, 1, 3, 255, 254, 253, 35, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);

test('GPUParquetDeltaBinaryPackedDecoder reconstructs signed INT32 bit patterns', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const plan = parseParquetDeltaBinaryPackedPlan(ENCODED);
  const paddedEncoded = new Uint8Array(24);
  paddedEncoded.set(ENCODED);
  const inputBuffer = device.createBuffer({
    data: paddedEncoded,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const descriptorBuffer = device.createBuffer({
    data: plan.miniBlockDescriptors,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    byteLength: 20,
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
  new GPUParquetDeltaBinaryPackedDecoder({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 6}),
    miniBlockDescriptors: graph.createDataView(descriptorHandle, {format: 'uint32', length: 5}),
    output: graph.createDataView(outputHandle, {format: 'uint32', length: 5}),
    encodedByteLength: plan.bytesConsumed,
    valueCount: plan.valueCount,
    descriptorCount: plan.descriptorCount,
    firstValue: plan.firstValue
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-delta-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const result = await outputBuffer.readAsync();
    testCase.deepEqual(
      Array.from(new Int32Array(result.buffer, result.byteOffset, 5)),
      [10, 12, 15, 14, 18]
    );
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    descriptorBuffer.destroy();
    outputBuffer.destroy();
  }
  testCase.end();
});
