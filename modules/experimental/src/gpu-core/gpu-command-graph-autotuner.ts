// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {
  GPUCommandGraphPreflightReport,
  GPUCommandGraphTimingReport
} from './gpu-command-graph-types';

const PROFILE_VERSION = 1;

/** Stable adapter identity used to isolate persisted calibration measurements. */
export type GPUCommandGraphAdapterIdentity = Readonly<{
  /** Stable serialization of the fields below. */
  key: string;
  type: string;
  vendor: string;
  renderer: string;
  version: string;
  gpu: string;
  gpuType: string;
  gpuArchitecture?: string;
  gpuBackend?: string;
  featureLevel?: string;
  features: readonly string[];
  subgroupMinSize?: number;
  subgroupMaxSize?: number;
  maxComputeInvocationsPerWorkgroup: number;
  maxComputeWorkgroupsPerDimension: number;
}>;

/** One equivalent implementation offered to the generic kernel selector. */
export type GPUCommandGraphKernelCandidate = Readonly<{
  id: string;
  /** Caller-evaluated capability or correctness constraint. Default `true`. */
  supported?: boolean;
}>;

/** One adapter-local timing aggregate that can be persisted as JSON. */
export type GPUCommandGraphKernelCalibration = Readonly<{
  operation: string;
  variant: string;
  workloadBucket: number;
  sampleCount: number;
  meanWorkloadSize: number;
  meanDurationMilliseconds: number;
  durationStandardDeviationMilliseconds: number;
}>;

/** Serializable calibration profile. Storage remains an application responsibility. */
export type GPUCommandGraphAutotuningProfile = Readonly<{
  version: typeof PROFILE_VERSION;
  adapter: GPUCommandGraphAdapterIdentity;
  calibrations: readonly GPUCommandGraphKernelCalibration[];
}>;

/** Configuration for generic adapter-local kernel selection. */
export type GPUCommandGraphAutotunerProps = {
  adapter: GPUCommandGraphAdapterIdentity;
  /** Previously persisted profile for the same adapter. Mismatched profiles are ignored. */
  profile?: GPUCommandGraphAutotuningProfile;
  /** Samples collected for each candidate and workload bucket before exploitation. Default `1`. */
  minimumSampleCount?: number;
  /** Whether undersampled supported variants are selected deterministically. Default `true`. */
  explorationEnabled?: boolean;
};

/** Input for one equivalent-kernel decision. */
export type GPUCommandGraphKernelSelectionRequest = {
  operation: string;
  candidates: readonly GPUCommandGraphKernelCandidate[];
  /** Logical rows or maximum shader invocations represented by this decision. */
  workloadSize: number;
};

/** Immutable explanation of one adapter-local kernel decision. */
export type GPUCommandGraphKernelSelection = Readonly<{
  operation: string;
  variant: string;
  workloadSize: number;
  workloadBucket: number;
  reason: 'exploration' | 'calibrated' | 'fallback';
  sampleCount: number;
  estimatedDurationMilliseconds?: number;
}>;

/** Explicit timing sample for one equivalent kernel. */
export type GPUCommandGraphKernelObservation = {
  operation: string;
  variant: string;
  workloadSize: number;
  durationMilliseconds: number;
};

type MutableCalibration = {
  operation: string;
  variant: string;
  workloadBucket: number;
  sampleCount: number;
  meanWorkloadSize: number;
  meanDurationMilliseconds: number;
  durationSquaredDifferenceSum: number;
};

/**
 * Learns equivalent-kernel performance independently for each adapter and workload-size bucket.
 *
 * The tuner never compiles, submits, or stores browser data. Callers select a variant while
 * constructing a graph, publish explicit GPU timing observations after submission, and decide if
 * and where the returned JSON-safe profile should be persisted.
 */
export class GPUCommandGraphAutotuner {
  readonly adapter: GPUCommandGraphAdapterIdentity;
  readonly minimumSampleCount: number;
  readonly explorationEnabled: boolean;

