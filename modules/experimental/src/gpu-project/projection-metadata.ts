// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import type {ProjectionInputFormat, ProjectionProgram} from './projection-program';
import type {ProjectionBounds, ProjectionPrecision} from './types';
import {getWebMercatorBounds} from './projection-web-mercator';
import {getTransverseMercatorBounds} from './projection-transverse-mercator';
import {getLongitudeWrapParameters} from './projection-longitude-wrap';

/** Estimates exclude input quantization, native series truncation and native/output rounding. */
export type ProjectionErrorMetadata = {
  readonly kind: 'none' | 'sampled-estimate' | 'unknown';
  /** Euclidean error in this stage's output units; null means composition is not bounded. */
  readonly maximum: number | null;
  /** Sampling alone cannot establish a global numerical guarantee. */
  readonly guaranteed: false;
};

export type ProjectionStageMetadata = {
  readonly index: number;
  readonly operation: ProjectionProgram['operations'][number]['type'];
  readonly arithmetic: 'float32' | 'double-single';
  readonly inputDimensions: 2;
  readonly outputDimensions: 2;
  /** Stage-input envelope (null: finite only); nonlinear inverses also check their footprint. */
  readonly inputBounds: ProjectionBounds | null;
  readonly invertible: boolean;
  /** Explicit angular seam policy; normalization always discards the original turn count. */
  readonly longitudeWrap?: {
    readonly interval: readonly [number, number];
    readonly seamTolerance: number;
    readonly seamValidity: 'invalid';
  };
  /** Maximum Euclidean amplification for a native linear stage; null for nonlinear stages. */
  readonly errorAmplification: number | null;
  readonly approximationError: ProjectionErrorMetadata;
};

export type ProjectionProgramMetadata = {
  readonly inputDimensions: 2;
  readonly outputDimensions: 2;
  readonly inputFormat: ProjectionInputFormat;
  readonly inputEncoding: 'float32' | 'double-single' | 'binary64';
  readonly arithmetic: 'double-single' | 'mixed';
  readonly outputPrecision: ProjectionPrecision;
  readonly outputFrame: 'absolute' | 'origin-relative';
  readonly validity: 'upstream-and-finite-and-stage-domain';
  readonly invertible: boolean;
  readonly approximationError: ProjectionErrorMetadata;
  readonly stages: readonly ProjectionStageMetadata[];
};

/**
 * Snapshot the numerical contract without allocating GPU resources.
 *
 * Native scales propagate preceding sampled error estimates. An adaptive stage after another
 * adaptive stage has unknown composed error: neither a derivative bound for the provider nor
 * continuity across patch boundaries is established by the sampled plans.
 */
export function getProjectionProgramMetadata(
  program: ProjectionProgram,
  inputFormat: ProjectionInputFormat = 'float32x2'
): ProjectionProgramMetadata {
  let maximum: number | null = 0;
  let sampled = false;
  const stages = program.operations.map((operation, index): ProjectionStageMetadata => {
    let amplification: number | null = 1;
    let inputBounds: ProjectionBounds | null = null;
    let invertible = true;
    switch (operation.type) {
      case 'longitude-wrap':
        inputBounds = Object.freeze(getLongitudeWrapParameters(operation).inputBounds);
        amplification = null;
        invertible = false;
        // A preceding approximation may cross the discontinuity or its invalid guard band.
        if (maximum !== 0) maximum = null;
        break;
      case 'axis':
        break;
      case 'unit':
        amplification = Math.abs(operation.inverse ? 1 / operation.factor : operation.factor);
        break;
      case 'affine':
        amplification = Math.max(
          ...operation.scale.map(value => Math.abs(operation.inverse ? 1 / value : value))
        );
        break;
      case 'web-mercator':
      case 'transverse-mercator':
        amplification = null;
        inputBounds = Object.freeze(
          operation.type === 'web-mercator'
            ? getWebMercatorBounds(operation)
            : getTransverseMercatorBounds(operation)
        );
        // No global derivative/rounding bound is promised for the analytic fast path.
        if (maximum !== 0) maximum = null;
        break;
      case 'adaptive':
        amplification = null;
        inputBounds = Object.freeze([...operation.plan.bounds]) as ProjectionBounds;
        invertible = Boolean(operation.inversePlan);
        maximum = sampled ? null : operation.plan.doubleSingleMaxError;
        sampled = true;
        break;
    }
    if (amplification !== null && maximum !== null) {
      maximum *= amplification;
    }
    if (maximum !== null && !Number.isFinite(maximum)) {
      maximum = null;
    }
    return Object.freeze({
      index,
      operation: operation.type,
      arithmetic:
        operation.type === 'web-mercator' || operation.type === 'transverse-mercator'
          ? 'float32'
          : 'double-single',
      inputDimensions: 2,
      outputDimensions: 2,
      inputBounds,
      invertible,
      ...(operation.type === 'longitude-wrap'
        ? {
            longitudeWrap: Object.freeze({
              interval: Object.freeze([operation.interval[0], operation.interval[1]] as const),
              seamTolerance: getLongitudeWrapParameters(operation).seamTolerance,
              seamValidity: 'invalid' as const
            })
          }
        : {}),
      errorAmplification: amplification,
      approximationError: makeErrorMetadata(maximum, sampled)
    });
  });
  return Object.freeze({
    inputDimensions: 2,
    outputDimensions: 2,
    inputFormat,
    inputEncoding:
      inputFormat === 'uint32x4'
        ? 'binary64'
        : inputFormat === 'float32x4'
          ? 'double-single'
          : 'float32',
    arithmetic: stages.some(stage => stage.arithmetic === 'float32') ? 'mixed' : 'double-single',
    outputPrecision: program.precision,
    outputFrame: program.precision === 'local-f32' ? 'origin-relative' : 'absolute',
    validity: 'upstream-and-finite-and-stage-domain',
    invertible: stages.every(stage => stage.invertible),
    approximationError: makeErrorMetadata(maximum, sampled),
    stages: Object.freeze(stages)
  });
}

function makeErrorMetadata(maximum: number | null, sampled: boolean): ProjectionErrorMetadata {
  return Object.freeze({
    kind: maximum === null ? 'unknown' : sampled ? 'sampled-estimate' : 'none',
    maximum,
    guaranteed: false
  });
}
