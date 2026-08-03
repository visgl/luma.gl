// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type QuerySet} from '@luma.gl/core';

import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphTimingReport
} from '../gpu-primitives/gpu-command-graph';
import {GPUProjection} from './gpu-projection';
import {
  getProjectionBenchmarkThroughput,
  getProjectionBenchmarkTime,
  prepareProjectionBenchmark,
  summarizeProjectionBenchmarkSamples,
  type ProjectionBenchmarkContext,
  type ProjectionBenchmarkDistribution,
  type ProjectionBenchmarkOptions,
  type ProjectionBenchmarkReport
} from './projection-benchmark';
import {findProjectionPatch, PROJECTION_PATCH_WORD_LENGTH} from './projection-plan';

/** Physical coordinate representation evaluated by the GPU benchmark. */
export type GPUProjectionBenchmarkInputFormat = 'float32x2' | 'uint32x4';

/** Whether source rows discover their patch or consume source-aligned patch IDs. */
export type GPUProjectionBenchmarkPatchStrategy = 'scan' | 'patch-ids';

/** Correctness-gated memory, throughput, and timing results for one WebGPU execution path. */
export type GPUProjectionBenchmarkPathReport = {
  inputFormat: GPUProjectionBenchmarkInputFormat;
  patchStrategy: GPUProjectionBenchmarkPatchStrategy;
  memoryByteLength: number;
  maxError: number;
  cpuEncodeTimeMilliseconds: ProjectionBenchmarkDistribution;
  /** Queue submission through fence completion, excluding uploads, validation, and readback. */
  synchronizedTimeMilliseconds: ProjectionBenchmarkDistribution;
  synchronizedCoordinatesPerSecond: number;
  /** End-to-end synchronized throughput divided by direct CPU-provider throughput. */
  synchronizedSpeedupOverCPUProvider: number;
  /** Compute-pass duration and throughput when the device exposes timestamp-query. */
  gpuTimeMilliseconds?: ProjectionBenchmarkDistribution;
  gpuCoordinatesPerSecond?: number;
  /** Compute-pass-only throughput divided by direct CPU-provider throughput. */
  gpuSpeedupOverCPUProvider?: number;
};

/** Shared CPU baselines plus all float32/binary64 and scan/explicit-patch WebGPU paths. */
export type GPUProjectionBenchmarkReport = {
  cpu: ProjectionBenchmarkReport;
  timestampQueries: boolean;
  paths: GPUProjectionBenchmarkPathReport[];
};

type ProjectionBenchmarkGPUPath = {
  inputFormat: GPUProjectionBenchmarkInputFormat;
  patchStrategy: GPUProjectionBenchmarkPatchStrategy;
};

type ProjectionBenchmarkGPUExecution = {
  timing: GPUCommandGraphTimingReport;
  synchronizedTimeMilliseconds: number;
};

const BENCHMARK_GPU_PATHS: readonly ProjectionBenchmarkGPUPath[] = [
  {inputFormat: 'float32x2', patchStrategy: 'scan'},
  {inputFormat: 'float32x2', patchStrategy: 'patch-ids'},
  {inputFormat: 'uint32x4', patchStrategy: 'scan'},
  {inputFormat: 'uint32x4', patchStrategy: 'patch-ids'}
];

/**
 * Compares CPU baselines with four real WebGPU coordinate-reprojection implementations.
 *
 * Position upload, graph compilation, correctness readback, and timestamp-query readback stay
 * outside measured intervals. Every measured GPU submission waits for a portable device fence,
 * preventing asynchronous command-queue submission from being mistaken for GPU throughput.
 * Float32 paths are validated against their actual rounded source positions, while raw binary64
 * paths retain the original JavaScript coordinates.
 */
