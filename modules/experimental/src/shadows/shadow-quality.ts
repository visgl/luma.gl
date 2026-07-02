// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type ShadowQualitySettings = {
  cascadeCount: number;
  directionalMapSize: number;
  spotMapSize: number;
  pointMapSize: number;
  blockerSampleCount: number;
  filterSampleCount: number;
  contactScale: number;
  contactStepCount: number;
};

/** Fixed quality settings shared by shadow maps, PCSS and contact refinement. */
export const SHADOW_QUALITY_SETTINGS: Readonly<
  Record<'low' | 'balanced' | 'cinematic', Readonly<ShadowQualitySettings>>
> = Object.freeze({
  low: Object.freeze({
    cascadeCount: 3,
    directionalMapSize: 1024,
    spotMapSize: 512,
    pointMapSize: 256,
    blockerSampleCount: 8,
    filterSampleCount: 12,
    contactScale: 0.5,
    contactStepCount: 12
  }),
  balanced: Object.freeze({
    cascadeCount: 4,
    directionalMapSize: 1536,
    spotMapSize: 1024,
    pointMapSize: 512,
    blockerSampleCount: 16,
    filterSampleCount: 24,
    contactScale: 0.75,
    contactStepCount: 24
  }),
  cinematic: Object.freeze({
    cascadeCount: 4,
    directionalMapSize: 2048,
    spotMapSize: 2048,
    pointMapSize: 1024,
    blockerSampleCount: 24,
    filterSampleCount: 48,
    contactScale: 1,
    contactStepCount: 40
  })
});