  private readonly calibrations = new Map<string, MutableCalibration>();

  constructor(props: GPUCommandGraphAutotunerProps) {
    if (
      !Number.isSafeInteger(props.minimumSampleCount ?? 1) ||
      (props.minimumSampleCount ?? 1) <= 0
    ) {
      throw new Error(
        'GPUCommandGraph autotuner minimumSampleCount must be a positive safe integer'
      );
    }
    this.adapter = freezeAdapterIdentity(props.adapter);
    this.minimumSampleCount = props.minimumSampleCount ?? 1;
    this.explorationEnabled = props.explorationEnabled ?? true;
    if (
      props.profile?.adapter.key === this.adapter.key &&
      props.profile.version === PROFILE_VERSION
    ) {
      for (const calibration of props.profile.calibrations) {
        this.importCalibration(calibration);
      }
    }
  }

  /** Selects one supported implementation using deterministic exploration and learned timings. */
  selectKernel(request: GPUCommandGraphKernelSelectionRequest): GPUCommandGraphKernelSelection {
    validateIdentifier(request.operation, 'operation');
    validateWorkloadSize(request.workloadSize);
    const supportedCandidates = request.candidates.filter(
      candidate => candidate.supported !== false
    );
    if (supportedCandidates.length === 0) {
      throw new Error(
        `GPUCommandGraph autotuner operation "${request.operation}" has no supported variants`
      );
    }
    for (const candidate of supportedCandidates) validateIdentifier(candidate.id, 'variant');
    const workloadBucket = getWorkloadBucket(request.workloadSize);
    const candidates = supportedCandidates.map(candidate => {
      const calibration = this.findNearestCalibration(
        request.operation,
        candidate.id,
        workloadBucket
      );
      return {
        candidate,
        calibration,
        sampleCount: calibration?.workloadBucket === workloadBucket ? calibration.sampleCount : 0,
        estimatedDurationMilliseconds: calibration
          ? estimateDuration(calibration, request.workloadSize)
          : undefined
      };
    });
    if (this.explorationEnabled) {
      const exploration = candidates.find(
        candidate => candidate.sampleCount < this.minimumSampleCount
      );
      if (exploration) {
        return Object.freeze({
          operation: request.operation,
          variant: exploration.candidate.id,
          workloadSize: request.workloadSize,
          workloadBucket,
          reason: 'exploration',
          sampleCount: exploration.sampleCount,
          ...(exploration.estimatedDurationMilliseconds === undefined
            ? {}
            : {estimatedDurationMilliseconds: exploration.estimatedDurationMilliseconds})
        });
      }
    }
    const calibrated = candidates
      .filter(candidate => candidate.estimatedDurationMilliseconds !== undefined)
      .sort(
        (left, right) =>
          (left.estimatedDurationMilliseconds ?? Number.POSITIVE_INFINITY) -
          (right.estimatedDurationMilliseconds ?? Number.POSITIVE_INFINITY)
      )[0];
    const selected = calibrated ?? candidates[0];
    return Object.freeze({
      operation: request.operation,
      variant: selected.candidate.id,
      workloadSize: request.workloadSize,
      workloadBucket,
      reason: calibrated ? 'calibrated' : 'fallback',
      sampleCount: selected.calibration?.sampleCount ?? 0,
      ...(selected.estimatedDurationMilliseconds === undefined
        ? {}
        : {estimatedDurationMilliseconds: selected.estimatedDurationMilliseconds})
    });
  }

