// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {type CompiledGPUCommandGraph, GPUCommandGraph} from './gpu-command-graph';

const WORKGROUP_SIZE = 256;
const MAXIMUM_SUBGROUP_COUNT = 64;
const DEFAULT_WORKGROUP_COUNT = 4096;
const DEFAULT_ROUND_COUNT = 32;
const DEFAULT_DISPATCH_COUNT = 10;
const DEFAULT_WARMUP_ITERATIONS = 5;
const DEFAULT_MEASURED_ITERATIONS = 30;

/** Workgroup-local scan implementation measured by {@link runGPUWorkgroupScanBenchmark}. */
export type GPUWorkgroupScanBenchmarkStrategy = 'portable' | 'subgroups';

/** Distribution summary for normalized per-dispatch benchmark durations. */
export type GPUWorkgroupScanBenchmarkDistribution = {
  minimum: number;
  median: number;
  percentile95: number;
  maximum: number;
};

/** Options for the command-graph workgroup synchronization benchmark. */
export type GPUWorkgroupScanBenchmarkProps = {
  id?: string;
  workgroupCount?: number;
  roundCount?: number;
  dispatchCount?: number;
  warmupIterations?: number;
  measuredIterations?: number;
};

/** Correctness-gated timing report for one scan strategy. */
export type GPUWorkgroupScanBenchmarkPathReport = {
  strategy: GPUWorkgroupScanBenchmarkStrategy;
  barrierCountPerRound: number;
  checksum: number;
  cpuEncodeTimeMilliseconds: GPUWorkgroupScanBenchmarkDistribution;
  gpuTimeMilliseconds?: GPUWorkgroupScanBenchmarkDistribution;
};

/** Reproducible metadata and results from one workgroup synchronization benchmark. */
export type GPUWorkgroupScanBenchmarkReport = {
  id: string;
  workgroupSize: number;
  workgroupCount: number;
  roundCount: number;
  dispatchCount: number;
  warmupIterations: number;
  measuredIterations: number;
  timestampQueries: boolean;
  subgroupAvailable: boolean;
  subgroupMinSize?: number;
  subgroupMaxSize?: number;
  paths: GPUWorkgroupScanBenchmarkPathReport[];
};

type BenchmarkPath = {
  strategy: GPUWorkgroupScanBenchmarkStrategy;
  barrierCountPerRound: number;
  outputBuffer: Buffer;
  compiled: CompiledGPUCommandGraph<void>;
};

type BenchmarkSamples = {
  cpu: number[];
  gpu: number[];
};

/**
 * Measures the synchronization-sensitive part of a workgroup-local prefix scan.
 *
 * Each graph has one compute node that performs repeated scans over generated lane values and
 * writes one checksum per workgroup. This deliberately avoids large source and destination arrays
 * so global-memory bandwidth does not hide the cost of barriers and workgroup scratch traffic.
 * Measured strategy order alternates to reduce thermal and run-order bias.
 */
