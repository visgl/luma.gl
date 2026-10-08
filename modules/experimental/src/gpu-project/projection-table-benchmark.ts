// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {Buffer, type Device, type DeviceInfo} from '@luma.gl/core';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import {GPUCommandGraph, type CompiledGPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {GPURecordBatch} from '../gpu-tables/table/gpu-record-batch';
import {GPUTable} from '../gpu-tables/table/gpu-table';
import type {GPUTypeMap} from '../gpu-tables/table/gpu-schema';
import type {GPUProjectionTable} from './gpu-projection-table';
import type {
  ProjectionTableTransform,
  ProjectionTableBatch,
  ProjectedTableBatch
} from './projection-table-transform';
import type {ProjectionProgramMetadata} from './projection-metadata';
import type {ProjectionBounds, ProjectionCoordinates} from './types';
import {executeGPUProjectionBenchmark} from './gpu-projection-benchmark';
import {
  getProjectionBenchmarkTime,
  summarizeProjectionBenchmarkSamples,
  type ProjectionBenchmarkDistribution
} from './projection-benchmark';

export type ProjectionTableBenchmarkOptions = {
  /** Already prepared; provider construction, fitting and program compilation are excluded. */
  transform: ProjectionTableTransform;
  provider: string;
  /** Snapshotted before the first await; physical boundaries and empty batches are preserved. */
  batches: readonly ProjectionTableBatch[];
  /** Absolute Euclidean error in destination units, including GPU output rounding. */
  maximumError: number;
  warmupIterations?: number;
  measuredIterations?: number;
};

export type ProjectionTableBenchmarkMode = 'resident' | 'upload-project' | 'round-trip';

export type ProjectionTableBenchmarkReport = {
  device: DeviceInfo;
  provider: string;
  consumer: 'projection-table';
  batchRowCounts: number[];
  rowCount: number;
  validRows: number;
  dispatchCount: number;
  metadata: ProjectionProgramMetadata;
  plan: {bounds: ProjectionBounds; degree: number; patchCount: number; tolerance: number};
  destinationOrigin: ProjectionCoordinates;
  maximumAllowedError: number;
  maximumObservedError: number;
  warmupIterations: number;
  measuredIterations: number;
  /** CPU projectBatches allocation + execution. Validation is outside the interval. */
  cpuTimeMilliseconds: ProjectionBenchmarkDistribution;
  cpuOutputByteLength: number;
  /** Explicit data buffers only, including empty-batch padding and duplicated plan parameters.
   * Excludes graph/driver objects, shader binaries and temporary readback staging. */
  gpuBufferByteLength: {input: number; output: number; parameters: number; total: number};
  resourcePreparationTimeMilliseconds: number;
  graphCompilationTimeMilliseconds: number;
  uploadDrainTimeMilliseconds: number;
  firstUseTimeMilliseconds: number;
  paths: {
    mode: ProjectionTableBenchmarkMode;
    durationMilliseconds: ProjectionBenchmarkDistribution;
    /** Includes masked/invalid source rows, which still incur dispatch and storage costs. */
    sourceRowsPerSecond: number | null;
  }[];
  /** CPU-resident output comparison only; GPU values remain approximate within maximumError. */
  roundTripSpeedupOverCPU: number | null;
};

/**
 * Benchmark the production CPU/GPU table adapters, not a synthetic downstream shader.
 * All GPU samples include encoding and a submission fence; no timestamp instrumentation.
 * Every CPU result and each GPU path before/after timing is validated. Failure returns no report.
 * The supplied transform/provider must remain immutable; all benchmark GPU resources are owned.
 */
