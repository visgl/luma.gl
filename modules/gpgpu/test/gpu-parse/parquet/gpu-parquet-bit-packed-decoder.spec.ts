// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUParquetBitPackedDecoder, parseParquetBitPackedRunPlan} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('GPUParquetBitPackedDecoder decodes deprecated MSB-first values', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const encoded = Uint8Array.from([0x05, 0x39, 0x77, 0]);
  const plan = parseParquetBitPackedRunPlan(encoded, 3, 8);
  const inputBuffer = device.createBuffer({data: encoded, usage: Buffer.STORAGE | Buffer.COPY_DST});
  const outputBuffer = device.createBuffer({
    byteLength: 8 * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device);
  const inputHandle = graph.importBuffer(
    {id: 'input', byteLength: inputBuffer.byteLength, usage: inputBuffer.usage},
    inputBuffer
  );
  const outputHandle = graph.importBuffer(
    {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
    outputBuffer
  );
  new GPUParquetBitPackedDecoder({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 1}),
    output: graph.createDataView(outputHandle, {format: 'uint32', length: 8}),
    encodedByteLength: plan.bytesConsumed,
    valueCount: plan.valueCount,
    bitWidth: plan.bitWidth
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-bit-packed-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const result = await outputBuffer.readAsync();
    testCase.deepEqual(
      Array.from(new Uint32Array(result.buffer, result.byteOffset, 8)),
      [0, 1, 2, 3, 4, 5, 6, 7]
    );
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    outputBuffer.destroy();
  }
  testCase.end();
});