export async function runGPUWorkgroupScanBenchmark(
  device: Device,
  props: GPUWorkgroupScanBenchmarkProps = {}
): Promise<GPUWorkgroupScanBenchmarkReport> {
  const id = props.id ?? 'gpu-workgroup-scan-benchmark';
  const workgroupCount = props.workgroupCount ?? DEFAULT_WORKGROUP_COUNT;
  const roundCount = props.roundCount ?? DEFAULT_ROUND_COUNT;
  const dispatchCount = props.dispatchCount ?? DEFAULT_DISPATCH_COUNT;
  const warmupIterations = props.warmupIterations ?? DEFAULT_WARMUP_ITERATIONS;
  const measuredIterations = props.measuredIterations ?? DEFAULT_MEASURED_ITERATIONS;
  validateProps(
    device,
    workgroupCount,
    roundCount,
    dispatchCount,
    warmupIterations,
    measuredIterations
  );

  const subgroupAvailable =
    device.features.has('subgroups') && device.wgslLanguageFeatures.has('subgroup_id');
  const strategies: GPUWorkgroupScanBenchmarkStrategy[] = subgroupAvailable
    ? ['portable', 'subgroups']
    : ['portable'];
  const expectedChecksum = getExpectedChecksum(roundCount);
  const timestampQueries = device.features.has('timestamp-query');
  const paths = strategies.map(strategy =>
    makeBenchmarkPath(device, id, strategy, workgroupCount, roundCount, dispatchCount)
  );
  const samples = new Map<GPUWorkgroupScanBenchmarkStrategy, BenchmarkSamples>(
    strategies.map(strategy => [strategy, {cpu: [], gpu: []}])
  );

  try {
    for (const path of paths) {
      for (let iteration = 0; iteration < warmupIterations; iteration++) {
        encodeAndSubmit(device, path, `${id}-${path.strategy}-warmup-${iteration}`);
      }
      await validatePath(path, expectedChecksum, workgroupCount, id);
    }

    for (let iteration = 0; iteration < measuredIterations; iteration++) {
      const orderedPaths = iteration % 2 === 0 ? paths : [...paths].reverse();
      for (const path of orderedPaths) {
        const querySet = timestampQueries
          ? device.createQuerySet({
              id: `${id}-${path.strategy}-timestamps-${iteration}`,
              type: 'timestamp',
              count: 2
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
          pathSamples.cpu.push(timing.cpuEncodeTimeMilliseconds / dispatchCount);
          if (timing.gpuTimeMilliseconds !== undefined) {
            pathSamples.gpu.push(timing.gpuTimeMilliseconds / dispatchCount);
          }
        } catch (error) {
          commandEncoder.destroy();
          throw error;
        } finally {
          querySet?.destroy();
        }
      }
    }

    const pathReports: GPUWorkgroupScanBenchmarkPathReport[] = [];
    for (const path of paths) {
      await validatePath(path, expectedChecksum, workgroupCount, id);
      const pathSamples = samples.get(path.strategy)!;
      pathReports.push({
        strategy: path.strategy,
        barrierCountPerRound: path.barrierCountPerRound,
        checksum: expectedChecksum,
        cpuEncodeTimeMilliseconds: summarizeGPUWorkgroupScanBenchmarkSamples(pathSamples.cpu),
        ...(pathSamples.gpu.length > 0
          ? {gpuTimeMilliseconds: summarizeGPUWorkgroupScanBenchmarkSamples(pathSamples.gpu)}
          : {})
      });
    }

    return {
      id,
      workgroupSize: WORKGROUP_SIZE,
      workgroupCount,
      roundCount,
      dispatchCount,
      warmupIterations,
      measuredIterations,
      timestampQueries,
      subgroupAvailable,
      subgroupMinSize: device.info.subgroupMinSize,
      subgroupMaxSize: device.info.subgroupMaxSize,
      paths: pathReports
    };
  } finally {
    for (const path of paths) {
      path.compiled.destroy();
      path.outputBuffer.destroy();
    }
  }
}

/** Summarizes finite non-negative samples using nearest-rank percentiles. */
export function summarizeGPUWorkgroupScanBenchmarkSamples(
  samples: readonly number[]
): GPUWorkgroupScanBenchmarkDistribution {
  if (samples.length === 0 || samples.some(sample => !Number.isFinite(sample) || sample < 0)) {
    throw new Error('GPU workgroup scan benchmark samples must be finite and non-negative');
  }
  const sortedSamples = [...samples].sort((left, right) => left - right);
  return {
    minimum: sortedSamples[0],
    median: getPercentile(sortedSamples, 0.5),
    percentile95: getPercentile(sortedSamples, 0.95),
    maximum: sortedSamples[sortedSamples.length - 1]
  };
}

function makeBenchmarkPath(
  device: Device,
  benchmarkId: string,
  strategy: GPUWorkgroupScanBenchmarkStrategy,
  workgroupCount: number,
  roundCount: number,
  dispatchCount: number
): BenchmarkPath {
  const outputBuffer = device.createBuffer({
    id: `${benchmarkId}-${strategy}-output`,
    byteLength: workgroupCount * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id: `${benchmarkId}-${strategy}`});
  const output = graph.importBuffer(
    {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
    outputBuffer
  );
  graph.addComputePass({
    id: `${benchmarkId}-${strategy}-local-scan`,
    resources: [{buffer: output, usage: 'storage-write'}],
    compile: () => {
      const computation = new Computation(device, {
        id: `${benchmarkId}-${strategy}-local-scan`,
        source:
          strategy === 'subgroups' ? getSubgroupShader(roundCount) : getPortableShader(roundCount),
        shaderLayout: {
          bindings: [{name: 'outputValues', type: 'storage', group: 0, location: 0}]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          computation.setBindings({outputValues: getBuffer(output)});
          for (let dispatchIndex = 0; dispatchIndex < dispatchCount; dispatchIndex++) {
            computation.dispatch(computePass, workgroupCount);
          }
        },
        destroy: () => computation.destroy()
      };
    }
  });
  return {
    strategy,
    barrierCountPerRound: strategy === 'subgroups' ? 3 : 17,
    outputBuffer,
    compiled: graph.compile()
  };
}

function encodeAndSubmit(device: Device, path: BenchmarkPath, id: string): void {
  const commandEncoder = device.createCommandEncoder({id});
  try {
    path.compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
  } catch (error) {
    commandEncoder.destroy();
    throw error;
  }
}

async function validatePath(
  path: BenchmarkPath,
  expectedChecksum: number,
  workgroupCount: number,
  benchmarkId: string
): Promise<void> {
  const outputBytes = await path.outputBuffer.readAsync();
  const values = new Uint32Array(outputBytes.buffer, outputBytes.byteOffset, workgroupCount);
  if (values.some(value => value !== expectedChecksum)) {
    throw new Error(
      `${benchmarkId} ${path.strategy} path does not match the workgroup checksum oracle`
    );
  }
}

function getExpectedChecksum(roundCount: number): number {
  let values = Uint32Array.from({length: WORKGROUP_SIZE}, (_, lane) => lane + 1);
  for (let round = 0; round < roundCount; round++) {
    let prefix = 0;
    values = Uint32Array.from(values, (value, lane) => {
      prefix = (prefix + (value ^ (round + lane))) >>> 0;
      return prefix;
    });
  }
  return values[WORKGROUP_SIZE - 1];
}

function getPercentile(sortedSamples: readonly number[], percentile: number): number {
  return sortedSamples[Math.ceil(percentile * sortedSamples.length) - 1];
}

function validateProps(
  device: Device,
  workgroupCount: number,
  roundCount: number,
  dispatchCount: number,
  warmupIterations: number,
  measuredIterations: number
): void {
  const counts = [workgroupCount, roundCount, dispatchCount, warmupIterations, measuredIterations];
  if (counts.some(value => !Number.isSafeInteger(value) || value < 1)) {
    throw new Error('GPU workgroup scan benchmark counts must be positive safe integers');
  }
  if (device.limits.maxComputeInvocationsPerWorkgroup < WORKGROUP_SIZE) {
    throw new Error(
      `GPU workgroup scan benchmark requires ${WORKGROUP_SIZE} workgroup invocations`
    );
  }
  if (workgroupCount > device.limits.maxComputeWorkgroupsPerDimension) {
    throw new Error('GPU workgroup scan benchmark exceeds maxComputeWorkgroupsPerDimension');
  }
}

function getPortableShader(roundCount: number): string {
  return /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
var<workgroup> scratch: array<u32, ${WORKGROUP_SIZE}>;

fn scanValue(inputValue: u32, lane: u32) -> u32 {
  scratch[lane] = inputValue;
  workgroupBarrier();
  for (var offset = 1u; offset < ${WORKGROUP_SIZE}u; offset = offset * 2u) {
    var precedingValue = 0u;
    if (lane >= offset) {
      precedingValue = scratch[lane - offset];
    }
    workgroupBarrier();
    scratch[lane] = scratch[lane] + precedingValue;
    workgroupBarrier();
  }
  return scratch[lane];
}

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) lane: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  var value = lane + 1u;
  for (var round = 0u; round < ${roundCount}u; round++) {
    value = scanValue(value ^ (round + lane), lane);
  }
  if (lane == ${WORKGROUP_SIZE - 1}u) {
    outputValues[workgroupId.x] = value;
  }
}`;
}

function getSubgroupShader(roundCount: number): string {
  return /* wgsl */ `
enable subgroups;
requires subgroup_id;

@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
var<workgroup> subgroupOffsets: array<u32, ${MAXIMUM_SUBGROUP_COUNT}>;

fn scanValue(
  inputValue: u32,
  lane: u32,
  subgroupInvocationId: u32,
  subgroupSize: u32,
  subgroupId: u32
) -> u32 {
  let subgroupPrefix = subgroupInclusiveAdd(inputValue);
  if (subgroupInvocationId == subgroupSize - 1u) {
    subgroupOffsets[subgroupId] = subgroupPrefix;
  }
  workgroupBarrier();
  if (lane == 0u) {
    var runningOffset = 0u;
    for (var subgroupIndex = 0u; subgroupIndex < ${WORKGROUP_SIZE}u / subgroupSize; subgroupIndex++) {
      let subgroupSum = subgroupOffsets[subgroupIndex];
      subgroupOffsets[subgroupIndex] = runningOffset;
      runningOffset = runningOffset + subgroupSum;
    }
  }
  workgroupBarrier();
  let result = subgroupOffsets[subgroupId] + subgroupPrefix;
  workgroupBarrier();
  return result;
}

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(subgroup_invocation_id) subgroupInvocationId: u32,
  @builtin(subgroup_size) subgroupSize: u32,
  @builtin(subgroup_id) subgroupId: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let lane = subgroupId * subgroupSize + subgroupInvocationId;
  var value = lane + 1u;
  for (var round = 0u; round < ${roundCount}u; round++) {
    value = scanValue(value ^ (round + lane), lane, subgroupInvocationId, subgroupSize, subgroupId);
  }
  if (lane == ${WORKGROUP_SIZE - 1}u) {
    outputValues[workgroupId.x] = value;
  }
}`;
}
