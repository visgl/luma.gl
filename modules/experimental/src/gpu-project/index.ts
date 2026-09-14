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
export type {
  GPUProjectionDoubleSingleProps,
  GPUProjectionLocalFloat32Props,
  GPUProjectionPatchIds,
  GPUProjectionProps,
  GPUProjectionValidity
} from './gpu-projection';
