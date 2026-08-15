// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {type CompiledGPUCommandGraph, GPUCommandGraph} from './gpu-command-graph';
import {getGPUFFT1DSupport, GPUFFT1D, makeGPUFFT1DStats, type GPUFFT1DStrategy} from './gpu-fft1d';
import {
  summarizeGPUWorkgroupScanBenchmarkSamples,
  type GPUWorkgroupScanBenchmarkDistribution
} from './gpu-workgroup-scan-benchmark';

const DEFAULT_LENGTH = 1024;
const DEFAULT_BATCH_COUNT = 64;
const DEFAULT_WARMUP_ITERATIONS = 3;
const DEFAULT_MEASURED_ITERATIONS = 20;

/** FFT strategy measured by {@link runGPUFFT1DBenchmark}. */
export type GPUFFT1DBenchmarkStrategy = Exclude<GPUFFT1DStrategy, 'auto'>;

/** Options for the correctness-gated batched FFT benchmark. */
export type GPUFFT1DBenchmarkProps = {
  id?: string;
  length?: number;
  batchCount?: number;
  warmupIterations?: number;
  measuredIterations?: number;
};

/** Timing distribution for one batched FFT strategy. */
export type GPUFFT1DBenchmarkPathReport = {
  strategy: GPUFFT1DBenchmarkStrategy;
  cpuEncodeTimeMilliseconds: GPUWorkgroupScanBenchmarkDistribution;
  gpuTimeMilliseconds?: GPUWorkgroupScanBenchmarkDistribution;
};

/** Reproducible dimensions and timing distributions for an FFT strategy comparison. */
export type GPUFFT1DBenchmarkReport = {
  id: string;
  length: number;
  batchCount: number;
  elementCount: number;
  passCount: number;
  warmupIterations: number;
  measuredIterations: number;
  timestampQueries: boolean;
  subgroupAvailable: boolean;
  paths: GPUFFT1DBenchmarkPathReport[];
};

type BenchmarkPath = {
  strategy: GPUFFT1DBenchmarkStrategy;
  outputBuffer: Buffer;
  compiled: CompiledGPUCommandGraph<void>;
};

type BenchmarkSamples = {cpu: number[]; gpu: number[]};

/**
 * Compares the portable FFT with the optional subgroup path when supported by the device.
 *
 * A batched impulse input provides an exact, cheap correctness oracle. Readback is confined to
 * this benchmark helper; {@link GPUFFT1D} itself remains graph-native and synchronization-free.
 */
