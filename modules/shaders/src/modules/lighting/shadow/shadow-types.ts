// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Matrix4, NumberArray3, NumberArray16} from '@math.gl/core';

/** Minimal texture metadata used to select backend-specific sampler bindings. */
export type ShadowTexture = {readonly device: {readonly type: string}};

export type ShadowBiasProps = {
  /** Receiver displacement along the world-space normal. */
  normalBias?: number;
  /** Constant raster depth bias applied by the caster pipeline. */
  depthBias?: number;
  /** Slope-scaled raster depth bias applied by the caster pipeline. */
  depthBiasSlopeScale?: number;
  /** Fraction of the direct-light contribution affected by the shadow. */
  strength?: number;
};

/** Directional light shadow configuration. `direction` points from a surface toward the light. */
export type DirectionalShadowLight = ShadowBiasProps & {
  direction: Readonly<NumberArray3>;
  shadowDistance?: number;
  casterDistance?: number;
  sourceAngularRadius?: number;
  cascadeSplitLambda?: number;
  cascadeBlendFraction?: number;
  farFadeFraction?: number;
};

/** Perspective shadow configuration for a spot light. */
export type SpotShadowLight = ShadowBiasProps & {
  position: Readonly<NumberArray3>;
  direction: Readonly<NumberArray3>;
  range: number;
  outerConeAngle: number;
  nearPlane?: number;
  sourceRadius?: number;
};

/** Cube-array shadow configuration for an omnidirectional point light. */
export type PointShadowLight = ShadowBiasProps & {
  position: Readonly<NumberArray3>;
  range: number;
  nearPlane?: number;
  sourceRadius?: number;
};

/** Fully resolved props returned by the renderer and consumed by the `shadow` shader module. */
export type ShadowProps<TextureT extends ShadowTexture = ShadowTexture, SamplerT = unknown> = {
  quality: 'low' | 'balanced' | 'cinematic';
  cascadeCount: number;
  cascadeSplits: readonly number[];
  blockerSampleCount: number;
  filterSampleCount: number;
  directionalLights: readonly DirectionalShadowLight[];
  spotLights: readonly SpotShadowLight[];
  pointLights: readonly PointShadowLight[];
  directionalViewProjectionMatrices: readonly Readonly<Matrix4 | NumberArray16>[];
  spotViewProjectionMatrices: readonly Readonly<Matrix4 | NumberArray16>[];
  pointViewProjectionMatrices: readonly Readonly<Matrix4 | NumberArray16>[];
  directionalShadowTexture: TextureT;
  spotShadowTexture: TextureT;
  pointShadowTexture: TextureT;
  comparisonSampler: SamplerT;
  nonFilteringSampler: SamplerT;
};