export async function runProjectionTableBenchmark(
  device: Device,
  options: ProjectionTableBenchmarkOptions
): Promise<ProjectionTableBenchmarkReport> {
  const warmupIterations = options.warmupIterations ?? 2;
  const measuredIterations = options.measuredIterations ?? 5;
  if (
    !options.provider ||
    !Number.isFinite(options.maximumError) ||
    options.maximumError < 0 ||
    !Number.isSafeInteger(warmupIterations) ||
    warmupIterations < 0 ||
    !Number.isSafeInteger(measuredIterations) ||
    measuredIterations < 1
  ) {
    throw new Error('invalid projection table benchmark options');
  }
  const batches = options.batches.map(batch => ({
    positions: batch.positions.slice(),
    inputValidity: batch.inputValidity?.slice(),
    sourceInfo: batch.sourceInfo ? {...batch.sourceInfo} : undefined,
    metadata: new Map(batch.metadata)
  }));
  const expected = [...options.transform.projectBatches(batches)];
  const batchRowCounts = expected.map(batch => batch.numRows);
  const rowCount = batchRowCounts.reduce((total, count) => total + count, 0);
  if (!rowCount) throw new Error('projection table benchmark requires at least one source row');
  const validRows = expected.reduce(
    (total, batch) => total + batch.validity.reduce((count, valid) => count + valid, 0),
    0
  );
  const cpuSamples: number[] = [];
  for (let iteration = -warmupIterations; iteration < measuredIterations; iteration++) {
    const start = getProjectionBenchmarkTime();
    const actual = [...options.transform.projectBatches(batches)];
    const duration = getProjectionBenchmarkTime() - start;
    // The retained provider is authoritative but must be stable, even within an error budget.
    validateTableOutput(actual, expected, 0);
    if (iteration >= 0) cpuSamples.push(duration);
  }
  const cpuTimeMilliseconds = summarizeProjectionBenchmarkSamples(cpuSamples);
  const inputBuffers: {positions: Buffer; validity: Buffer; mask: Uint32Array}[] = [];
  const ownedBuffers: Buffer[] = [];
  let source: GPUTable | undefined;
  let output: GPUProjectionTable | undefined;
  let compiled: CompiledGPUCommandGraph<void> | undefined;
  const preparationStart = getProjectionBenchmarkTime();
  try {
    const createBuffer = (byteLength: number) => {
      const buffer = device.createBuffer({byteLength, usage: Buffer.STORAGE | Buffer.COPY_DST});
      ownedBuffers.push(buffer);
      return buffer;
    };
    source = new GPUTable({
      batches: batches.map((batch, index): GPURecordBatch => {
        const positions = createBuffer(Math.max(16, batch.positions.byteLength));
        const validity = createBuffer(Math.max(4, batchRowCounts[index] * 4));
        inputBuffers.push({
          positions,
          validity,
          mask: batch.inputValidity ?? new Uint32Array(batchRowCounts[index]).fill(1)
        });
        return new GPURecordBatch<GPUTypeMap>({
          gpuData: {
            positions: new GPUData({
              buffer: positions,
              format: 'uint32x4',
              length: batchRowCounts[index],
              ownsBuffer: false
            }),
            validity: new GPUData({
              buffer: validity,
              format: 'uint32',
              length: batchRowCounts[index],
              ownsBuffer: false
            })
          },
          sourceInfo: batch.sourceInfo,
          metadata: batch.metadata
        });
      })
    });
    const upload = () => {
      for (const [index, batch] of batches.entries()) {
        if (!batchRowCounts[index]) continue;
        inputBuffers[index].positions.write(
          new Uint8Array(
            batch.positions.buffer,
            batch.positions.byteOffset,
            batch.positions.byteLength
          )
        );
        inputBuffers[index].validity.write(inputBuffers[index].mask);
      }
    };
    upload();
    output = options.transform.createGPUProjectionTable(device, {
      id: 'projection-table-benchmark',
      table: source,
      positions: 'positions',
      inputValidity: 'validity'
    });
    const graph = new GPUCommandGraph<void>(device);
    output.addToGraph(graph);
    const resourcePreparationTimeMilliseconds = getProjectionBenchmarkTime() - preparationStart;
    const compilationStart = getProjectionBenchmarkTime();
    compiled = graph.compile();
    const graphCompilationTimeMilliseconds = getProjectionBenchmarkTime() - compilationStart;
    const drainStart = getProjectionBenchmarkTime();
    const fence = device.createFence();
    try {
      await fence.signaled;
    } finally {
      fence.destroy();
    }
    const uploadDrainTimeMilliseconds = getProjectionBenchmarkTime() - drainStart;
    const firstStart = getProjectionBenchmarkTime();
    await executeGPUProjectionBenchmark(device, compiled, 'projection-table-first-use');
    const firstUseTimeMilliseconds = getProjectionBenchmarkTime() - firstStart;
    let maximumObservedError = 0;
    const projectedTable = output;
    const validate = async () => {
      maximumObservedError = Math.max(
        maximumObservedError,
        validateTableOutput(await readTableOutput(projectedTable), expected, options.maximumError)
      );
    };
    const paths: ProjectionTableBenchmarkReport['paths'] = [];
    for (const mode of ['resident', 'upload-project', 'round-trip'] as const) {
      await validate();
      const samples: number[] = [];
      for (let iteration = -warmupIterations; iteration < measuredIterations; iteration++) {
        const start = getProjectionBenchmarkTime();
        if (mode !== 'resident') upload();
        await executeGPUProjectionBenchmark(device, compiled, `projection-table-${mode}`);
        // Readback + binary64 decoding/metadata allocation are included only in this mode.
        const result = mode === 'round-trip' ? await readTableOutput(output) : undefined;
        const duration = getProjectionBenchmarkTime() - start;
        if (result)
          maximumObservedError = Math.max(
            maximumObservedError,
            validateTableOutput(result, expected, options.maximumError)
          );
        if (iteration >= 0) samples.push(duration);
      }
      await validate();
      const durationMilliseconds = summarizeProjectionBenchmarkSamples(samples);
      paths.push({
        mode,
        durationMilliseconds,
        sourceRowsPerSecond:
          durationMilliseconds.median > 0 ? (rowCount * 1000) / durationMilliseconds.median : null
      });
    }
    const input = ownedBuffers.reduce((total, buffer) => total + buffer.byteLength, 0);
    const outputBytes = output.table.batches.reduce(
      (total, batch) =>
        total +
        batch.gpuData['positions'].buffer.byteLength +
        batch.gpuData['validity'].buffer.byteLength,
      0
    );
    const dispatchCount = batchRowCounts.filter(count => count > 0).length;
    const parameters =
      options.transform.prepared.compiled.packParameters().byteLength * dispatchCount;
    const roundTrip = paths[2].durationMilliseconds.median;
    const operation = options.transform.prepared.program.operations[0];
    // ProjectionTableTransform accepts exactly one adaptive operation.
    if (operation.type !== 'adaptive') throw new Error('invalid table transform');
    return {
      device: {...device.info},
      provider: options.provider,
      consumer: 'projection-table',
      batchRowCounts,
      rowCount,
      validRows,
      dispatchCount,
      metadata: options.transform.prepared.compiled.metadata,
      plan: {
        bounds: [...operation.plan.bounds],
        degree: operation.plan.degree,
        patchCount: operation.plan.patches.length,
        tolerance: operation.plan.tolerance
      },
      destinationOrigin: [...output.projection.destinationOrigin],
      maximumAllowedError: options.maximumError,
      maximumObservedError,
      warmupIterations,
      measuredIterations,
      cpuTimeMilliseconds,
      cpuOutputByteLength: rowCount * 20,
      gpuBufferByteLength: {
        input,
        output: outputBytes,
        parameters,
        total: input + outputBytes + parameters
      },
      resourcePreparationTimeMilliseconds,
      graphCompilationTimeMilliseconds,
      uploadDrainTimeMilliseconds,
      firstUseTimeMilliseconds,
      paths,
      roundTripSpeedupOverCPU:
        roundTrip > 0 && cpuTimeMilliseconds.median > 0
          ? cpuTimeMilliseconds.median / roundTrip
          : null
    };
  } finally {
    compiled?.destroy();
    output?.destroy();
    source?.destroy();
    for (const buffer of ownedBuffers) buffer.destroy();
  }
}