  /** Records one completed GPU timing sample. */
  observeKernel(observation: GPUCommandGraphKernelObservation): GPUCommandGraphKernelCalibration {
    validateIdentifier(observation.operation, 'operation');
    validateIdentifier(observation.variant, 'variant');
    validateWorkloadSize(observation.workloadSize);
    if (
      !Number.isFinite(observation.durationMilliseconds) ||
      observation.durationMilliseconds < 0
    ) {
      throw new Error('GPUCommandGraph autotuner durationMilliseconds must be nonnegative');
    }
    const workloadBucket = getWorkloadBucket(observation.workloadSize);
    const key = getCalibrationKey(observation.operation, observation.variant, workloadBucket);
    const calibration =
      this.calibrations.get(key) ??
      ({
        operation: observation.operation,
        variant: observation.variant,
        workloadBucket,
        sampleCount: 0,
        meanWorkloadSize: 0,
        meanDurationMilliseconds: 0,
        durationSquaredDifferenceSum: 0
      } satisfies MutableCalibration);
    calibration.sampleCount++;
    calibration.meanWorkloadSize +=
      (observation.workloadSize - calibration.meanWorkloadSize) / calibration.sampleCount;
    const durationDifference =
      observation.durationMilliseconds - calibration.meanDurationMilliseconds;
    calibration.meanDurationMilliseconds += durationDifference / calibration.sampleCount;
    calibration.durationSquaredDifferenceSum +=
      durationDifference *
      (observation.durationMilliseconds - calibration.meanDurationMilliseconds);
    this.calibrations.set(key, calibration);
    return freezeCalibration(calibration);
  }

  /**
   * Records every GPU-timed preflight node that declares both an operation and equivalent variant.
   */
  observeTimingReport(
    timingReport: GPUCommandGraphTimingReport,
    preflight: GPUCommandGraphPreflightReport
  ): number {
    const preflightNodes = new Map(preflight.nodes.map(node => [node.id, node]));
    let observationCount = 0;
    for (const timing of timingReport.nodes) {
      const node = preflightNodes.get(timing.id);
      if (timing.gpuTimeMilliseconds === undefined || !node?.operation || !node.variant) {
        continue;
      }
      this.observeKernel({
        operation: node.operation,
        variant: node.variant,
        workloadSize: Math.max(node.maximumInvocationCount, 1),
        durationMilliseconds: timing.gpuTimeMilliseconds
      });
      observationCount++;
    }
    return observationCount;
  }

  /** Returns a deterministic JSON-safe profile for application-managed persistence. */
  exportProfile(): GPUCommandGraphAutotuningProfile {
    const calibrations = [...this.calibrations.values()]
      .sort(
        (left, right) =>
          left.operation.localeCompare(right.operation) ||
          left.variant.localeCompare(right.variant) ||
          left.workloadBucket - right.workloadBucket
      )
      .map(freezeCalibration);
    return Object.freeze({
      version: PROFILE_VERSION,
      adapter: this.adapter,
      calibrations: Object.freeze(calibrations)
    });
  }

  /** Clears all learned measurements without changing adapter identity or selection policy. */
  reset(): void {
    this.calibrations.clear();
  }

  private importCalibration(calibration: GPUCommandGraphKernelCalibration): void {
    if (
      !calibration.operation ||
      !calibration.variant ||
      !Number.isSafeInteger(calibration.workloadBucket) ||
      !Number.isSafeInteger(calibration.sampleCount) ||
      calibration.sampleCount <= 0 ||
      !Number.isFinite(calibration.meanWorkloadSize) ||
      calibration.meanWorkloadSize <= 0 ||
      !Number.isFinite(calibration.meanDurationMilliseconds) ||
      calibration.meanDurationMilliseconds < 0
    ) {
      return;
    }
    this.calibrations.set(
      getCalibrationKey(calibration.operation, calibration.variant, calibration.workloadBucket),
      {
        operation: calibration.operation,
        variant: calibration.variant,
        workloadBucket: calibration.workloadBucket,
        sampleCount: calibration.sampleCount,
        meanWorkloadSize: calibration.meanWorkloadSize,
        meanDurationMilliseconds: calibration.meanDurationMilliseconds,
        durationSquaredDifferenceSum:
          calibration.sampleCount > 1
            ? calibration.durationStandardDeviationMilliseconds ** 2 * (calibration.sampleCount - 1)
            : 0
      }
    );
  }

