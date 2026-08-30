// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUParquetPlainBooleanDecoder} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('GPUParquetPlainBooleanDecoder expands booleans across word boundaries', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const expected = Array.from({length: 40}, (_, valueIndex) =>
    valueIndex % 3 === 0 || valueIndex === 31 || valueIndex === 32 ? 1 : 0
  );
  const packed = new Uint32Array(2);
  for (let valueIndex = 0; valueIndex < expected.length; valueIndex++) {
    packed[Math.floor(valueIndex / 32)] |= expected[valueIndex] << (valueIndex % 32);
  }
  const inputBuffer = device.createBuffer({data: packed, usage: Buffer.STORAGE | Buffer.COPY_DST});
  const outputBuffer = device.createBuffer({
    byteLength: expected.length * Uint32Array.BYTES_PER_ELEMENT,
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
  new GPUParquetPlainBooleanDecoder({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 2}),
    output: graph.createDataView(outputHandle, {format: 'uint32', length: expected.length}),
    valueCount: expected.length
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-plain-boolean-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const result = await outputBuffer.readAsync();
    testCase.deepEqual(
      Array.from(new Uint32Array(result.buffer, result.byteOffset, expected.length)),
      expected
    );
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    outputBuffer.destroy();
  }
  testCase.end();
});