export async function runGPUProjectionBenchmark(
  device: Device,
  options: ProjectionBenchmarkOptions
): Promise<GPUProjectionBenchmarkReport> {
  const context = prepareProjectionBenchmark(options);
  const paths: GPUProjectionBenchmarkPathReport[] = [];

  for (const path of BENCHMARK_GPU_PATHS) {
    paths.push(await measureGPUProjectionBenchmarkPath(device, options, context, path));
  }

  return {
    cpu: context.report,
    timestampQueries: device.features.has('timestamp-query'),
    paths
  };
}

async function measureGPUProjectionBenchmarkPath(
  device: Device,
  options: ProjectionBenchmarkOptions,
  context: ProjectionBenchmarkContext,
  path: ProjectionBenchmarkGPUPath
): Promise<GPUProjectionBenchmarkPathReport> {
  const identifier = `projection-benchmark-${path.inputFormat}-${path.patchStrategy}`;
  const coordinates = createGPUProjectionBenchmarkCoordinates(context, path.inputFormat);
  const patchIds =
    path.inputFormat === 'uint32x4'
      ? context.patchIds
      : Uint32Array.from(coordinates, coordinate => findProjectionPatch(context.plan, coordinate));
  const sourceData = createGPUProjectionBenchmarkSource(coordinates, path.inputFormat);
  const sourceBuffer = device.createBuffer({
    id: `${identifier}-positions`,
    data: sourceData,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  let outputBuffer: Buffer | undefined;
  let patchIdBuffer: Buffer | undefined;
  let contributor: GPUProjection | undefined;
  let compiled: CompiledGPUCommandGraph<void> | undefined;

  try {
    outputBuffer = device.createBuffer({
      id: `${identifier}-output`,
      byteLength: coordinates.length * 2 * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const graph = new GPUCommandGraph(device, {id: identifier});
    const sourceHandle = graph.importBuffer(
      {
        id: `${identifier}-positions`,
        byteLength: sourceBuffer.byteLength,
        usage: sourceBuffer.usage
      },
      sourceBuffer
    );
    const outputHandle = graph.importBuffer(
      {id: `${identifier}-output`, byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
      outputBuffer
    );
    const positionView =
      path.inputFormat === 'float32x2'
        ? graph.createDataView(sourceHandle, {format: 'float32x2', length: coordinates.length})
        : graph.createDataView(sourceHandle, {format: 'uint32x4', length: coordinates.length});
    const outputView = graph.createDataView(outputHandle, {
      format: 'float32x2',
      length: coordinates.length
    });

    if (path.patchStrategy === 'patch-ids') {
      patchIdBuffer = device.createBuffer({
        id: `${identifier}-patch-ids`,
        data: patchIds,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      });
    }
    const patchIdView = patchIdBuffer
      ? graph.createDataView(
          graph.importBuffer(
            {
              id: `${identifier}-patch-ids`,
              byteLength: patchIdBuffer.byteLength,
              usage: patchIdBuffer.usage
            },
            patchIdBuffer
          ),
          {format: 'uint32', length: coordinates.length}
        )
      : undefined;

    contributor = new GPUProjection({
      id: identifier,
      positions: positionView,
      output: outputView,
      plan: context.plan,
      ...(patchIdView ? {patchIds: patchIdView} : {})
    });
    contributor.addToGraph(graph);
    compiled = graph.compile();

    // A complete correctness pass precedes warmups so invalid implementations never report speed.
    await executeGPUProjectionBenchmark(device, compiled, `${identifier}-validation`);
    let maxError = await validateGPUProjectionBenchmarkOutput(
      outputBuffer,
      options,
      context,
      coordinates
    );
    for (let iteration = 0; iteration < context.report.warmupIterations; iteration++) {
      await executeGPUProjectionBenchmark(device, compiled, `${identifier}-warmup-${iteration}`);
    }

    const executions: ProjectionBenchmarkGPUExecution[] = [];
    for (let iteration = 0; iteration < context.report.measuredIterations; iteration++) {
      const querySet = device.features.has('timestamp-query')
        ? device.createQuerySet({
            id: `${identifier}-timestamps-${iteration}`,
            type: 'timestamp',
            count: 2
          })
        : undefined;
      try {
        executions.push(
          await executeGPUProjectionBenchmark(
            device,
            compiled,
            `${identifier}-measured-${iteration}`,
            querySet
          )
        );
      } finally {
        querySet?.destroy();
      }
    }
    maxError = Math.max(
      maxError,
      await validateGPUProjectionBenchmarkOutput(outputBuffer, options, context, coordinates)
    );

    const synchronizedTimeMilliseconds = summarizeProjectionBenchmarkSamples(
      executions.map(execution => execution.synchronizedTimeMilliseconds)
    );
    const gpuSamples = executions.flatMap(execution =>
      execution.timing.gpuTimeMilliseconds === undefined
        ? []
        : [execution.timing.gpuTimeMilliseconds]
    );
    const gpuTimeMilliseconds =
      gpuSamples.length > 0 ? summarizeProjectionBenchmarkSamples(gpuSamples) : undefined;
    const providerCoordinatesPerSecond = context.report.paths[0].coordinatesPerSecond;
    const synchronizedCoordinatesPerSecond = getProjectionBenchmarkThroughput(
      coordinates.length,
      synchronizedTimeMilliseconds.median
    );
    const gpuCoordinatesPerSecond = gpuTimeMilliseconds
      ? getProjectionBenchmarkThroughput(coordinates.length, gpuTimeMilliseconds.median)
      : undefined;

    return {
      inputFormat: path.inputFormat,
      patchStrategy: path.patchStrategy,
      memoryByteLength:
        sourceBuffer.byteLength +
        outputBuffer.byteLength +
        (patchIdBuffer?.byteLength ?? 0) +
        context.plan.patches.length * PROJECTION_PATCH_WORD_LENGTH * Uint32Array.BYTES_PER_ELEMENT +
        4 * Float64Array.BYTES_PER_ELEMENT,
      maxError,
      cpuEncodeTimeMilliseconds: summarizeProjectionBenchmarkSamples(
        executions.map(execution => execution.timing.cpuEncodeTimeMilliseconds)
      ),
      synchronizedTimeMilliseconds,
      synchronizedCoordinatesPerSecond,
      synchronizedSpeedupOverCPUProvider:
        synchronizedCoordinatesPerSecond / providerCoordinatesPerSecond,
      ...(gpuTimeMilliseconds && gpuCoordinatesPerSecond !== undefined
        ? {
            gpuTimeMilliseconds,
            gpuCoordinatesPerSecond,
            gpuSpeedupOverCPUProvider: gpuCoordinatesPerSecond / providerCoordinatesPerSecond
          }
        : {})
    };
  } finally {
    compiled?.destroy();
    contributor?.destroy();
    patchIdBuffer?.destroy();
    outputBuffer?.destroy();
    sourceBuffer.destroy();
  }
}

async function executeGPUProjectionBenchmark(
  device: Device,
  compiled: CompiledGPUCommandGraph<void>,
  identifier: string,
  querySet?: QuerySet
): Promise<ProjectionBenchmarkGPUExecution> {
  const commandEncoder = device.createCommandEncoder({
    id: identifier,
    ...(querySet ? {timeProfilingQuerySet: querySet} : {})
  });
  let submitted = false;

  try {
    const encoding = compiled.encode(commandEncoder, {parameters: undefined});
    const startTime = getProjectionBenchmarkTime();
    device.submit(commandEncoder.finish());
    submitted = true;
    const fence = device.createFence();
    try {
      await fence.signaled;
    } finally {
      fence.destroy();
    }
    const synchronizedTimeMilliseconds = getProjectionBenchmarkTime() - startTime;
    const timing = await encoding.readTimings();
    return {timing, synchronizedTimeMilliseconds};
  } catch (error) {
    if (!submitted) commandEncoder.destroy();
    throw error;
  }
}

function createGPUProjectionBenchmarkCoordinates(
  context: ProjectionBenchmarkContext,
  inputFormat: GPUProjectionBenchmarkInputFormat
): [number, number][] {
  if (inputFormat === 'uint32x4') return context.coordinates;
  const [minimumX, minimumY, maximumX, maximumY] = context.plan.bounds;
  return context.coordinates.map(coordinates => [
    getBoundedFloat32BenchmarkCoordinate(coordinates[0], minimumX, maximumX),
    getBoundedFloat32BenchmarkCoordinate(coordinates[1], minimumY, maximumY)
  ]);
}

function getBoundedFloat32BenchmarkCoordinate(
  value: number,
  minimum: number,
  maximum: number
): number {
  let rounded = Math.fround(value);
  if (rounded < minimum) rounded = stepFloat32BenchmarkCoordinate(rounded, 1);
  if (rounded > maximum) rounded = stepFloat32BenchmarkCoordinate(rounded, -1);
  if (!Number.isFinite(rounded) || rounded < minimum || rounded > maximum) {
    throw new Error('projection benchmark bounds contain no representable float32 coordinates');
  }
  return rounded;
}

function stepFloat32BenchmarkCoordinate(value: number, direction: 1 | -1): number {
  if (value === 0) return direction * 2 ** -149;
  const values = new Float32Array([value]);
  const words = new Uint32Array(values.buffer);
  words[0] += value > 0 === direction > 0 ? 1 : -1;
  return values[0];
}

function createGPUProjectionBenchmarkSource(
  coordinates: readonly [number, number][],
  inputFormat: GPUProjectionBenchmarkInputFormat
): Float32Array | Uint32Array {
  if (inputFormat === 'float32x2') {
    const values = new Float32Array(coordinates.length * 2);
    for (let coordinateIndex = 0; coordinateIndex < coordinates.length; coordinateIndex++) {
      values[coordinateIndex * 2] = coordinates[coordinateIndex][0];
      values[coordinateIndex * 2 + 1] = coordinates[coordinateIndex][1];
    }
    return values;
  }

  const values = new Float64Array(coordinates.length * 2);
  for (let coordinateIndex = 0; coordinateIndex < coordinates.length; coordinateIndex++) {
    values[coordinateIndex * 2] = coordinates[coordinateIndex][0];
    values[coordinateIndex * 2 + 1] = coordinates[coordinateIndex][1];
  }
  return new Uint32Array(values.buffer);
}

async function validateGPUProjectionBenchmarkOutput(
  outputBuffer: Buffer,
  options: ProjectionBenchmarkOptions,
  context: ProjectionBenchmarkContext,
  coordinates: readonly [number, number][]
): Promise<number> {
  const outputBytes = await outputBuffer.readAsync();
  const outputValues = new Float32Array(
    outputBytes.buffer,
    outputBytes.byteOffset,
    coordinates.length * 2
  );
  const provider =
    typeof options.projection === 'function'
      ? options.projection
      : options.projection.project.bind(options.projection);
  let maxError = 0;

  for (let coordinateIndex = 0; coordinateIndex < coordinates.length; coordinateIndex++) {
    const projected = provider([...coordinates[coordinateIndex]]);
    const expectedX = projected[0] - context.plan.destinationOrigin[0];
    const expectedY = projected[1] - context.plan.destinationOrigin[1];
    const error = Math.hypot(
      outputValues[coordinateIndex * 2] - expectedX,
      outputValues[coordinateIndex * 2 + 1] - expectedY
    );
    const roundingAllowance =
      Math.max(Math.abs(expectedX), Math.abs(expectedY), 1) * 2 ** -21 + 1e-7;
    if (!Number.isFinite(error) || error > context.plan.tolerance + roundingAllowance) {
      throw new Error('GPU projection benchmark output does not match its shared CPU oracle');
    }
    maxError = Math.max(maxError, error);
  }

  return maxError;
}