type BenchmarkTableBatch = ProjectedTableBatch & {encodedPositions?: Float32Array};

async function readTableOutput(output: GPUProjectionTable): Promise<BenchmarkTableBatch[]> {
  const results: BenchmarkTableBatch[] = [];
  for (const batch of output.table.batches) {
    const positions = new Float64Array(batch.numRows * 2);
    let encodedPositions: Float32Array | undefined;
    let validity = new Uint32Array(batch.numRows);
    if (batch.numRows) {
      const positionData = batch.gpuData['positions'];
      const validityData = batch.gpuData['validity'];
      const positionBytes = await positionData.buffer.readAsync(
        positionData.byteOffset,
        batch.numRows * positionData.byteStride
      );
      const values = new Float32Array(
        positionBytes.buffer,
        positionBytes.byteOffset,
        positionBytes.byteLength / 4
      );
      encodedPositions = values;
      const validityBytes = await validityData.buffer.readAsync(
        validityData.byteOffset,
        batch.numRows * 4
      );
      validity = new Uint32Array(
        validityBytes.buffer,
        validityBytes.byteOffset,
        batch.numRows
      ).slice();
      for (let rowIndex = 0; rowIndex < batch.numRows; rowIndex++) {
        // Preserve invalid raw payloads too: validation must not hide nonzero/NaN GPU output.
        for (let axis = 0; axis < 2; axis++) {
          positions[rowIndex * 2 + axis] =
            output.projection.precision === 'double-single'
              ? values[rowIndex * 4 + axis * 2] + values[rowIndex * 4 + axis * 2 + 1]
              : values[rowIndex * 2 + axis] +
                (validity[rowIndex] ? output.projection.destinationOrigin[axis] : 0);
        }
      }
    }
    results.push({
      positions,
      encodedPositions,
      validity,
      numRows: batch.numRows,
      encoding: 'float64-absolute',
      sourceInfo: batch.sourceInfo ? {...batch.sourceInfo} : undefined,
      metadata: new Map(batch.schema.metadata)
    });
  }
  return results;
}

