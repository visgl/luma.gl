// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUConvolution,
  runGPUConvolutionBenchmark,
  type GPUConvolutionBoundary,
  type GPUConvolutionStrategy
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('GPUConvolution direct path matches CPU convolution for zero and wrap boundaries', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const width = 7;
  const height = 5;
  const kernelWidth = 3;
  const kernelHeight = 3;
  const input = makeInput(width, height);
  const kernel = new Float32Array([0.05, 0.1, 0.15, -0.2, 0.4, 0.25, 0.05, -0.1, 0.3]);
  for (const boundary of ['zero', 'wrap'] as const) {
    const result = await runGPUConvolution(
      device,
      input,
      kernel,
      width,
      height,
      kernelWidth,
      kernelHeight,
      'direct',
      boundary
    );
    const expected = makeCPUConvolution(
      input,
      kernel,
      width,
      height,
      kernelWidth,
      kernelHeight,
      boundary
    );
    assertClose(testCase, result.values, expected, 0.00001, `direct ${boundary}`);
    testCase.equal(result.logicalTransientBufferCount, 0, `${boundary} direct path has no scratch`);
  }
  testCase.end();
});

test('GPUConvolution FFT path agrees with direct and CPU results', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  for (const dimensions of [
    {width: 7, height: 5, boundary: 'zero' as const},
    {width: 8, height: 8, boundary: 'wrap' as const}
  ]) {
    const kernelWidth = 5;
    const kernelHeight = 3;
    const input = makeInput(dimensions.width, dimensions.height);
    const kernel = Float32Array.from(
      {length: kernelWidth * kernelHeight},
      (_, index) => (((index * 7) % 13) - 4) / 17
    );
    const direct = await runGPUConvolution(
      device,
      input,
      kernel,
      dimensions.width,
      dimensions.height,
      kernelWidth,
      kernelHeight,
      'direct',
      dimensions.boundary
    );
    const fft = await runGPUConvolution(
      device,
      input,
      kernel,
      dimensions.width,
      dimensions.height,
      kernelWidth,
      kernelHeight,
      'fft',
      dimensions.boundary
    );
    const expected = makeCPUConvolution(
      input,
      kernel,
      dimensions.width,
      dimensions.height,
      kernelWidth,
      kernelHeight,
      dimensions.boundary
    );
    assertClose(testCase, fft.values, direct.values, 0.001, `FFT/direct ${dimensions.boundary}`);
    assertClose(testCase, fft.values, expected, 0.001, `FFT/CPU ${dimensions.boundary}`);
    testCase.equal(fft.logicalTransientBufferCount, 9, 'FFT scratch is explicit in graph stats');
    testCase.ok(
      fft.physicalTransientBufferCount < fft.logicalTransientBufferCount,
      'non-overlapping FFT fields alias physical scratch'
    );
  }
  testCase.end();
});

test('GPUConvolution benchmark compares available direct and FFT paths', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const report = await runGPUConvolutionBenchmark(device, {
    width: 16,
    height: 16,
    cases: [
      {kernelWidth: 3, kernelHeight: 3},
      {kernelWidth: 11, kernelHeight: 11}
    ],
    warmupIterations: 1,
    measuredIterations: 2
  });
  testCase.equal(report.cases.length, 2);
  testCase.deepEqual(
    report.cases.map(benchmarkCase => benchmarkCase.paths.map(path => path.strategy)),
    [
      ['direct', 'fft'],
      ['direct', 'fft']
    ]
  );
  testCase.ok(
    report.cases.every(benchmarkCase =>
      benchmarkCase.paths.every(path => Number.isFinite(path.cpuEncodeTimeMilliseconds.median))
    ),
    'each strategy reports a finite timing distribution'
  );
  testCase.end();
});

async function runGPUConvolution(
  device: Device,
  inputValues: Float32Array,
  kernelValues: Float32Array,
  width: number,
  height: number,
  kernelWidth: number,
  kernelHeight: number,
  strategy: GPUConvolutionStrategy,
  boundary: GPUConvolutionBoundary
): Promise<{
  values: number[];
  logicalTransientBufferCount: number;
  physicalTransientBufferCount: number;
}> {
  const inputBuffer = device.createBuffer({data: inputValues, usage: Buffer.STORAGE});
  const kernelBuffer = device.createBuffer({data: kernelValues, usage: Buffer.STORAGE});
  const outputBuffer = device.createBuffer({
    byteLength: inputValues.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device);
  const input = importFloatView(graph, 'input', inputBuffer, inputValues.length);
  const kernel = importFloatView(graph, 'kernel', kernelBuffer, kernelValues.length);
  const output = importFloatView(graph, 'output', outputBuffer, inputValues.length);
  new GPUConvolution({
    input,
    kernel,
    output,
    width,
    height,
    kernelWidth,
    kernelHeight,
    strategy,
    boundary
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: `gpu-convolution-${strategy}`});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const bytes = await outputBuffer.readAsync();
    return {
      values: Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, inputValues.length)),
      logicalTransientBufferCount: compiled.stats.logicalTransientBufferCount,
      physicalTransientBufferCount: compiled.stats.physicalTransientBufferCount
    };
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    kernelBuffer.destroy();
    outputBuffer.destroy();
  }
}

function importFloatView(graph: GPUCommandGraph, id: string, buffer: Buffer, length: number) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format: 'float32', length});
}

function makeInput(width: number, height: number): Float32Array {
  return Float32Array.from({length: width * height}, (_, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    return Math.sin((x + 1) * 0.37) + Math.cos((y + 2) * 0.23) + ((x * y) % 5) * 0.1;
  });
}

function makeCPUConvolution(
  input: Float32Array,
  kernel: Float32Array,
  width: number,
  height: number,
  kernelWidth: number,
  kernelHeight: number,
  boundary: GPUConvolutionBoundary
): number[] {
  const output = new Array<number>(width * height).fill(0);
  const centerX = Math.floor(kernelWidth / 2);
  const centerY = Math.floor(kernelHeight / 2);
  for (let outputY = 0; outputY < height; outputY++) {
    for (let outputX = 0; outputX < width; outputX++) {
      let total = 0;
      for (let kernelY = 0; kernelY < kernelHeight; kernelY++) {
        for (let kernelX = 0; kernelX < kernelWidth; kernelX++) {
          let sourceX = outputX - (kernelX - centerX);
          let sourceY = outputY - (kernelY - centerY);
          if (boundary === 'wrap') {
            sourceX = ((sourceX % width) + width) % width;
            sourceY = ((sourceY % height) + height) % height;
          } else if (sourceX < 0 || sourceX >= width || sourceY < 0 || sourceY >= height) {
            continue;
          }
          total += input[sourceY * width + sourceX] * kernel[kernelY * kernelWidth + kernelX];
        }
      }
      output[outputY * width + outputX] = total;
    }
  }
  return output;
}

function assertClose(
  testCase: {ok: (value: unknown, message?: string) => void},
  actual: readonly number[],
  expected: readonly number[],
  tolerance: number,
  label: string
): void {
  testCase.ok(actual.length === expected.length, `${label} length matches`);
  for (let index = 0; index < actual.length; index++) {
    testCase.ok(
      Math.abs(actual[index] - expected[index]) <= tolerance,
      `${label} value ${index}: ${actual[index]} ~= ${expected[index]}`
    );
  }
}
