// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {parsePROJString, type PROJStringAst, type ReadonlyCRSDefinition} from '@math.gl/crs';
import {Proj4Projection, toProj4CRSDefinition} from '@math.gl/proj4';
import {compileProjectionPlan} from './projection-plan';
import {
  compileProjectionProgram,
  evaluateProjectionProgram,
  invertProjectionProgram,
  type CompiledProjection,
  type ProjectionInputFormat,
  type ProjectionProgram
} from './projection-program';
import {lowerProjectionPipeline, type ProjectionPlanningReason} from './projection-pipeline';
import {
  canUseCRSProvider,
  getCRSProviderReason,
  lowerCRSProjection
} from './projection-crs-lowering';
import type {
  CompileProjectionPlanOptions,
  ProjectionBounds,
  ProjectionCoordinates,
  ProjectionPrecision,
  ProjectionProvider
} from './types';

export type {ProjectionPlanningReason} from './projection-pipeline';

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

type ProjectionOutputOptions = {
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

export type PlanProjectionPipelineOptions = ProjectionOutputOptions & {
  /** Syntax is parsed with the public math.gl 5 parser; no proj4js internals are used. */
  pipeline: string | PROJStringAst;
  /** Optional oracle for the ENTIRE pipeline, used only when native lowering is declined. */
  fallback?: AdaptiveProjectionOptions & {projection: ProjectionProvider};
};

export type PlanCRSProjectionOptions = ProjectionOutputOptions &
  Omit<AdaptiveProjectionOptions, 'bounds'> & {
    from: ReadonlyCRSDefinition;
    to: ReadonlyCRSDefinition;
    /** math.gl axis semantics, default false: longitude/easting first. */
    enforceAxis?: boolean;
    /** Required only when the transformation needs adaptive fitting. */
    bounds?: ProjectionBounds;
    /** Set to false to require native lowering without provider fitting. */
    allowAdaptive?: boolean;
  };

/** Compile the supported explicit PROJ pipeline subset, or use an explicitly supplied oracle. */
export function planProjectionPipeline(
  options: PlanProjectionPipelineOptions
): ProjectionPlanningResult {
  let lowered: ReturnType<typeof lowerProjectionPipeline>;
  try {
    lowered = lowerProjectionPipeline(
      typeof options.pipeline === 'string' ? parsePROJString(options.pipeline) : options.pipeline,
      options.projectionArithmetic
    );
  } catch (error) {
    return unsupported('invalid-definition', error);
  }
  if ('operations' in lowered) {
    try {
      return ready(
        {
          precision: options.precision ?? 'double-single',
          destinationOrigin: options.destinationOrigin,
          operations: lowered.operations
        },
        options,
        'native',
        []
      );
    } catch (error) {
      return unsupported('invalid-definition', error);
    }
  }
  if (
    !options.fallback ||
    lowered.reason.code === 'invalid-definition' ||
    lowered.reason.code === 'incompatible-units'
  ) {
    return {status: 'unsupported', reasons: [lowered.reason]};
  }
  return planAdaptiveProjection(options.fallback.projection, options.fallback, options, [
    lowered.reason
  ]);
}

/**
 * Lower explicit 2D CRS frames and opted-in formulas, or fit a bounded provider transformation.
 */
export function planCRSProjection(options: PlanCRSProjectionOptions): ProjectionPlanningResult {
  // PROJJSON dimensionality is explicit. Never silently extract a horizontal component.
  for (const definition of [options.from, options.to]) {
    if (typeof definition !== 'string' && !isTwoDimensionalCRS(definition)) {
      return unsupported(
        'unsupported-dimensions',
        'only explicit 2D geographic and projected CRS objects are supported'
      );
    }
  }
  let lowered: ReturnType<typeof lowerCRSProjection>;
  try {
    lowered = lowerCRSProjection(
      options.from,
      options.to,
      options.enforceAxis ?? false,
      options.projectionArithmetic
    );
    if ('operations' in lowered) {
      return ready(
        {
          precision: options.precision ?? 'double-single',
          destinationOrigin: options.destinationOrigin,
          operations: lowered.operations
        },
        options,
        'native',
        []
      );
    }
  } catch (error) {
    return unsupported('invalid-definition', error);
  }
  const reasons = [lowered.reason];
  if (options.allowAdaptive === false || !canUseCRSProvider(lowered.reason)) {
    return {status: 'unsupported', reasons};
  }
  if (lowered.reason.code === 'unsupported-arithmetic') {
    // The normalized formula is also a binary64 CPU oracle. Keep the default high-precision
    // path without sending Pseudo Mercator PROJJSON through a provider that treats it as
    // ellipsoidal Mercator. No float32 operation executes in the fitted GPU program.
    const analytic = lowerCRSProjection(
      options.from,
      options.to,
      options.enforceAxis ?? false,
      'float32'
    );
    if ('operations' in analytic && options.bounds) {
      const program: ProjectionProgram = {
        precision: 'double-single',
        operations: analytic.operations
      };
      const inverse = invertProjectionProgram(program);
      const project = (definition: ProjectionProgram, coordinates: number[]): number[] => {
        const result = evaluateProjectionProgram(definition, [coordinates[0], coordinates[1]]);
        return result.valid ? [...result.position] : [NaN, NaN];
      };
      return planAdaptiveProjection(
        {
          project: coordinates => project(program, coordinates),
          unproject: coordinates => project(inverse, coordinates)
        },
        {...options, bounds: options.bounds},
        options,
        reasons
      );
    }
    return {
      status: 'unsupported',
      reasons: [
        ...reasons,
        {code: 'bounds-required', message: 'adaptive CRS planning requires explicit source bounds'}
      ]
    };
  }
  for (const definition of [options.from, options.to]) {
    const reason = getCRSProviderReason(definition);
    if (reason) return {status: 'unsupported', reasons: [...reasons, reason]};
  }
  if (!options.bounds) {
    return {
      status: 'unsupported',
      reasons: [
        ...reasons,
        {code: 'bounds-required', message: 'adaptive CRS planning requires explicit source bounds'}
      ]
    };
  }
  let projection: Proj4Projection;
  try {
    projection = new Proj4Projection({
      from: toProj4CRSDefinition(options.from),
      to: toProj4CRSDefinition(options.to),
      enforceAxis: options.enforceAxis ?? false
    });
  } catch (error) {
    return unsupported('provider-unavailable', error);
  }
  return planAdaptiveProjection(projection, {...options, bounds: options.bounds}, options, reasons);
}

function planAdaptiveProjection(
  projection: ProjectionProvider,
  adaptive: AdaptiveProjectionOptions,
  output: ProjectionOutputOptions,
  reasons: readonly ProjectionPlanningReason[]
): ProjectionPlanningResult {
  try {
    const forward =
      typeof projection === 'function' ? projection : projection.project.bind(projection);
    const plan = compileProjectionPlan({
      ...adaptive,
      projection: coordinates => projectCoordinatePair(forward, coordinates),
      precision: 'double-single'
    });
    let inversePlan;
    if (adaptive.inverse) {
      if (typeof projection === 'function' || !projection.unproject) {
        return unsupported(
          'provider-unavailable',
          'inverse fitting requires an unproject provider'
        );
      }
      const inverse = projection.unproject.bind(projection);
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
  if (result.length !== 2) {
    throw new Error('projection provider must return exactly two coordinates');
  }
  return result;
}

function ready(
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

function unsupported(
  code: ProjectionPlanningReason['code'],
  error: unknown
): ProjectionPlanningResult {
  return {
    status: 'unsupported',
    reasons: [{code, message: error instanceof Error ? error.message : String(error)}]
  };
}

function isTwoDimensionalCRS(definition: Exclude<ReadonlyCRSDefinition, string>): boolean {
  switch (definition.type) {
    case 'GeographicCRS':
    case 'GeodeticCRS':
      return (
        definition.coordinate_system?.subtype === 'ellipsoidal' &&
        definition.coordinate_system.axis.length === 2
      );
    case 'ProjectedCRS':
      return (
        definition.coordinate_system?.subtype === 'Cartesian' &&
        definition.coordinate_system.axis.length === 2 &&
        definition.base_crs.coordinate_system?.axis.length === 2
      );
    default:
      return false;
  }
}
