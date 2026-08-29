// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUParquetRleBitPackedDecoder, parseParquetRleBitPackedRunPlan} from '@luma.gl/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('GPUParquetRleBitPackedDecoder expands mixed RLE and bit-packed runs', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const encoded = Uint8Array.from([6, 5, 3, 0x88, 0xc6, 0xfa, 0, 0]);
  const plan = parseParquetRleBitPackedRunPlan(encoded, 3, 8);
  const inputBuffer = device.createBuffer({data: encoded, usage: Buffer.STORAGE | Buffer.COPY_DST});
  const descriptorBuffer = device.createBuffer({
    data: plan.runDescriptors,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    byteLength: 8 * Uint32Array.BYTES_PER_ELEMENT,
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
  new GPUParquetRleBitPackedDecoder({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 2}),
    runDescriptors: graph.createDataView(descriptorHandle, {format: 'uint32', length: 8}),
    output: graph.createDataView(outputHandle, {format: 'uint32', length: 8}),
    encodedByteLength: plan.bytesConsumed,
    valueCount: 8,
    runCount: plan.runCount,
    bitWidth: 3
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-hybrid-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const result = await outputBuffer.readAsync();
    testCase.deepEqual(
      Array.from(new Uint32Array(result.buffer, result.byteOffset, 8)),
      [5, 5, 5, 0, 1, 2, 3, 4]
    );
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    descriptorBuffer.destroy();
    outputBuffer.destroy();
  }
  testCase.end();
});
