// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type QuerySet} from '@luma.gl/core';
import {type CompiledGPUCommandGraph, GPUCommandGraph} from '../gpu-core/gpu-command-graph';
import {
  type DGGSCellFamily,
  type DGGSCellProjectionKind,
  GPUDGGSCellProjection
} from './gpu-dggs-cell-projection';

const DEFAULT_WARMUP_ITERATIONS = 2;
const DEFAULT_MEASURED_ITERATIONS = 7;

/** Distribution of measured DGGS projection durations in milliseconds. */
export type GPUDGGSCellProjectionBenchmarkDistribution = {
  minimum: number;
  median: number;
  percentile95: number;
  maximum: number;
};

/** Options for the correctness-gated DGGS cell-center benchmark. */
export type GPUDGGSCellProjectionBenchmarkProps = {
  id?: string;
  family: DGGSCellFamily;
  /** Low-word/high-word packed cells. Every cell must be valid for the selected family. */
  cells: Uint32Array;
  projection?: DGGSCellProjectionKind;
  warmupIterations?: number;
  measuredIterations?: number;
};

/** Live-device timing report for one DGGS cell projection path. */
export type GPUDGGSCellProjectionBenchmarkReport = {
  family: DGGSCellFamily;
  projection: DGGSCellProjectionKind;
  cellCount: number;
  measuredIterations: number;
  timestampQueries: boolean;
  memoryByteLength: number;
  cpuEncodeTimeMilliseconds: GPUDGGSCellProjectionBenchmarkDistribution;
  synchronizedTimeMilliseconds: GPUDGGSCellProjectionBenchmarkDistribution;
  synchronizedCellsPerSecond: number;
  gpuTimeMilliseconds?: GPUDGGSCellProjectionBenchmarkDistribution;
  gpuCellsPerSecond?: number;
  validationReadbackTimeMilliseconds: number;
};

type BenchmarkExecution = {
  cpuEncodeTimeMilliseconds: number;
  synchronizedTimeMilliseconds: number;
  gpuTimeMilliseconds?: number;
};

/**
 * Measures one real command-graph DGGS projection on the supplied WebGPU adapter.
 *
 * Upload, compilation, and correctness readback are excluded from measured submissions. Every
 * timing waits for a completion fence, and results are validated before and after measurement.
 */
