// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUParquetByteStreamSplitDecoder} from '@luma.gl/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('GPUParquetByteStreamSplitDecoder restores fixed-width physical bytes', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  for (const fixture of [
    makeFixture(7, 4),
    makeFixture(5, 8),
    makeFixture(5, 3),
    makeFixture(257, 8)
  ]) {
    const decoded = await decodeByteStreamSplit(
      device,
      fixture.encoded,
      fixture.valueCount,
      fixture.byteWidth
    );
    testCase.deepEqual(
      Array.from(decoded),
      Array.from(fixture.decoded),
      `${fixture.valueCount} values with byte width ${fixture.byteWidth}`
    );
  }
  testCase.end();
});

type ByteStreamSplitFixture = {
  valueCount: number;
  byteWidth: number;
  decoded: Uint8Array;
  encoded: Uint8Array;
};

function makeFixture(valueCount: number, byteWidth: number): ByteStreamSplitFixture {
  const decoded = Uint8Array.from(
    {length: valueCount * byteWidth},
    (_, index) => (index * 67 + Math.floor(index / byteWidth) * 13 + 29) & 255
  );
  const encoded = new Uint8Array(decoded.length);
  for (let valueIndex = 0; valueIndex < valueCount; valueIndex++) {
    for (let byteIndex = 0; byteIndex < byteWidth; byteIndex++) {
      encoded[byteIndex * valueCount + valueIndex] = decoded[valueIndex * byteWidth + byteIndex];
    }
  }
  return {valueCount, byteWidth, decoded, encoded};
}

async function decodeByteStreamSplit(
  device: Device,
  encoded: Uint8Array,
  valueCount: number,
  byteWidth: number
): Promise<Uint8Array> {
  const wordCount = Math.ceil(encoded.byteLength / Uint32Array.BYTES_PER_ELEMENT);
  const paddedInput = new Uint8Array(Math.max(wordCount, 1) * Uint32Array.BYTES_PER_ELEMENT);
  paddedInput.set(encoded);
  const inputBuffer = device.createBuffer({
    data: paddedInput,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    byteLength: paddedInput.byteLength,
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
  const input = graph.createDataView(inputHandle, {format: 'uint32', length: wordCount});
  const output = graph.createDataView(outputHandle, {format: 'uint32', length: wordCount});
  new GPUParquetByteStreamSplitDecoder({
    input,
    output,
    valueCount,
    byteWidth
  }).addToGraph(graph);
  const compiled = graph.compile();

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-byte-stream-split-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const result = await outputBuffer.readAsync();
    return new Uint8Array(result.buffer, result.byteOffset, encoded.byteLength);
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    outputBuffer.destroy();
  }
}
