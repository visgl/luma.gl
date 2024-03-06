// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * PlatformInfo
 * @note Designed so that it can be easily created from a luma.gl Device instance
 * Without having any actual dependency on `@luma.gl/core`
 */
export type PlatformInfo = {
  /** Current Web GPU API backend */
  type: 'webgl' | 'webgpu' | 'unknown';
  /** Which shader language is supported */
  shaderLanguage: 'glsl' | 'wgsl';
  /** Which shader language version is preferred */
  shaderLanguageVersion: 100 | 300;
  /** string identifying current GPU */
  gpu: string;
  /** Feature strings for feature detection */
  features: Set<string>;
};
