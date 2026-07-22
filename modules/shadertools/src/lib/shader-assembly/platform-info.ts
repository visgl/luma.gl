// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Shader-language capabilities that shader modules may require explicitly.
 * These names intentionally mirror matching device features without making shadertools depend
 * on `@luma.gl/core`.
 */
export type ShaderFeature =
  | 'shader-f16'
  | 'clip-distances'
  | 'dual-source-blending'
  | 'subgroups'
  | 'primitive-index'
  | 'subgroup-size-control'
  | 'texture-formats-tier1'
  | 'shader-noperspective-interpolation-webgl'
  | 'shader-conservative-depth-webgl'
  | 'shader-clip-cull-distance-webgl'
  | 'shader-sample-variables-webgl'
  | 'shader-multisample-interpolation-webgl'
  | 'multi-draw-webgl';

const SHADER_FEATURES: ReadonlySet<ShaderFeature> = new Set<ShaderFeature>([
  'shader-f16',
  'clip-distances',
  'dual-source-blending',
  'subgroups',
  'primitive-index',
  'subgroup-size-control',
  'texture-formats-tier1',
  'shader-noperspective-interpolation-webgl',
  'shader-conservative-depth-webgl',
  'shader-clip-cull-distance-webgl',
  'shader-sample-variables-webgl',
  'shader-multisample-interpolation-webgl',
  'multi-draw-webgl'
]);

/** Derives the shader-language subset from an iterable of backend feature names. */
export function getShaderFeatures(features: Iterable<string>): Set<ShaderFeature> {
  const shaderFeatures = new Set<ShaderFeature>();
  for (const feature of features) {
    if (SHADER_FEATURES.has(feature as ShaderFeature)) {
      shaderFeatures.add(feature as ShaderFeature);
    }
  }
  return shaderFeatures;
}

/**
 * PlatformInfo
 * @note Designed so that it can be easily created from a luma.gl Device instance
 * Without having any actual dependency on `@luma.gl/core`
 */
export type PlatformInfo = {
  /** Current Web GPU API backend */
  type: 'webgl' | 'webgpu' | 'null' | 'unknown';
  /** Which shader language is supported */
  shaderLanguage: 'glsl' | 'wgsl';
  /** Which shader language version is preferred */
  shaderLanguageVersion: 100 | 300;
  /** string identifying current GPU */
  gpu: string;
  /** Device limits exposed to shader preprocessing decisions such as platform capability defines. */
  limits?: Record<string, number | undefined>;
  /** Backend feature strings for low-level feature detection. */
  features: ReadonlySet<string>;
  /** Shader-language capabilities derived from backend features. */
  shaderFeatures?: ReadonlySet<ShaderFeature>;
};
