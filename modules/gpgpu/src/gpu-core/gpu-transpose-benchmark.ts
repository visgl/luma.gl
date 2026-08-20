// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Binding, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  type CompiledGPUCommandGraph,
  GPUCommandGraph,
  type GraphDataView
} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {getViewBinding, getViewElementOffset} from './graph-data-view-utils';
import {GPUTranspose, makeGPUTransposeStats} from './gpu-transpose';
import {
  summarizeGPUWorkgroupScanBenchmarkSamples,
  type GPUWorkgroupScanBenchmarkDistribution
} from './gpu-workgroup-scan-benchmark';

const REFERENCE_WORKGROUP_SIZE = 256;
const DEFAULT_ROWS = 2048;
const DEFAULT_COLUMNS = 2048;
const DEFAULT_WARMUP_ITERATIONS = 3;
const DEFAULT_MEASURED_ITERATIONS = 20;

/** Transpose implementation measured by {@link runGPUTransposeBenchmark}. */
export type GPUTransposeBenchmarkStrategy = 'tiled' | 'reference';

/** Options for the correctness-gated tiled transpose benchmark. */
export type GPUTransposeBenchmarkProps = {
  id?: string;
  rows?: number;
  columns?: number;
  warmupIterations?: number;
  measuredIterations?: number;
};

/** Timing distribution for one transpose implementation. */
export type GPUTransposeBenchmarkPathReport = {
  strategy: GPUTransposeBenchmarkStrategy;
  cpuEncodeTimeMilliseconds: GPUWorkgroupScanBenchmarkDistribution;
  gpuTimeMilliseconds?: GPUWorkgroupScanBenchmarkDistribution;
};

/** Reproducible dimensions and timing distributions for a transpose comparison. */
export type GPUTransposeBenchmarkReport = {
  id: string;
  rows: number;
  columns: number;
  elementCount: number;
  warmupIterations: number;
  measuredIterations: number;
  timestampQueries: boolean;
  paths: GPUTransposeBenchmarkPathReport[];
};

type BenchmarkPath = {
  strategy: GPUTransposeBenchmarkStrategy;
  outputBuffer: Buffer;
  compiled: CompiledGPUCommandGraph<void>;
};

type BenchmarkSamples = {cpu: number[]; gpu: number[]};

/**
 * Compares the padded tiled primitive with a simple one-invocation-per-element reference path.
 *
 * The helper performs explicit correctness readbacks outside both implementation paths before it
 * reports timings. Production use of {@link GPUTranspose} itself remains synchronization-free.
 */
