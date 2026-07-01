// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Preset controlling shadow-map resolution and sampling cost. */
export type ShadowQuality = 'Low' | 'Balanced' | 'Cinematic';

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
  Record<ShadowQuality, Readonly<ShadowQualitySettings>>
> = Object.freeze({
  Low: Object.freeze({
    cascadeCount: 3,
    directionalMapSize: 1024,
    spotMapSize: 512,
    pointMapSize: 256,
    blockerSampleCount: 8,
    filterSampleCount: 12,
    contactScale: 0.5,
    contactStepCount: 12
  }),
  Balanced: Object.freeze({
    cascadeCount: 4,
    directionalMapSize: 1536,
    spotMapSize: 1024,
    pointMapSize: 512,
    blockerSampleCount: 16,
    filterSampleCount: 24,
    contactScale: 0.75,
    contactStepCount: 24
  }),
  Cinematic: Object.freeze({
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
