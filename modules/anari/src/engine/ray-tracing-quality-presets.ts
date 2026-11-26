// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {RayTracingSceneRenderOptions} from './ray-tracing-scene-renderer';

export type RayTracingQualityPreset = 'interactive' | 'still';
export type RayTracingQualitySettings = Pick<
  RayTracingSceneRenderOptions,
  | 'resolutionScale'
  | 'minimumResolutionScale'
  | 'adaptiveResolution'
  | 'temporalReprojection'
  | 'samplesPerPixel'
  | 'progressive'
  | 'shadowSamplesPerFrame'
  | 'targetFrameTimeMilliseconds'
>;

/** Explicit quality choices; still mode requires a stationary scene to converge. */
export function getRayTracingQualityPreset(
  preset: RayTracingQualityPreset
): RayTracingQualitySettings {
  return preset === 'interactive'
    ? {
        resolutionScale: 0.5,
        minimumResolutionScale: 0.25,
        adaptiveResolution: true,
        temporalReprojection: true,
        samplesPerPixel: 1,
        progressive: true,
        shadowSamplesPerFrame: 1,
        targetFrameTimeMilliseconds: 33.3
      }
    : {
        resolutionScale: 1,
        minimumResolutionScale: 1,
        adaptiveResolution: false,
        temporalReprojection: false,
        samplesPerPixel: 4,
        progressive: true,
        shadowSamplesPerFrame: 0,
        targetFrameTimeMilliseconds: 33.3
      };
}
