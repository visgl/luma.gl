// luma.gl, MIT license
// Copyright (c) vis.gl contributors

/** 
 * PlatformInfo 
 * @note Designed so that it can be easily created from a luma.gl Device instance
 * Without having any actual dependency on `@luma.gl/core`
 */
export type PlatformInfo = {
  /** Current Web GPU API backend */
  type: 'webgl' | 'webgl2' | 'webgpu';
  /** Which shader language is supported */
  shaderLanguage: 'glsl' | 'wgsl';
  /** string identifying current GPU */
  gpu: string;
  /** Feature strings for feature detection */
  features: Set<string>;
};