  private findNearestCalibration(
    operation: string,
    variant: string,
    workloadBucket: number
  ): MutableCalibration | undefined {
    const exact = this.calibrations.get(getCalibrationKey(operation, variant, workloadBucket));
    if (exact) return exact;
    let nearest: MutableCalibration | undefined;
    for (const calibration of this.calibrations.values()) {
      if (calibration.operation !== operation || calibration.variant !== variant) continue;
      if (
        !nearest ||
        Math.abs(calibration.workloadBucket - workloadBucket) <
          Math.abs(nearest.workloadBucket - workloadBucket)
      ) {
        nearest = calibration;
      }
    }
    return nearest;
  }
}

/** Captures a stable, serializable identity for the current luma.gl device. */
export function getGPUCommandGraphAdapterIdentity(device: Device): GPUCommandGraphAdapterIdentity {
  const features = [...device.features].sort();
  const fields = {
    type: device.info.type,
    vendor: device.info.vendor,
    renderer: device.info.renderer,
    version: device.info.version,
    gpu: device.info.gpu,
    gpuType: device.info.gpuType,
    ...(device.info.gpuArchitecture ? {gpuArchitecture: device.info.gpuArchitecture} : {}),
    ...(device.info.gpuBackend ? {gpuBackend: device.info.gpuBackend} : {}),
    ...(device.info.featureLevel ? {featureLevel: device.info.featureLevel} : {}),
    features: Object.freeze(features),
    ...(device.info.subgroupMinSize === undefined
      ? {}
      : {subgroupMinSize: device.info.subgroupMinSize}),
    ...(device.info.subgroupMaxSize === undefined
      ? {}
      : {subgroupMaxSize: device.info.subgroupMaxSize}),
    maxComputeInvocationsPerWorkgroup: device.limits.maxComputeInvocationsPerWorkgroup,
    maxComputeWorkgroupsPerDimension: device.limits.maxComputeWorkgroupsPerDimension
  };
  return Object.freeze({key: JSON.stringify(fields), ...fields});
}

function freezeAdapterIdentity(
  adapter: GPUCommandGraphAdapterIdentity
): GPUCommandGraphAdapterIdentity {
  return Object.freeze({...adapter, features: Object.freeze([...adapter.features])});
}

function freezeCalibration(calibration: MutableCalibration): GPUCommandGraphKernelCalibration {
  return Object.freeze({
    operation: calibration.operation,
    variant: calibration.variant,
    workloadBucket: calibration.workloadBucket,
    sampleCount: calibration.sampleCount,
    meanWorkloadSize: calibration.meanWorkloadSize,
    meanDurationMilliseconds: calibration.meanDurationMilliseconds,
    durationStandardDeviationMilliseconds:
      calibration.sampleCount > 1
        ? Math.sqrt(calibration.durationSquaredDifferenceSum / (calibration.sampleCount - 1))
        : 0
  });
}

function estimateDuration(calibration: MutableCalibration, workloadSize: number): number {
  return (
    calibration.meanDurationMilliseconds *
    (workloadSize / Math.max(calibration.meanWorkloadSize, 1))
  );
}

function getWorkloadBucket(workloadSize: number): number {
  return Math.floor(Math.log2(Math.max(workloadSize, 1)));
}

function getCalibrationKey(operation: string, variant: string, workloadBucket: number): string {
  return `${operation}\u0000${variant}\u0000${workloadBucket}`;
}

function validateIdentifier(value: string, name: string): void {
  if (!value) throw new Error(`GPUCommandGraph autotuner ${name} is required`);
}

function validateWorkloadSize(workloadSize: number): void {
  if (!Number.isSafeInteger(workloadSize) || workloadSize <= 0) {
    throw new Error('GPUCommandGraph autotuner workloadSize must be a positive safe integer');
  }
}