export async function runGPUTransposeBenchmark(
  device: Device,
  props: GPUTransposeBenchmarkProps = {}
): Promise<GPUTransposeBenchmarkReport> {
  const id = props.id ?? 'gpu-transpose-benchmark';
  const rows = props.rows ?? DEFAULT_ROWS;
  const columns = props.columns ?? DEFAULT_COLUMNS;
  const warmupIterations = props.warmupIterations ?? DEFAULT_WARMUP_ITERATIONS;
  const measuredIterations = props.measuredIterations ?? DEFAULT_MEASURED_ITERATIONS;
  const stats = makeGPUTransposeStats(rows, columns);
  validateGPUTransposeBenchmarkProps(
    device,
    stats.elementCount,
    warmupIterations,
    measuredIterations
  );

  const inputValues = Float32Array.from(
    {length: stats.elementCount},
    (_, index) => ((index * 2654435761) >>> 8) / 0x1000000
  );
  const inputBuffer = device.createBuffer({
    id: `${id}-input`,
    data: inputValues,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const paths: BenchmarkPath[] = [];
  const strategies: GPUTransposeBenchmarkStrategy[] = ['tiled', 'reference'];
  const samples = new Map<GPUTransposeBenchmarkStrategy, BenchmarkSamples>(
    strategies.map(strategy => [strategy, {cpu: [], gpu: []}])
  );
  const timestampQueries = device.features.has('timestamp-query');

  try {
    for (const strategy of strategies) {
      paths.push(makeGPUTransposeBenchmarkPath(device, id, inputBuffer, rows, columns, strategy));
    }
    for (const path of paths) {
      for (let iteration = 0; iteration < warmupIterations; iteration++) {
        encodeAndSubmitTransposeBenchmark(
          device,
          path,
          `${id}-${path.strategy}-warmup-${iteration}`
        );
      }
      await validateGPUTransposeBenchmarkPath(path, inputValues, rows, columns, id);
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
      rows,
      columns,
      elementCount: stats.elementCount,
      warmupIterations,
      measuredIterations,
      timestampQueries,
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

function makeGPUTransposeBenchmarkPath(
  device: Device,
  benchmarkId: string,
  inputBuffer: Buffer,
  rows: number,
  columns: number,
  strategy: GPUTransposeBenchmarkStrategy
): BenchmarkPath {
  const elementCount = rows * columns;
  const outputBuffer = device.createBuffer({
    id: `${benchmarkId}-${strategy}-output`,
    byteLength: elementCount * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id: `${benchmarkId}-${strategy}`});
  const input = importGPUTransposeBenchmarkView(graph, 'input', inputBuffer, elementCount);
  const output = importGPUTransposeBenchmarkView(graph, 'output', outputBuffer, elementCount);
  if (strategy === 'tiled') {
    new GPUTranspose({id: `${benchmarkId}-tiled`, input, output, rows, columns}).addToGraph(graph);
  } else {
    addGPUTransposeReferencePass(graph, benchmarkId, input, output, rows, columns);
  }
  return {strategy, outputBuffer, compiled: graph.compile()};
}

function addGPUTransposeReferencePass(
  graph: GPUCommandGraph,
  benchmarkId: string,
  input: GraphDataView<'float32'>,
  output: GraphDataView<'float32'>,
  rows: number,
  columns: number
): void {
  const elementCount = rows * columns;
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUTranspose reference',
    elementCount,
    REFERENCE_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = `const ELEMENT_COUNT: u32 = ${elementCount}u;
const ROWS: u32 = ${rows}u;
const COLUMNS: u32 = ${columns}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(input)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<f32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<f32>;
@compute @workgroup_size(${REFERENCE_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, REFERENCE_WORKGROUP_SIZE)}
  if (index >= ELEMENT_COUNT) { return; }
  let row = index / COLUMNS;
  let column = index - row * COLUMNS;
  outputValues[OUTPUT_OFFSET + column * ROWS + row] = inputValues[INPUT_OFFSET + index];
}`;
  graph.addComputePass({
    id: `${benchmarkId}-reference`,
    resources: [
      {buffer: input, usage: 'storage-read'},
      {buffer: output, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: `${benchmarkId}-reference`,
        source,
        shaderLayout: {
          bindings: [
            {name: 'inputValues', type: 'read-only-storage', group: 0, location: 0},
            {name: 'outputValues', type: 'storage', group: 0, location: 1}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            inputValues: getViewBinding(input, getBuffer),
            outputValues: getViewBinding(output, getBuffer)
          };
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function importGPUTransposeBenchmarkView(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  length: number
): GraphDataView<'float32'> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format: 'float32', length});
}

function encodeAndSubmitTransposeBenchmark(device: Device, path: BenchmarkPath, id: string): void {
  const commandEncoder = device.createCommandEncoder({id});
  try {
    path.compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
  } catch (error) {
    commandEncoder.destroy();
    throw error;
  }
}

async function validateGPUTransposeBenchmarkPath(
  path: BenchmarkPath,
  inputValues: Float32Array,
  rows: number,
  columns: number,
  benchmarkId: string
): Promise<void> {
  const outputBytes = await path.outputBuffer.readAsync();
  const outputValues = new Float32Array(
    outputBytes.buffer,
    outputBytes.byteOffset,
    inputValues.length
  );
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      if (outputValues[column * rows + row] !== inputValues[row * columns + column]) {
        throw new Error(`${benchmarkId} ${path.strategy} path does not match the CPU oracle`);
      }
    }
  }
}

function validateGPUTransposeBenchmarkProps(
  device: Device,
  elementCount: number,
  warmupIterations: number,
  measuredIterations: number
): void {
  if (elementCount === 0) {
    throw new Error('GPU transpose benchmark dimensions must be positive');
  }
  if (
    !Number.isSafeInteger(warmupIterations) ||
    warmupIterations < 1 ||
    !Number.isSafeInteger(measuredIterations) ||
    measuredIterations < 1
  ) {
    throw new Error('GPU transpose benchmark iteration counts must be positive safe integers');
  }
  const byteLength = elementCount * Float32Array.BYTES_PER_ELEMENT;
  if (
    byteLength > device.limits.maxBufferSize ||
    byteLength > device.limits.maxStorageBufferBindingSize
  ) {
    throw new Error('GPU transpose benchmark matrix exceeds device buffer limits');
  }
}
