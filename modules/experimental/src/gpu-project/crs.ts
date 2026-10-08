// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {parsePROJString, type PROJStringAst, type ReadonlyCRSDefinition} from '@math.gl/crs';
import {Projection} from '@math.gl/projection';
import type {TypeScriptCRSInput} from '@math.gl/projection/core';
import {prepareCRSProjection} from './projection-engine';
import {prepareProjectionReferences} from './projection-crs-input';
export {prepareCRSProjection, prepareCRSProjectionAsync} from './projection-engine';
export type {PrepareCRSProjectionOptions, PreparedCRSProjectionResult} from './projection-engine';
export {createCRSProjectionCPUBenchmarks} from './projection-crs-benchmark';
import {
  evaluateProjectionProgram,
  invertProjectionProgram,
  type ProjectionProgram
} from './projection-program';
import {lowerProjectionPipeline} from './projection-pipeline';
import {normalizeCRSProviderDefinition} from './projection-crs-provider';
import {
  canUseCRSProvider,
  getCRSProviderReason,
  lowerCRSProjection
} from './projection-crs-lowering';
import type {ProjectionBounds, ProjectionProvider} from './types';

export type {ProjectionPlanningReason} from './projection-pipeline';

export {ProjectionPlanningError} from './projection-planning';
export type {
  ProjectionPlanningResult,
  AdaptiveProjectionOptions
} from './projection-planning';

import {
  ProjectionPlanningError,
  planAdaptiveProjection,
  ready,
  unsupported,
  applyFailurePolicy,
  type ProjectionPlanningResult,
  type AdaptiveProjectionOptions,
  type ProjectionOutputOptions
} from './projection-planning';

export type PlanProjectionPipelineOptions = ProjectionOutputOptions & {
  /** Syntax is parsed with the public math.gl 5 parser; no proj4js internals are used. */
  pipeline: string | PROJStringAst;
  /** Optional oracle for the ENTIRE pipeline, used only when native lowering is declined. */
  fallback?: AdaptiveProjectionOptions & {projection: ProjectionProvider};
};

export type PlanCRSProjectionOptions = ProjectionOutputOptions &
  Omit<AdaptiveProjectionOptions, 'bounds'> & {
    from: TypeScriptCRSInput;
    to: TypeScriptCRSInput;
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
  return applyFailurePolicy(planProjectionPipelineResult(options), options);
}

function planProjectionPipelineResult(
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
  return applyFailurePolicy(planCRSProjectionResult(options), options);
}

function planCRSProjectionResult(options: PlanCRSProjectionOptions): ProjectionPlanningResult {
  if ([options.from, options.to].some(input => typeof input !== 'string' && !('type' in input))) {
    if (options.allowAdaptive === false)
      return unsupported(
        'crs-requires-provider',
        'stored coordinate metadata requires provider planning'
      );
    if (!options.bounds)
      return unsupported('bounds-required', 'stored coordinate metadata requires explicit bounds');
    return prepareCRSProjection({...options, bounds: options.bounds});
  }
  return planCRSDefinitionProjection(
    options as PlanCRSProjectionOptions & {from: ReadonlyCRSDefinition; to: ReadonlyCRSDefinition}
  );
}

function planCRSDefinitionProjection(
  options: PlanCRSProjectionOptions & {from: ReadonlyCRSDefinition; to: ReadonlyCRSDefinition}
): ProjectionPlanningResult {
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
    // The normalized formula is also a binary64 CPU oracle with the native domain guard.
    // Retain that bounded domain in the high-precision fit; no float32 operation executes.
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
  const providerDefinitions: ReadonlyCRSDefinition[] = [];
  try {
    for (const definition of [options.from, options.to]) {
      const normalized = normalizeCRSProviderDefinition(definition);
      if ('reason' in normalized)
        return {status: 'unsupported', reasons: [...reasons, normalized.reason]};
      const reason = getCRSProviderReason(normalized.definition);
      if (reason) return {status: 'unsupported', reasons: [...reasons, reason]};
      if (
        typeof normalized.definition !== 'string' &&
        !isTwoDimensionalCRS(normalized.definition)
      ) {
        return unsupported('unsupported-dimensions', 'only 2D CRS definitions are supported');
      }
      providerDefinitions.push(normalized.definition);
    }
  } catch (error) {
    return unsupported('invalid-definition', error);
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
  let projection: Projection;
  try {
    prepareProjectionReferences([options.from, options.to]);
    projection = new Projection({
      from: providerDefinitions[0],
      to: providerDefinitions[1],
      enforceAxis: options.enforceAxis ?? false
    });
  } catch (error) {
    if (error instanceof ProjectionPlanningError)
      return {status: 'unsupported', reasons: error.reasons};
    return unsupported('provider-unavailable', error);
  }
  return planAdaptiveProjection(projection, {...options, bounds: options.bounds}, options, reasons);
}

function isTwoDimensionalCRS(
  definition: Exclude<ReadonlyCRSDefinition, string>
): definition is Exclude<ReadonlyCRSDefinition, string> {
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
