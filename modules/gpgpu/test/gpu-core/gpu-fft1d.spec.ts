// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  getGPUFFT1DSupport,
  GPUCommandGraph,
  GPUFFT1D,
  runGPUFFT1DBenchmark,
  type GPUFFT1DStrategy
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('GPUFFT1D matches a CPU DFT for independent packed batches', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const length = 8;
  const batchCount = 3;
  const inputValues = makeComplexInput(length, batchCount);
  const expectedValues: number[] = [];
  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    expectedValues.push(
      ...makeCPUDFT1D(
        inputValues.subarray(batchIndex * length * 2, (batchIndex + 1) * length * 2),
        'forward'
      )
    );
  }
  const result = await runGPUFFT1D(device, inputValues, length, batchCount, 'portable');
  assertClose(testCase, result.forward, expectedValues, 0.0005, 'batched forward transform');
  assertClose(
    testCase,
    result.inverse,
    Array.from(inputValues),
    0.0005,
    'batched inverse round trip'
  );
  testCase.equal(
    result.logicalTransientBufferCount,
    2,
    'each transform declares inspectable scratch'
  );
  testCase.equal(
    result.physicalTransientBufferCount,
    1,
    'disjoint forward and inverse scratch lifetimes alias physically'
  );
  testCase.end();
});

test('GPUFFT1D benchmark correctness-gates available strategies', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const report = await runGPUFFT1DBenchmark(device, {
    length: 16,
    batchCount: 3,
    warmupIterations: 1,
    measuredIterations: 2
  });
  testCase.equal(report.length, 16);
  testCase.equal(report.batchCount, 3);
  testCase.equal(report.passCount, 5);
  testCase.equal(report.paths[0].strategy, 'portable');
  testCase.equal(report.paths.length, report.subgroupAvailable ? 2 : 1);
  testCase.ok(
    report.paths.every(path => Number.isFinite(path.cpuEncodeTimeMilliseconds.median)),
    'each available path reports a finite timing distribution'
  );
  testCase.end();
});

test('GPUFFT1D auto strategy preserves portable numerical results', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }
  const length = 32;
  const batchCount = 5;
  const inputValues = makeComplexInput(length, batchCount);
  const portable = await runGPUFFT1D(device, inputValues, length, batchCount, 'portable');
  const automatic = await runGPUFFT1D(device, inputValues, length, batchCount, 'auto');
  assertClose(
    testCase,
    automatic.forward,
    portable.forward,
    0.0005,
    'automatic subgroup selection matches portable output'
  );
  const support = getGPUFFT1DSupport(device, {length, batchCount});
  testCase.ok(
    support.strategy === 'portable' || support.subgroupStageCount! > 0,
    'support exposes whether subgroup butterflies were eligible'
  );
  testCase.end();
});

async function runGPUFFT1D(
  device: Device,
  inputValues: Float32Array,
  length: number,
  batchCount: number,
  strategy: GPUFFT1DStrategy
): Promise<{
  forward: number[];
  inverse: number[];
  logicalTransientBufferCount: number;
  physicalTransientBufferCount: number;
}> {
  const inputBuffer = device.createBuffer({
    data: inputValues,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const forwardBuffer = device.createBuffer({
    byteLength: inputValues.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const inverseBuffer = device.createBuffer({
    byteLength: inputValues.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device);
  const input = importComplexView(graph, 'input', inputBuffer, inputValues.length / 2);
  const forward = importComplexView(graph, 'forward', forwardBuffer, inputValues.length / 2);
  const inverse = importComplexView(graph, 'inverse', inverseBuffer, inputValues.length / 2);
  new GPUFFT1D({
    id: 'forward',
    input,
    output: forward,
    length,
    batchCount,
    direction: 'forward',
    strategy
  }).addToGraph(graph);
  new GPUFFT1D({
    id: 'inverse',
    input: forward,
    output: inverse,
    length,
    batchCount,
    direction: 'inverse',
    strategy
  }).addToGraph(graph);
  const compiled = graph.compile();
  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-fft1d-roundtrip'});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    return {
      forward: await readFloat32(forwardBuffer, inputValues.length),
      inverse: await readFloat32(inverseBuffer, inputValues.length),
      logicalTransientBufferCount: compiled.stats.logicalTransientBufferCount,
      physicalTransientBufferCount: compiled.stats.physicalTransientBufferCount
    };
  } finally {
    compiled.destroy();
    inputBuffer.destroy();
    forwardBuffer.destroy();
    inverseBuffer.destroy();
  }
}

function importComplexView(graph: GPUCommandGraph, id: string, buffer: Buffer, length: number) {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format: 'float32x2', length});
}

function makeComplexInput(length: number, batchCount: number): Float32Array {
  return Float32Array.from({length: length * batchCount * 2}, (_, componentIndex) => {
    const complexIndex = Math.floor(componentIndex / 2);
    const batchIndex = Math.floor(complexIndex / length);
    const coordinate = complexIndex % length;
    return componentIndex % 2 === 0
      ? Math.sin((coordinate + 1) * 0.37) * (batchIndex + 1)
      : Math.cos((coordinate + batchIndex + 1) * 0.19) * 0.25;
  });
}

function makeCPUDFT1D(input: Float32Array, direction: 'forward' | 'inverse'): number[] {
  const length = input.length / 2;
  const output = new Array<number>(input.length).fill(0);
  const directionSign = direction === 'forward' ? -1 : 1;
  const normalizationScale = direction === 'inverse' ? 1 / length : 1;
  for (let outputCoordinate = 0; outputCoordinate < length; outputCoordinate++) {
    let real = 0;
    let imaginary = 0;
    for (let inputCoordinate = 0; inputCoordinate < length; inputCoordinate++) {
      const angle = (directionSign * 2 * Math.PI * outputCoordinate * inputCoordinate) / length;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const inputReal = input[inputCoordinate * 2];
      const inputImaginary = input[inputCoordinate * 2 + 1];
      real += inputReal * cosine - inputImaginary * sine;
      imaginary += inputReal * sine + inputImaginary * cosine;
    }
    output[outputCoordinate * 2] = real * normalizationScale;
    output[outputCoordinate * 2 + 1] = imaginary * normalizationScale;
  }
  return output;
}

async function readFloat32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
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
      `${label} component ${index}: ${actual[index]} ~= ${expected[index]}`
    );
  }
}
