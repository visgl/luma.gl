// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {type CompiledGPUCommandGraph, GPUCommandGraph} from './gpu-command-graph';
import {
  summarizeGPUWorkgroupScanBenchmarkSamples,
  type GPUWorkgroupScanBenchmarkDistribution
} from './gpu-workgroup-scan-benchmark';

const WORKGROUP_SIZE = 256;
const DEFAULT_WORKGROUP_COUNT = 4096;
const DEFAULT_ROUND_COUNT = 32;
const DEFAULT_DISPATCH_COUNT = 10;
const DEFAULT_WARMUP_ITERATIONS = 5;
const DEFAULT_MEASURED_ITERATIONS = 30;

/** Workgroup-local reduction implementation measured by the benchmark. */
export type GPUWorkgroupReductionBenchmarkStrategy = 'portable' | 'subgroups';

/** Options for the command-graph workgroup reduction benchmark. */
export type GPUWorkgroupReductionBenchmarkProps = {
  id?: string;
  workgroupCount?: number;
  roundCount?: number;
  dispatchCount?: number;
  warmupIterations?: number;
  measuredIterations?: number;
};

/** Correctness-gated timing report for one reduction strategy. */
export type GPUWorkgroupReductionBenchmarkPathReport = {
  strategy: GPUWorkgroupReductionBenchmarkStrategy;
  barrierCountPerRound: number;
  checksum: number;
  cpuEncodeTimeMilliseconds: GPUWorkgroupScanBenchmarkDistribution;
  gpuTimeMilliseconds?: GPUWorkgroupScanBenchmarkDistribution;
};

/** Reproducible metadata and results from one workgroup reduction benchmark. */
export type GPUWorkgroupReductionBenchmarkReport = {
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
  paths: GPUWorkgroupReductionBenchmarkPathReport[];
};

type BenchmarkPath = {
  strategy: GPUWorkgroupReductionBenchmarkStrategy;
  barrierCountPerRound: number;
  outputBuffer: Buffer;
  compiled: CompiledGPUCommandGraph<void>;
};

type BenchmarkSamples = {cpu: number[]; gpu: number[]};

/** Measures the synchronization-sensitive 256-value sum used by hierarchical GPU reductions. */
export async function runGPUWorkgroupReductionBenchmark(
  device: Device,
  props: GPUWorkgroupReductionBenchmarkProps = {}
): Promise<GPUWorkgroupReductionBenchmarkReport> {
  const id = props.id ?? 'gpu-workgroup-reduction-benchmark';
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
  const strategies: GPUWorkgroupReductionBenchmarkStrategy[] = subgroupAvailable
    ? ['portable', 'subgroups']
    : ['portable'];
  const expectedChecksum = getExpectedChecksum(roundCount);
  const timestampQueries = device.features.has('timestamp-query');
  const paths = strategies.map(strategy =>
    makeBenchmarkPath(device, id, strategy, workgroupCount, roundCount, dispatchCount)
  );
  const samples = new Map<GPUWorkgroupReductionBenchmarkStrategy, BenchmarkSamples>(
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

    const pathReports: GPUWorkgroupReductionBenchmarkPathReport[] = paths.map(path => {
      const pathSamples = samples.get(path.strategy)!;
      return {
        strategy: path.strategy,
        barrierCountPerRound: path.barrierCountPerRound,
        checksum: expectedChecksum,
        cpuEncodeTimeMilliseconds: summarizeGPUWorkgroupScanBenchmarkSamples(pathSamples.cpu),
        ...(pathSamples.gpu.length > 0
          ? {gpuTimeMilliseconds: summarizeGPUWorkgroupScanBenchmarkSamples(pathSamples.gpu)}
          : {})
      };
    });
    for (const path of paths) {
      await validatePath(path, expectedChecksum, workgroupCount, id);
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

function makeBenchmarkPath(
  device: Device,
  benchmarkId: string,
  strategy: GPUWorkgroupReductionBenchmarkStrategy,
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
    id: `${benchmarkId}-${strategy}-local-reduction`,
    resources: [{buffer: output, usage: 'storage-write'}],
    compile: () => {
      const computation = new Computation(device, {
        id: `${benchmarkId}-${strategy}-local-reduction`,
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
  const subgroupSize = device.info.subgroupMinSize || 32;
  return {
    strategy,
    barrierCountPerRound:
      strategy === 'subgroups'
        ? 2 + Math.log2(WORKGROUP_SIZE / subgroupSize)
        : 2 + Math.log2(WORKGROUP_SIZE),
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
    throw new Error(`${benchmarkId} ${path.strategy} path does not match the reduction oracle`);
  }
}

function getExpectedChecksum(roundCount: number): number {
  let total = 0;
  for (let round = 0; round < roundCount; round++) {
    const inputValue = total;
    total = 0;
    for (let lane = 0; lane < WORKGROUP_SIZE; lane++) {
      const laneValue = round === 0 ? lane + 1 : inputValue;
      total = (total + ((laneValue ^ (round + lane)) >>> 0)) >>> 0;
    }
  }
  return total;
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
    throw new Error('GPU workgroup reduction benchmark counts must be positive safe integers');
  }
  if (device.limits.maxComputeInvocationsPerWorkgroup < WORKGROUP_SIZE) {
    throw new Error(`GPU workgroup reduction benchmark requires ${WORKGROUP_SIZE} invocations`);
  }
  if (workgroupCount > device.limits.maxComputeWorkgroupsPerDimension) {
    throw new Error('GPU workgroup reduction benchmark exceeds maxComputeWorkgroupsPerDimension');
  }
}

function getPortableShader(roundCount: number): string {
  return /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
var<workgroup> scratch: array<u32, ${WORKGROUP_SIZE}>;

fn reduceValue(inputValue: u32, lane: u32) -> u32 {
  scratch[lane] = inputValue;
  workgroupBarrier();
  for (var stride = ${WORKGROUP_SIZE / 2}u; stride > 0u; stride /= 2u) {
    if (lane < stride) { scratch[lane] += scratch[lane + stride]; }
    workgroupBarrier();
  }
  let result = scratch[0];
  workgroupBarrier();
  return result;
}

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) lane: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  var value = lane + 1u;
  for (var round = 0u; round < ${roundCount}u; round++) {
    value = reduceValue(value ^ (round + lane), lane);
  }
  if (lane == 0u) { outputValues[workgroupId.x] = value; }
}`;
}

function getSubgroupShader(roundCount: number): string {
  return /* wgsl */ `
enable subgroups;
requires subgroup_id;

@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
var<workgroup> subgroupTotals: array<u32, 64>;

fn reduceValue(
  inputValue: u32,
  lane: u32,
  subgroupInvocationId: u32,
  subgroupSize: u32,
  subgroupId: u32
) -> u32 {
  let subgroupTotal = subgroupAdd(inputValue);
  if (subgroupInvocationId == 0u) { subgroupTotals[subgroupId] = subgroupTotal; }
  workgroupBarrier();
  let subgroupCount = ${WORKGROUP_SIZE}u / subgroupSize;
  if (subgroupCount > 1u) {
    for (var stride = subgroupCount / 2u; stride > 0u; stride /= 2u) {
      if (lane < stride) { subgroupTotals[lane] += subgroupTotals[lane + stride]; }
      workgroupBarrier();
    }
  }
  let result = subgroupTotals[0];
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
    value = reduceValue(value ^ (round + lane), lane, subgroupInvocationId, subgroupSize, subgroupId);
  }
  if (lane == 0u) { outputValues[workgroupId.x] = value; }
}`;
}
