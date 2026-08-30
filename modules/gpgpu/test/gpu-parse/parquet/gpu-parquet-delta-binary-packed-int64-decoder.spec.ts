// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GPUParquetDeltaBinaryPackedInt64Decoder,
  parseParquetDeltaBinaryPackedInt64Plan
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('GPUParquetDeltaBinaryPackedInt64Decoder reconstructs signed INT64 values', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const encoded = Uint8Array.from([
    128, 1, 4, 3, 128, 128, 128, 128, 32, 5, 3, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]);
  const plan = parseParquetDeltaBinaryPackedInt64Plan(encoded.subarray(0, 26));
  const inputBuffer = device.createBuffer({data: encoded, usage: Buffer.STORAGE | Buffer.COPY_DST});
  const descriptorBuffer = device.createBuffer({
    data: plan.miniBlockDescriptors,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputLowBuffer = device.createBuffer({
    byteLength: 12,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const outputHighBuffer = device.createBuffer({
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
  const lowHandle = graph.importBuffer(
    {id: 'low', byteLength: 12, usage: outputLowBuffer.usage},
    outputLowBuffer
  );
  const highHandle = graph.importBuffer(
    {id: 'high', byteLength: 12, usage: outputHighBuffer.usage},
    outputHighBuffer
  );
  new GPUParquetDeltaBinaryPackedInt64Decoder({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 7}),
    miniBlockDescriptors: graph.createDataView(descriptorHandle, {format: 'uint32', length: 6}),
    outputLow: graph.createDataView(lowHandle, {format: 'uint32', length: 3}),
    outputHigh: graph.createDataView(highHandle, {format: 'uint32', length: 3}),
    encodedByteLength: plan.bytesConsumed,
    valueCount: plan.valueCount,
    descriptorCount: plan.descriptorCount,
    firstValueLow: plan.firstValueLow,
    firstValueHigh: plan.firstValueHigh
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-int64-delta-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const [lowResult, highResult] = await Promise.all([
      outputLowBuffer.readAsync(),
      outputHighBuffer.readAsync()
    ]);
    testCase.deepEqual(
      Array.from(new Uint32Array(lowResult.buffer, lowResult.byteOffset, 3)),
      [0, 2, 0xffffffff]
    );
    testCase.deepEqual(
      Array.from(new Uint32Array(highResult.buffer, highResult.byteOffset, 3)),
      [1, 1, 0]
    );
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    descriptorBuffer.destroy();
    outputLowBuffer.destroy();
    outputHighBuffer.destroy();
  }
  testCase.end();
});
