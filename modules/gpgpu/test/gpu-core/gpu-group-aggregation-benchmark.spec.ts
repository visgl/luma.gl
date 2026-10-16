// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUCommandGraph,
  GPUGroupAggregation,
  summarizeGPUWorkgroupScanBenchmarkSamples as summarizeSamples
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, test} from 'vitest';

const ROW_COUNT = 4 * 1024 * 1024;
const GROUP_COUNTS = [1, 16, 256, 4096] as const;
const OPERATIONS = ['sum', 'mean'] as const;
const WARMUP_ITERATIONS = 1;
const MEASURED_ITERATIONS = 7;
const RELATIVE_TOLERANCE = 1e-4;

type BenchmarkOperation = (typeof OPERATIONS)[number];

const FEATURE_LEVELS = ['core', 'max'] as const;

type BenchmarkInput = {keys: Uint32Array; values: Float32Array};
let benchmarkInput: BenchmarkInput | undefined;

// Opt-in evidence, with no timing threshold: shared CI machines cannot establish a speedup.
for (const featureLevel of FEATURE_LEVELS) {
  for (const groupCount of GROUP_COUNTS) {
    for (const operation of OPERATIONS) {
      test(`GPUGroupAggregation ${operation} benchmark, ${groupCount} groups, ${featureLevel}`, async ({
        annotate,
        skip
      }) => {
        const device = await getWebGPUTestDevice(featureLevel);
        if (!device) skip('WebGPU is unavailable');
        const {keys, values} = getBenchmarkInput();
        const groupKeys = keys.map(key => key % groupCount);
        const expectedSums = new Float64Array(groupCount);
        const expectedCounts = new Float64Array(groupCount);
        for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
          expectedSums[groupKeys[rowIndex]] += values[rowIndex];
          expectedCounts[groupKeys[rowIndex]]++;
        }
        const expected = Array.from(expectedSums, (sum, groupIndex) =>
          operation === 'sum' ? sum : sum / expectedCounts[groupIndex]
        );
        const keyBuffer = device.createBuffer({data: groupKeys, usage: Buffer.STORAGE});
        const valueBuffer = device.createBuffer({data: values, usage: Buffer.STORAGE});
        try {
          const result = await measureGroupAggregation(
            device,
            keyBuffer,
            valueBuffer,
            groupCount,
            operation,
            expected
          );
          await annotate(
            JSON.stringify({
              benchmark: 'GPU_GROUP_AGGREGATION_FLOAT',
              rowCount: ROW_COUNT,
              warmupIterations: WARMUP_ITERATIONS,
              measuredIterations: MEASURED_ITERATIONS,
              ...result
            }),
            'benchmark'
          );
        } finally {
          keyBuffer.destroy();
          valueBuffer.destroy();
        }
      }, 300_000);
    }
  }
}

/** Creates one deterministic pseudo-random key and value sequence shared by every case. */
function getBenchmarkInput(): BenchmarkInput {
  if (!benchmarkInput) {
    const keys = new Uint32Array(ROW_COUNT);
    const values = new Float32Array(ROW_COUNT);
    for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex++) {
      keys[rowIndex] = hashUint32(rowIndex * 2);
      values[rowIndex] = (hashUint32(rowIndex * 2 + 1) >>> 8) / 0x1000000;
    }
    benchmarkInput = {keys, values};
  }
  return benchmarkInput;
}

/** Mixes one integer into a well-distributed unsigned 32-bit value. */
function hashUint32(value: number): number {
  let hash = value >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return (hash ^ (hash >>> 16)) >>> 0;
}

async function measureGroupAggregation(
  device: Device,
  keyBuffer: Buffer,
  valueBuffer: Buffer,
  groupCount: number,
  operation: BenchmarkOperation,
  expected: number[]
): Promise<object> {
  const outputBuffer = device.createBuffer({
    byteLength: groupCount * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device);
  const keys = graph.createDataView(
    graph.importBuffer(
      {id: 'keys', byteLength: keyBuffer.byteLength, usage: keyBuffer.usage},
      keyBuffer
    ),
    {format: 'uint32', length: ROW_COUNT}
  );
  const values = graph.createDataView(
    graph.importBuffer(
      {id: 'values', byteLength: valueBuffer.byteLength, usage: valueBuffer.usage},
      valueBuffer
    ),
    {format: 'float32', length: ROW_COUNT}
  );
  const output = graph.createDataView(
    graph.importBuffer(
      {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
      outputBuffer
    ),
    {format: 'float32', length: groupCount}
  );
  graph.add(new GPUGroupAggregation({keys, values, output, operation}));
  const compiled = graph.compile();
  const timestampQueries = device.features.has('timestamp-query');
  const wallSamples: number[] = [];
  const gpuSamples: number[] = [];
  const outputs: Float32Array[] = [];
  try {
    for (let iteration = 0; iteration < WARMUP_ITERATIONS + MEASURED_ITERATIONS; iteration++) {
      const querySet = timestampQueries
        ? device.createQuerySet({type: 'timestamp', count: 64})
        : undefined;
      try {
        const start = performance.now();
        const encoder = device.createCommandEncoder({timeProfilingQuerySet: querySet});
        const encoding = compiled.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const fence = device.createFence();
        await fence.signaled;
        fence.destroy();
        const wallTime = performance.now() - start;
        const timing = await encoding.readTimings();
        if (iteration >= WARMUP_ITERATIONS) {
          wallSamples.push(wallTime);
          if (timing.gpuTimeMilliseconds !== undefined) {
            gpuSamples.push(timing.gpuTimeMilliseconds);
          }
        }
        if (iteration < 2) {
          const bytes = await outputBuffer.readAsync();
          outputs.push(
            new Float32Array(
              bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + groupCount * 4)
            )
          );
        }
      } finally {
        querySet?.destroy();
      }
    }
  } finally {
    compiled.destroy();
    outputBuffer.destroy();
  }

  let maximumRelativeError = 0;
  for (let groupIndex = 0; groupIndex < groupCount; groupIndex++) {
    const relativeError =
      Math.abs(outputs[0][groupIndex] - expected[groupIndex]) /
      Math.max(Math.abs(expected[groupIndex]), 1);
    maximumRelativeError = Math.max(maximumRelativeError, relativeError);
  }
  expect(
    Boolean(maximumRelativeError < RELATIVE_TOLERANCE),
    `${operation} over ${groupCount} groups matches the float64 CPU reference`
  ).toBe(true);
  const firstBits = new Uint32Array(outputs[0].buffer);
  const secondBits = new Uint32Array(outputs[1].buffer);
  return {
    device:
      `${device.info.vendor} ${device.info.gpuArchitecture ?? device.info.gpu} ${device.info.gpuBackend ?? ''}`.trim(),
    featureLevel: device.info.featureLevel,
    subgroups: device.features.has('subgroups'),
    operation,
    groupCount,
    maximumRelativeError,
    bitwiseDeterministic: firstBits.every((bits, index) => bits === secondBits[index]),
    wallMilliseconds: summarizeSamples(wallSamples),
    ...(gpuSamples.length ? {gpuMilliseconds: summarizeSamples(gpuSamples)} : {})
  };
}
