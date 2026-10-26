// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import type {Device} from '@luma.gl/core';
import type {CompiledProjection} from './projection-program';
import type {ProjectionProgramBenchmarkReport} from './projection-program-benchmark';

export type ProjectionExecutionSelection =
  | {status: 'unqualified'; reason: string}
  | {
      status: 'selected';
      mode: 'inline' | 'materialized';
      variantId: string;
      residentTimeMilliseconds: number;
      bufferByteLength: number;
      reason: string;
    };

/**
 * Chooses an existing fused-inline or shared-materialized path using an exact measured workload.
 * Never submits, allocates, changes arithmetic or extrapolates a synthetic consumer to rendering.
 * The workload key is caller-owned: change it when row distribution, update frequency or reuse
 * changes. Numeric program updates automatically invalidate the program signature.
 */
export function selectProjectionExecution(options: {
  report: ProjectionProgramBenchmarkReport;
  projection: CompiledProjection;
  device: Pick<Device, 'info' | 'features' | 'limits'>;
  environment: string;
  workloadKey: string;
  consumer: ProjectionProgramBenchmarkReport['consumer'];
  coordinateCount: number;
  consumerCount: number;
  maximumError: number;
  maximumBufferByteLength: number;
}): ProjectionExecutionSelection {
  const {report} = options;
  const decline = (reason: string): ProjectionExecutionSelection => ({
    status: 'unqualified',
    reason
  });
  if (
    !options.workloadKey ||
    !options.environment ||
    report.workloadKey !== options.workloadKey ||
    report.environment !== options.environment ||
    report.deviceSignature !== getProjectionDeviceSignature(options.device) ||
    report.consumer !== options.consumer ||
    report.coordinateCount !== options.coordinateCount ||
    report.consumerCount !== options.consumerCount
  )
    return decline('no matching device, environment and workload capture');
  if (report.timestampQueries || report.measuredIterations < 5 || report.warmupIterations < 2)
    return decline('selection requires warmed, uninstrumented production-shaped measurements');
  if (
    !Number.isFinite(options.maximumError) ||
    options.maximumError < 0 ||
    !Number.isSafeInteger(options.maximumBufferByteLength) ||
    options.maximumBufferByteLength < 0
  )
    return decline('invalid accuracy or memory budget');
  const signature = getProjectionProgramSignature(options.projection);
  const candidates = report.paths.filter(
    path =>
      path.programSignature === signature &&
      path.maximumAllowedError <= options.maximumError &&
      Number.isFinite(path.maximumObservedError) &&
      path.maximumObservedError <= path.maximumAllowedError &&
      path.bufferByteLength <= options.maximumBufferByteLength &&
      Object.values(path.encodeAndSynchronizedTimeMilliseconds).every(
        value => Number.isFinite(value) && value > 0
      )
  );
  if (!candidates.length)
    return decline('no validated matching program within accuracy and memory budgets');
  candidates.sort(
    (first, second) =>
      first.encodeAndSynchronizedTimeMilliseconds.median -
      second.encodeAndSynchronizedTimeMilliseconds.median
  );
  const selected = candidates[0];
  // Overlapping observed ranges do not establish a timing win. Prefer lower allocation in a tie.
  const tied = candidates.filter(
    candidate =>
      candidate.encodeAndSynchronizedTimeMilliseconds.minimum <=
      selected.encodeAndSynchronizedTimeMilliseconds.maximum
  );
  tied.sort((first, second) => first.bufferByteLength - second.bufferByteLength);
  const result = tied[0];
  return {
    status: 'selected',
    mode: result.mode,
    variantId: result.id,
    residentTimeMilliseconds: result.encodeAndSynchronizedTimeMilliseconds.median,
    bufferByteLength: result.bufferByteLength,
    reason:
      tied.length > 1
        ? 'timing ranges overlap; prefer lower measured memory'
        : 'lowest measured resident encode-and-fence time within budgets'
  };
}

/** @internal Snapshot enabled capabilities as well as the adapter's reported identity. */
export function getProjectionDeviceSignature(
  device: Pick<Device, 'info' | 'features' | 'limits'>
): string {
  const sortedEntries = (value: object) =>
    Object.entries(value).sort(([first], [second]) => first.localeCompare(second));
  return JSON.stringify({
    info: sortedEntries(device.info),
    features: [...device.features].filter(feature => device.features.has(feature)).sort(),
    // WebGPU limits are prototype accessors, not enumerable own properties.
    limits: [
      'maxBufferSize',
      'maxStorageBufferBindingSize',
      'maxStorageBuffersPerShaderStage',
      'minStorageBufferOffsetAlignment',
      'maxComputeWorkgroupStorageSize',
      'maxComputeInvocationsPerWorkgroup',
      'maxComputeWorkgroupSizeX',
      'maxComputeWorkgroupSizeY',
      'maxComputeWorkgroupSizeZ',
      'maxComputeWorkgroupsPerDimension'
    ].map(name => [name, device.limits[name as keyof Device['limits']]])
  });
}

/** Stable cache identity, not a security hash. Includes shader, input/output format and parameters. */
export function getProjectionProgramSignature(projection: CompiledProjection): string {
  let firstHash = 2166136261;
  let secondHash = 5381;
  const append = (value: number): void => {
    firstHash = Math.imul(firstHash ^ value, 16777619) >>> 0;
    secondHash = (Math.imul(secondHash, 33) ^ value) >>> 0;
  };
  const shader = projection.getShader().source;
  for (let index = 0; index < shader.length; index++) append(shader.charCodeAt(index));
  const words = projection.packParameters();
  for (const word of words) append(word);
  return `${shader.length}:${words.length}:${firstHash.toString(16)}:${secondHash.toString(16)}`;
}
