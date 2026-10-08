// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {projectionEngine} from '@math.gl/projection';
import type {SpatialReference} from '@math.gl/crs';
import type {CRSNormalizationOptions, TypeScriptCRSInput} from '@math.gl/projection/core';
import type {ProjectionEngine, ProjectionInstance} from '@math.gl/projection/types';
import {prepareProjectionReferences} from './projection-crs-input';
import {
  planProjection,
  ProjectionPlanningError,
  type PlanProjectionOptions,
  type ProjectionPlanningResult
} from './projection-planning';

export type PrepareCRSProjectionOptions = Omit<PlanProjectionOptions, 'projection'> & {
  from: TypeScriptCRSInput;
  to: TypeScriptCRSInput;
  enforceAxis?: boolean;
  /** Defaults to math.gl's eager catalog. Custom engines remain authoritative opaque oracles. */
  engine?: Pick<ProjectionEngine, 'createProjection' | 'createProjectionAsync'>;
  /** Must match the supplied engine's aliases/readers/datums; never inferred from its registry. */
  normalization?: CRSNormalizationOptions;
};

export type PreparedCRSProjectionResult =
  | (Extract<ProjectionPlanningResult, {status: 'ready'}> & {
      /** Retained prepared CPU transform, including reusable-output, flat and inverse APIs. */
      projection: ReturnType<ProjectionEngine['createProjection']>;
      /** Original immutable coordinate metadata, not approximation or geodetic accuracy claims. */
      spatialReferences: {readonly from: SpatialReference; readonly to: SpatialReference};
    })
  | Extract<ProjectionPlanningResult, {status: 'unsupported'}>;

/** Synchronous preparation never loads deferred algorithms. Use the async entry point to load. */
export function prepareCRSProjection(
  options: PrepareCRSProjectionOptions
): PreparedCRSProjectionResult {
  try {
    const references = prepareReferences(options);
    const projection = (options.engine ?? projectionEngine).createProjection({
      from: references[0].input,
      to: references[1].input,
      enforceAxis: options.enforceAxis,
      mode: 'strict'
    });
    return fitProjection(options, references, projection);
  } catch (error) {
    return preparationFailure(options, error);
  }
}

/** Explicit loading boundary; the resulting GPU plan and retained CPU transform are synchronous. */
export async function prepareCRSProjectionAsync(
  options: PrepareCRSProjectionOptions
): Promise<PreparedCRSProjectionResult> {
  try {
    const references = prepareReferences(options);
    const projection = await (options.engine ?? projectionEngine).createProjectionAsync({
      from: references[0].input,
      to: references[1].input,
      enforceAxis: options.enforceAxis,
      mode: 'strict'
    });
    return fitProjection(options, references, projection);
  } catch (error) {
    return preparationFailure(options, error);
  }
}

function prepareReferences(options: PrepareCRSProjectionOptions) {
  return prepareProjectionReferences([options.from, options.to], options.normalization);
}

function fitProjection(
  options: PrepareCRSProjectionOptions,
  references: ReturnType<typeof prepareReferences>,
  projection: ProjectionInstance | ReturnType<ProjectionEngine['createProjection']>
): PreparedCRSProjectionResult {
  const result = planProjection({...options, projection});
  return result.status === 'ready'
    ? {
        ...result,
        projection,
        spatialReferences: Object.freeze({
          from: references[0].reference,
          to: references[1].reference
        })
      }
    : result;
}

function preparationFailure(
  options: PrepareCRSProjectionOptions,
  error: unknown
): PreparedCRSProjectionResult {
  const reasons =
    error instanceof ProjectionPlanningError
      ? error.reasons
      : [
          {
            code: 'provider-unavailable' as const,
            message: error instanceof Error ? error.message : String(error)
          }
        ];
  if (options.onUnsupported === 'throw') throw new ProjectionPlanningError(reasons);
  return {status: 'unsupported', reasons};
}
