// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

export type {
  CompileProjectionPlanOptions,
  ProjectionBounds,
  ProjectionCoordinates,
  ProjectionDegree,
  ProjectionPatch,
  ProjectionPlan,
  ProjectionPrecision,
  ProjectionProvider
} from './types';

export {
  compileProjectionPlan,
  evaluateProjectionPlan,
  findProjectionPatch,
  packProjectionPlan,
  PROJECTION_PLAN_BOUNDS_WORD_LENGTH,
  PROJECTION_PATCH_WORD_LENGTH
} from './projection-plan';

export {
  createWebMercatorProjection,
  WEB_MERCATOR_EARTH_RADIUS,
  WEB_MERCATOR_MAX_LATITUDE
} from './web-mercator';

export {GPUProjection} from './gpu-projection';
export {selectProjectionExecution} from './projection-execution';
export type {ProjectionExecutionSelection} from './projection-execution';
export {indexProjectionPlan} from './projection-routing';
export type {ProjectionRoutingNode} from './projection-routing';
export {compileProjectionPartition, clipProjectionSegment} from './projection-partition';
export type {
  ProjectionDomainBranch,
  ProjectionPartitionOptions,
  ProjectionPartition,
  ProjectionSegment
} from './projection-partition';
export {planProjection, ProjectionPlanningError} from './projection-planning';
export type {
  PlanProjectionOptions,
  ProjectionPlanningResult,
  ProjectionPlanningReason,
  AdaptiveProjectionOptions,
  SynchronousProjectionProvider
} from './projection-planning';
export {
  CompiledProjection,
  compileProjectionProgram,
  invertProjectionProgram,
  evaluateProjectionProgram
} from './projection-program';
export type {
  ProjectionProgram,
  ProjectionOperation,
  ProjectionInputFormat,
  ProjectionShader
} from './projection-program';
export {GPUProjectionProgram} from './gpu-projection-program';
export {GPUProjectionTable} from './gpu-projection-table';
export type {GPUProjectionTableProps, ProjectedGPUTableColumns} from './gpu-projection-table';
export {getProjectionProgramMetadata} from './projection-metadata';
export type {
  ProjectionErrorMetadata,
  ProjectionStageMetadata,
  ProjectionProgramMetadata
} from './projection-metadata';
export type {GPUProjectionProgramProps} from './gpu-projection-program';
export type {LongitudeWrapOperation} from './projection-longitude-wrap';
export type {
  ConicOperation,
  LambertConformalConicOperation,
  AlbersEqualAreaOperation
} from './projection-conic';
export type {
  GPUProjectionDoubleSingleProps,
  GPUProjectionLocalFloat32Props,
  GPUProjectionPatchIds,
  GPUProjectionProps,
  GPUProjectionValidity
} from './gpu-projection';
