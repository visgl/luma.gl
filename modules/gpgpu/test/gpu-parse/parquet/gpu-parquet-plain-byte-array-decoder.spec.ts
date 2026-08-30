// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {
  GPUParquetPlainByteArrayDecoder,
  parseParquetPlainByteArrayPlan
} from '@luma.gl/gpgpu/gpu-parse';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

const ENCODED = Uint8Array.from([
  0, 0, 0, 0, 3, 0, 0, 0, 99, 97, 116, 1, 0, 0, 0, 100, 5, 0, 0, 0, 104, 111, 114, 115, 101
]);

test('GPUParquetPlainByteArrayDecoder gathers variable values contiguously', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const plan = parseParquetPlainByteArrayPlan(ENCODED, 4);
  const padded = new Uint8Array(28);
  padded.set(ENCODED);
  const buffers = [
    device.createBuffer({data: padded, usage: Buffer.STORAGE | Buffer.COPY_DST}),
    device.createBuffer({data: plan.sourceOffsets, usage: Buffer.STORAGE | Buffer.COPY_DST}),
    device.createBuffer({data: plan.valueLengths, usage: Buffer.STORAGE | Buffer.COPY_DST}),
    device.createBuffer({data: plan.valueOffsets, usage: Buffer.STORAGE | Buffer.COPY_DST}),
    device.createBuffer({byteLength: 12, usage: Buffer.STORAGE | Buffer.COPY_SRC})
  ];
  const graph = new GPUCommandGraph(device);
  const view = (index: number, id: string, length: number) => {
    const buffer = buffers[index];
    const handle = graph.importBuffer(
      {id, byteLength: buffer.byteLength, usage: buffer.usage},
      buffer
    );
    return graph.createDataView(handle, {format: 'uint32', length});
  };
  new GPUParquetPlainByteArrayDecoder({
    input: view(0, 'input', 7),
    sourceOffsets: view(1, 'sources', 4),
    valueLengths: view(2, 'lengths', 4),
    valueOffsets: view(3, 'offsets', 4),
    output: view(4, 'output', 3),
    encodedByteLength: ENCODED.length,
    outputByteLength: plan.outputByteLength
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-plain-byte-array-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const result = await buffers[4].readAsync();
    testCase.equal(
      new TextDecoder().decode(result.subarray(0, plan.outputByteLength)),
      'catdhorse'
    );
  } finally {
    compiled.destroy();
    for (const buffer of buffers) buffer.destroy();
  }
  testCase.end();
});
