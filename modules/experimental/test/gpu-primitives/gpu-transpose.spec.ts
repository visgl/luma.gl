// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUTranspose,
  runGPUTransposeBenchmark,
  type GPUTransposeFormat
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('GPUTranspose transposes square, rectangular, and partial tiles', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  testCase.deepEqual(
    await runTranspose(device, Uint32Array.from([1]), 'uint32', 1, 1),
    [1],
    'one-element uint32 matrix'
  );
  testCase.deepEqual(
    await runTranspose(device, Int32Array.from([1, -2, 3, -4, 5, -6]), 'sint32', 2, 3),
    [1, -4, -2, 5, 3, -6],
    'rectangular sint32 matrix'
  );
  const rows = 17;
  const columns = 35;
  const values = Float32Array.from({length: rows * columns}, (_, index) => index * 0.25 - 13);
  testCase.deepEqual(
    await runTranspose(device, values, 'float32', rows, columns),
    makeCPUTranspose(values, rows, columns),
    'float32 partial edge tiles'
  );
  testCase.end();
});

test('runGPUTransposeBenchmark compares correctness-gated tiled and reference paths', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const report = await runGPUTransposeBenchmark(device, {
    rows: 17,
    columns: 19,
    warmupIterations: 1,
    measuredIterations: 2
  });
  t.equal(report.elementCount, 323, 'report preserves rectangular dimensions');
  t.deepEqual(
    report.paths.map(path => path.strategy),
    ['tiled', 'reference'],
    'both implementations are measured'
  );
  t.ok(
    report.paths.every(path => path.cpuEncodeTimeMilliseconds.minimum >= 0),
    'every path reports finite encoding timings'
  );
  t.end();
});

type ScalarArray = Uint32Array | Int32Array | Float32Array;

async function runTranspose(
  device: Device,
  values: ScalarArray,
  format: GPUTransposeFormat,
  rows: number,
  columns: number
): Promise<number[]> {
  const inputBuffer = device.createBuffer({
    data: values,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    byteLength: values.byteLength,
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
  const input = graph.createDataView(inputHandle, {format, length: values.length});
  const output = graph.createDataView(outputHandle, {format, length: values.length});
  new GPUTranspose({input, output, rows, columns}).addToGraph(graph);
  const compiled = graph.compile();

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-transpose-test'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const bytes = await outputBuffer.readAsync();
    const ResultArray =
      format === 'uint32' ? Uint32Array : format === 'sint32' ? Int32Array : Float32Array;
    return Array.from(new ResultArray(bytes.buffer, bytes.byteOffset, values.length));
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    outputBuffer.destroy();
  }
}

function makeCPUTranspose(values: ScalarArray, rows: number, columns: number): number[] {
  const output = new Array<number>(values.length);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      output[column * rows + row] = values[row * columns + column];
    }
  }
  return output;
}
