// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {compileProjectionPlan} from './projection-plan';
import {
  compileProjectionProgram,
  type CompiledProjection,
  type ProjectionInputFormat,
  type ProjectionProgram
} from './projection-program';
import type {
  CompileProjectionPlanOptions,
  ProjectionBounds,
  ProjectionCoordinates,
  ProjectionPrecision,
  ProjectionProvider
} from './types';

export type ProjectionPlanningReason = {
  readonly code:
    | 'invalid-definition'
    | 'unsupported-parameter'
    | 'unsupported-operation'
    | 'unsupported-arithmetic'
    | 'unsupported-dimensions'
    | 'unsupported-coordinate-system'
    | 'unsupported-datum'
    | 'unsupported-conversion'
    | 'datum-transformation-required'
    | 'bounds-required'
    | 'unsupported-unit'
    | 'incompatible-units'
    | 'crs-requires-provider'
    | 'provider-unavailable'
    | 'approximation-failed';
  readonly step?: number;
  readonly parameter?: string;
  readonly message: string;
};

/**
 * Structural subset shared by current and upcoming math.gl prepared transforms.
 * Preparation/loading stays with the caller; these methods must never return promises.
 */
export type SynchronousProjectionProvider = {
  projectSync: (coordinates: readonly number[]) => number[];
  unprojectSync?: (coordinates: readonly number[]) => number[];
  /** A provider that discarded coordinate semantics cannot satisfy this strict 2D planner. */
  readonly lossy?: boolean;
};

export type ProjectionPlanningResult =
  | {
      status: 'ready';
      strategy: 'native' | 'adaptive';
      program: ProjectionProgram;
      compiled: CompiledProjection;
      /** Why native lowering was declined when the adaptive backend was selected. */
      reasons: readonly ProjectionPlanningReason[];
    }
  | {status: 'unsupported'; reasons: readonly ProjectionPlanningReason[]};

export type ProjectionOutputOptions = {
  /** Return structured unsupported results by default, or throw with the same reasons. */
  onUnsupported?: 'return' | 'throw';
  precision?: ProjectionPrecision;
  /** Native nonlinear arithmetic. Default double-single retains bounded adaptive fitting. */
  projectionArithmetic?: 'double-single' | 'float32';
  inputFormat?: ProjectionInputFormat;
  destinationOrigin?: ProjectionCoordinates;
};

export type AdaptiveProjectionOptions = Pick<
  CompileProjectionPlanOptions,
  'bounds' | 'tolerance' | 'degree' | 'maxDepth' | 'maxPatches' | 'sampleCount'
> & {
  /** Explicit destination-coordinate domain for a separately fitted inverse. */
  inverse?: {bounds: ProjectionBounds; tolerance: number};
};

/** Fit the caller's complete, already configured 2D transform without resolving CRS definitions. */
export type PlanProjectionOptions = Omit<ProjectionOutputOptions, 'projectionArithmetic'> &
  AdaptiveProjectionOptions & {
    projection: ProjectionProvider | SynchronousProjectionProvider;
  };

/**
 * Plan an opaque provider as a bounded adaptive program. Never substitutes native formulas,
 * loads algorithms, or creates GPU resources. Defaults to raw binary64 input/double-single output.
 */
export function planProjection(options: PlanProjectionOptions): ProjectionPlanningResult {
  return applyFailurePolicy(
    planAdaptiveProjection(options.projection, options, options, []),
    options
  );
}

export function planAdaptiveProjection(
  projection: ProjectionProvider | SynchronousProjectionProvider,
  adaptive: AdaptiveProjectionOptions,
  output: ProjectionOutputOptions,
  reasons: readonly ProjectionPlanningReason[]
): ProjectionPlanningResult {
  try {
    if (typeof projection !== 'function' && 'lossy' in projection && projection.lossy) {
      return unsupported('unsupported-dimensions', 'lossy projection providers are not supported');
    }
    // Prefer the synchronous pair even when the provider also exposes deferred methods.
    const synchronous = typeof projection !== 'function' && 'projectSync' in projection;
    const forward =
      typeof projection === 'function'
        ? projection
        : synchronous
          ? projection.projectSync.bind(projection)
          : projection.project.bind(projection);
    const inverse =
      typeof projection === 'function'
        ? undefined
        : synchronous
          ? projection.unprojectSync?.bind(projection)
          : projection.unproject?.bind(projection);
    if (adaptive.inverse && !inverse) {
      return unsupported('provider-unavailable', 'inverse fitting requires an inverse provider');
    }
    const plan = compileProjectionPlan({
      ...adaptive,
      projection: coordinates => projectCoordinatePair(forward, coordinates),
      precision: 'double-single'
    });
    let inversePlan;
    if (adaptive.inverse && inverse) {
      inversePlan = compileProjectionPlan({
        ...adaptive,
        ...adaptive.inverse,
        projection: coordinates => projectCoordinatePair(inverse, coordinates),
        precision: 'double-single'
      });
    }
    return ready(
      {
        precision: output.precision ?? 'double-single',
        destinationOrigin: output.destinationOrigin ?? plan.destinationOrigin,
        operations: [{type: 'adaptive', plan, inversePlan}]
      },
      output,
      'adaptive',
      reasons
    );
  } catch (error) {
    return {
      status: 'unsupported',
      reasons: [
        ...reasons,
        {
          code: 'approximation-failed',
          message: error instanceof Error ? error.message : String(error)
        }
      ]
    };
  }
}

function projectCoordinatePair(
  project: (coordinates: number[]) => number[],
  coordinates: number[]
): number[] {
  const result = project(coordinates);
  if (!Array.isArray(result) || result.length !== 2) {
    throw new Error('projection provider must return exactly two coordinates');
  }
  return result;
}

export function ready(
  program: ProjectionProgram,
  options: ProjectionOutputOptions,
  strategy: 'native' | 'adaptive',
  reasons: readonly ProjectionPlanningReason[]
): ProjectionPlanningResult {
  return {
    status: 'ready',
    strategy,
    program,
    compiled: compileProjectionProgram(program, {
      inputFormat: options.inputFormat ?? 'uint32x4'
    }),
    reasons
  };
}

export function unsupported(
  code: ProjectionPlanningReason['code'],
  error: unknown
): ProjectionPlanningResult {
  return {
    status: 'unsupported',
    reasons: [{code, message: error instanceof Error ? error.message : String(error)}]
  };
}

/** Optional throwing interface; the same structured reasons are available to callers. */
export class ProjectionPlanningError extends Error {
  readonly reasons: readonly ProjectionPlanningReason[];

  constructor(reasons: readonly ProjectionPlanningReason[]) {
    super(reasons.map(reason => reason.message).join('; '));
    this.name = 'ProjectionPlanningError';
    this.reasons = Object.freeze(reasons.map(reason => Object.freeze({...reason})));
  }
}

export function applyFailurePolicy(
  result: ProjectionPlanningResult,
  options: ProjectionOutputOptions
): ProjectionPlanningResult {
  if (result.status === 'unsupported' && options.onUnsupported === 'throw')
    throw new ProjectionPlanningError(result.reasons);
  return result;
}