export async function runGPUDGGSCellProjectionBenchmark(
  device: Device,
  props: GPUDGGSCellProjectionBenchmarkProps
): Promise<GPUDGGSCellProjectionBenchmarkReport> {
  const id = props.id ?? `gpu-${props.family}-cell-projection-benchmark`;
  const projection = props.projection ?? 'unit-vector';
  const warmupIterations = props.warmupIterations ?? DEFAULT_WARMUP_ITERATIONS;
  const measuredIterations = props.measuredIterations ?? DEFAULT_MEASURED_ITERATIONS;
  validateBenchmarkProps(props.cells, warmupIterations, measuredIterations);

  const cellCount = props.cells.length / 2;
  const componentCount = projection === 'lnglat' ? 2 : 3;
  const inputBuffer = device.createBuffer({
    id: `${id}-cells`,
    data: props.cells,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    id: `${id}-output`,
    byteLength: cellCount * componentCount * Float32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const validityBuffer = device.createBuffer({
    id: `${id}-validity`,
    byteLength: cellCount * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id});
  const input = graph.createDataView(
    graph.importBuffer(
      {id: `${id}-cells`, byteLength: inputBuffer.byteLength, usage: inputBuffer.usage},
      inputBuffer
    ),
    {format: 'uint32x2', length: cellCount}
  );
  const output = graph.createDataView(
    graph.importBuffer(
      {id: `${id}-output`, byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
      outputBuffer
    ),
    {format: projection === 'lnglat' ? 'float32x2' : 'float32x3', length: cellCount}
  );
  const validity = graph.createDataView(
    graph.importBuffer(
      {
        id: `${id}-validity`,
        byteLength: validityBuffer.byteLength,
        usage: validityBuffer.usage
      },
      validityBuffer
    ),
    {format: 'uint32', length: cellCount}
  );
  new GPUDGGSCellProjection({
    id,
    family: props.family,
    cells: input,
    output,
    validity,
    projection
  }).addToGraph(graph);
  const compiled = graph.compile();

  try {
    await executeBenchmark(device, compiled, `${id}-validation`);
    let validationReadbackTimeMilliseconds = await validateBenchmarkOutput(
      outputBuffer,
      validityBuffer,
      cellCount,
      projection
    );
    for (let iteration = 0; iteration < warmupIterations; iteration++) {
      await executeBenchmark(device, compiled, `${id}-warmup-${iteration}`);
    }

    const executions: BenchmarkExecution[] = [];
    for (let iteration = 0; iteration < measuredIterations; iteration++) {
      const querySet = device.features.has('timestamp-query')
        ? device.createQuerySet({id: `${id}-timestamps-${iteration}`, type: 'timestamp', count: 2})
        : undefined;
      try {
        executions.push(
          await executeBenchmark(device, compiled, `${id}-measured-${iteration}`, querySet)
        );
      } finally {
        querySet?.destroy();
      }
    }
    validationReadbackTimeMilliseconds = Math.max(
      validationReadbackTimeMilliseconds,
      await validateBenchmarkOutput(outputBuffer, validityBuffer, cellCount, projection)
    );

    const synchronizedTimeMilliseconds = summarizeBenchmarkSamples(
      executions.map(execution => execution.synchronizedTimeMilliseconds)
    );
    const gpuSamples = executions.flatMap(execution =>
      execution.gpuTimeMilliseconds === undefined ? [] : [execution.gpuTimeMilliseconds]
    );
    const gpuTimeMilliseconds =
      gpuSamples.length > 0 ? summarizeBenchmarkSamples(gpuSamples) : undefined;

    return {
      family: props.family,
      projection,
      cellCount,
      measuredIterations,
      timestampQueries: device.features.has('timestamp-query'),
      memoryByteLength:
        inputBuffer.byteLength + outputBuffer.byteLength + validityBuffer.byteLength,
      cpuEncodeTimeMilliseconds: summarizeBenchmarkSamples(
        executions.map(execution => execution.cpuEncodeTimeMilliseconds)
      ),
      synchronizedTimeMilliseconds,
      synchronizedCellsPerSecond: getThroughput(cellCount, synchronizedTimeMilliseconds.median),
      ...(gpuTimeMilliseconds
        ? {
            gpuTimeMilliseconds,
            gpuCellsPerSecond: getThroughput(cellCount, gpuTimeMilliseconds.median)
          }
        : {}),
      validationReadbackTimeMilliseconds
    };
  } finally {
    compiled.destroy();
    validityBuffer.destroy();
    outputBuffer.destroy();
    inputBuffer.destroy();
  }
}

async function executeBenchmark(
  device: Device,
  compiled: CompiledGPUCommandGraph<void>,
  id: string,
  querySet?: QuerySet
): Promise<BenchmarkExecution> {
  const commandEncoder = device.createCommandEncoder({
    id,
    ...(querySet ? {timeProfilingQuerySet: querySet} : {})
  });
  let submitted = false;
  try {
    const encoding = compiled.encode(commandEncoder, {parameters: undefined});
    const startTime = getTime();
    device.submit(commandEncoder.finish());
    submitted = true;
    const fence = device.createFence();
    try {
      await fence.signaled;
    } finally {
      fence.destroy();
    }
    const synchronizedTimeMilliseconds = getTime() - startTime;
    const timing = await encoding.readTimings();
    return {
      cpuEncodeTimeMilliseconds: timing.cpuEncodeTimeMilliseconds,
      synchronizedTimeMilliseconds,
      gpuTimeMilliseconds: timing.gpuTimeMilliseconds
    };
  } catch (error) {
    if (!submitted) {
      commandEncoder.destroy();
    }
    throw error;
  }
}

async function validateBenchmarkOutput(
  outputBuffer: Buffer,
  validityBuffer: Buffer,
  cellCount: number,
  projection: DGGSCellProjectionKind
): Promise<number> {
  const startTime = getTime();
  const [outputBytes, validityBytes] = await Promise.all([
    outputBuffer.readAsync(),
    validityBuffer.readAsync()
  ]);
  const componentCount = projection === 'lnglat' ? 2 : 3;
  const values = new Float32Array(
    outputBytes.buffer,
    outputBytes.byteOffset,
    cellCount * componentCount
  );
  const validity = new Uint32Array(validityBytes.buffer, validityBytes.byteOffset, cellCount);
  for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
    if (validity[cellIndex] !== 1) {
      throw new Error('DGGS projection benchmark input contains an invalid cell');
    }
    const valueOffset = cellIndex * componentCount;
    if (projection === 'lnglat') {
      const longitude = values[valueOffset];
      const latitude = values[valueOffset + 1];
      if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      ) {
        throw new Error('DGGS projection benchmark produced an invalid geographic center');
      }
    } else {
      const length = Math.hypot(
        values[valueOffset],
        values[valueOffset + 1],
        values[valueOffset + 2]
      );
      if (!Number.isFinite(length) || Math.abs(length - 1) > 0.002) {
        throw new Error('DGGS projection benchmark produced a non-normalized unit vector');
      }
    }
  }
  return getTime() - startTime;
}

function validateBenchmarkProps(
  cells: Uint32Array,
  warmupIterations: number,
  measuredIterations: number
): void {
  if (cells.length === 0 || cells.length % 2 !== 0) {
    throw new Error('DGGS projection benchmark cells must contain complete uint32x2 rows');
  }
  for (const [name, count] of [
    ['warmupIterations', warmupIterations],
    ['measuredIterations', measuredIterations]
  ] as const) {
    if (!Number.isSafeInteger(count) || count < (name === 'measuredIterations' ? 1 : 0)) {
      throw new Error(`DGGS projection benchmark ${name} is invalid`);
    }
  }
}

function summarizeBenchmarkSamples(
  samples: readonly number[]
): GPUDGGSCellProjectionBenchmarkDistribution {
  const sortedSamples = [...samples].sort((left, right) => left - right);
  const percentile = (fraction: number): number =>
    sortedSamples[Math.max(0, Math.ceil(fraction * sortedSamples.length) - 1)];
  return {
    minimum: sortedSamples[0],
    median: percentile(0.5),
    percentile95: percentile(0.95),
    maximum: sortedSamples[sortedSamples.length - 1]
  };
}

function getThroughput(cellCount: number, durationMilliseconds: number): number {
  return (cellCount * 1000) / durationMilliseconds;
}

function getTime(): number {
  return globalThis.performance?.now() ?? Date.now();
}
