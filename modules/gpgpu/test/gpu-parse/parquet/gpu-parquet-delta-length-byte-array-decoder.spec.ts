// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GPUParquetDeltaLengthByteArrayDecoder,
  parseParquetDeltaLengthByteArrayPlan
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

const ENCODED = Uint8Array.from([
  128, 1, 4, 3, 6, 3, 3, 0, 0, 0, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99, 97, 116, 100, 111, 103,
  115, 101
]);

test('GPUParquetDeltaLengthByteArrayDecoder produces lengths and offsets', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const plan = parseParquetDeltaLengthByteArrayPlan(ENCODED);
  const paddedEncoded = new Uint8Array(32);
  paddedEncoded.set(ENCODED);
  const inputBuffer = device.createBuffer({
    data: paddedEncoded,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const descriptorBuffer = device.createBuffer({
    data: plan.lengthPlan.miniBlockDescriptors,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const lengthsBuffer = device.createBuffer({
    byteLength: 12,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const offsetsBuffer = device.createBuffer({
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
  const lengthsHandle = graph.importBuffer(
    {id: 'lengths', byteLength: lengthsBuffer.byteLength, usage: lengthsBuffer.usage},
    lengthsBuffer
  );
  const offsetsHandle = graph.importBuffer(
    {id: 'offsets', byteLength: offsetsBuffer.byteLength, usage: offsetsBuffer.usage},
    offsetsBuffer
  );
  new GPUParquetDeltaLengthByteArrayDecoder({
    input: graph.createDataView(inputHandle, {format: 'uint32', length: 8}),
    miniBlockDescriptors: graph.createDataView(descriptorHandle, {
      format: 'uint32',
      length: plan.lengthPlan.miniBlockDescriptors.length
    }),
    lengths: graph.createDataView(lengthsHandle, {format: 'uint32', length: 3}),
    offsets: graph.createDataView(offsetsHandle, {format: 'uint32', length: 3}),
    encodedByteLength: plan.lengthPlan.bytesConsumed,
    valueCount: plan.lengthPlan.valueCount,
    descriptorCount: plan.lengthPlan.descriptorCount,
    firstValue: plan.lengthPlan.firstValue
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-delta-length-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const lengths = await lengthsBuffer.readAsync();
    const offsets = await offsetsBuffer.readAsync();
    testCase.deepEqual(
      Array.from(new Uint32Array(lengths.buffer, lengths.byteOffset, plan.lengthPlan.valueCount)),
      [3, 1, 4]
    );
    testCase.deepEqual(
      Array.from(new Uint32Array(offsets.buffer, offsets.byteOffset, plan.lengthPlan.valueCount)),
      [0, 3, 4]
    );
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    descriptorBuffer.destroy();
    lengthsBuffer.destroy();
    offsetsBuffer.destroy();
  }
  testCase.end();
});