export async function runGPUFFT1DBenchmark(
  device: Device,
  props: GPUFFT1DBenchmarkProps = {}
): Promise<GPUFFT1DBenchmarkReport> {
  const id = props.id ?? 'gpu-fft1d-benchmark';
  const length = props.length ?? DEFAULT_LENGTH;
  const batchCount = props.batchCount ?? DEFAULT_BATCH_COUNT;
  const warmupIterations = props.warmupIterations ?? DEFAULT_WARMUP_ITERATIONS;
  const measuredIterations = props.measuredIterations ?? DEFAULT_MEASURED_ITERATIONS;
  const stats = makeGPUFFT1DStats(length, batchCount);
  validateGPUFFT1DBenchmarkProps(
    device,
    stats.complexBufferByteLength,
    warmupIterations,
    measuredIterations
  );

  const inputValues = new Float32Array(stats.elementCount * 2);
  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    inputValues[batchIndex * length * 2] = 1;
  }
  const inputBuffer = device.createBuffer({
    id: `${id}-input`,
    data: inputValues,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const subgroupAvailable = getGPUFFT1DSupport(device, {
    length,
    batchCount,
    strategy: 'subgroups'
  }).supported;
  const strategies: GPUFFT1DBenchmarkStrategy[] = subgroupAvailable
    ? ['portable', 'subgroups']
    : ['portable'];
  const samples = new Map<GPUFFT1DBenchmarkStrategy, BenchmarkSamples>(
    strategies.map(strategy => [strategy, {cpu: [], gpu: []}])
  );
  const paths: BenchmarkPath[] = [];
  const timestampQueries = device.features.has('timestamp-query');

  try {
    for (const strategy of strategies) {
      paths.push(makeGPUFFT1DBenchmarkPath(device, id, inputBuffer, length, batchCount, strategy));
    }
    for (const path of paths) {
      for (let iteration = 0; iteration < warmupIterations; iteration++) {
        encodeAndSubmitGPUFFT1DBenchmark(
          device,
          path,
          `${id}-${path.strategy}-warmup-${iteration}`
        );
      }
      await validateGPUFFT1DBenchmarkPath(path, stats.elementCount, id);
    }

    for (let iteration = 0; iteration < measuredIterations; iteration++) {
      const orderedPaths = iteration % 2 === 0 ? paths : [...paths].reverse();
      for (const path of orderedPaths) {
        const querySet = timestampQueries
          ? device.createQuerySet({
              id: `${id}-${path.strategy}-timestamps-${iteration}`,
              type: 'timestamp',
              count: stats.passCount * 2
            })
          : undefined;
        const commandEncoder = device.createCommandEncoder({
          id: `${id}-${path.strategy}-measured-${iteration}`,
          timeProfilingQuerySet: querySet
        });
        try {
          const encoding = path.compiled.encode(commandEncoder, {parameters: undefined});
          device.submit(commandEncoder.finish());
          const timing = await encoding.readTimings();
          const pathSamples = samples.get(path.strategy)!;
          pathSamples.cpu.push(timing.cpuEncodeTimeMilliseconds);
          if (timing.gpuTimeMilliseconds !== undefined) {
            pathSamples.gpu.push(timing.gpuTimeMilliseconds);
          }
        } catch (error) {
          commandEncoder.destroy();
          throw error;
        } finally {
          querySet?.destroy();
        }
      }
    }

    return {
      id,
      length,
      batchCount,
      elementCount: stats.elementCount,
      passCount: stats.passCount,
      warmupIterations,
      measuredIterations,
      timestampQueries,
      subgroupAvailable,
      paths: paths.map(path => {
        const pathSamples = samples.get(path.strategy)!;
        return {
          strategy: path.strategy,
          cpuEncodeTimeMilliseconds: summarizeGPUWorkgroupScanBenchmarkSamples(pathSamples.cpu),
          ...(pathSamples.gpu.length > 0
            ? {gpuTimeMilliseconds: summarizeGPUWorkgroupScanBenchmarkSamples(pathSamples.gpu)}
            : {})
        };
      })
    };
  } finally {
    for (const path of paths) {
      path.compiled.destroy();
      path.outputBuffer.destroy();
    }
    inputBuffer.destroy();
  }
}

function makeGPUFFT1DBenchmarkPath(
  device: Device,
  benchmarkId: string,
  inputBuffer: Buffer,
  length: number,
  batchCount: number,
  strategy: GPUFFT1DBenchmarkStrategy
): BenchmarkPath {
  const elementCount = length * batchCount;
  const outputBuffer = device.createBuffer({
    id: `${benchmarkId}-${strategy}-output`,
    byteLength: elementCount * 2 * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id: `${benchmarkId}-${strategy}`});
  const inputHandle = graph.importBuffer(
    {id: 'input', byteLength: inputBuffer.byteLength, usage: inputBuffer.usage},
    inputBuffer
  );
  const outputHandle = graph.importBuffer(
    {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
    outputBuffer
  );
  const input = graph.createDataView(inputHandle, {format: 'float32x2', length: elementCount});
  const output = graph.createDataView(outputHandle, {format: 'float32x2', length: elementCount});
  new GPUFFT1D({
    id: `${benchmarkId}-${strategy}`,
    input,
    output,
    length,
    batchCount,
    strategy
  }).addToGraph(graph);
  return {strategy, outputBuffer, compiled: graph.compile()};
}

function encodeAndSubmitGPUFFT1DBenchmark(device: Device, path: BenchmarkPath, id: string): void {
  const commandEncoder = device.createCommandEncoder({id});
  try {
    path.compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
  } catch (error) {
    commandEncoder.destroy();
    throw error;
  }
}

async function validateGPUFFT1DBenchmarkPath(
  path: BenchmarkPath,
  elementCount: number,
  benchmarkId: string
): Promise<void> {
  const outputBytes = await path.outputBuffer.readAsync();
  const outputValues = new Float32Array(
    outputBytes.buffer,
    outputBytes.byteOffset,
    elementCount * 2
  );
  for (let elementIndex = 0; elementIndex < elementCount; elementIndex++) {
    if (outputValues[elementIndex * 2] !== 1 || outputValues[elementIndex * 2 + 1] !== 0) {
      throw new Error(`${benchmarkId} ${path.strategy} path does not match the impulse oracle`);
    }
  }
}

function validateGPUFFT1DBenchmarkProps(
  device: Device,
  byteLength: number,
  warmupIterations: number,
  measuredIterations: number
): void {
  if (
    !Number.isSafeInteger(warmupIterations) ||
    warmupIterations < 1 ||
    !Number.isSafeInteger(measuredIterations) ||
    measuredIterations < 1
  ) {
    throw new Error('GPUFFT1D benchmark iteration counts must be positive safe integers');
  }
  if (
    byteLength > device.limits.maxBufferSize ||
    byteLength > device.limits.maxStorageBufferBindingSize
  ) {
    throw new Error('GPUFFT1D benchmark data exceeds device buffer limits');
  }
}