function validateTableOutput(
  actual: BenchmarkTableBatch[],
  expected: ProjectedTableBatch[],
  maximumError: number
): number {
  let maximumObservedError = 0;
  if (actual.length !== expected.length)
    throw new Error('projection table benchmark batch mismatch');
  for (const [index, reference] of expected.entries()) {
    const batch = actual[index];
    if (batch.numRows !== reference.numRows)
      throw new Error('projection table benchmark row mismatch');
    for (let rowIndex = 0; rowIndex < reference.numRows; rowIndex++) {
      // Inspect each raw component outside the timed readback/decode interval. Summing a
      // corrupted double-single pair could otherwise hide a nonzero invalid payload.
      if (!batch.validity[rowIndex] && batch.encodedPositions) {
        const width = batch.encodedPositions.length / batch.numRows;
        for (let component = 0; component < width; component++) {
          if (batch.encodedPositions[rowIndex * width + component] !== 0) {
            throw new Error('projection table benchmark invalid payload');
          }
        }
      }
      const error = Math.hypot(
        batch.positions[rowIndex * 2] - reference.positions[rowIndex * 2],
        batch.positions[rowIndex * 2 + 1] - reference.positions[rowIndex * 2 + 1]
      );
      if (
        batch.validity[rowIndex] !== reference.validity[rowIndex] ||
        !Number.isFinite(error) ||
        error > (reference.validity[rowIndex] ? maximumError : 0)
      ) {
        throw new Error(`projection table benchmark mismatch at batch ${index}, row ${rowIndex}`);
      }
      maximumObservedError = Math.max(maximumObservedError, error);
    }
  }
  return maximumObservedError;
}
