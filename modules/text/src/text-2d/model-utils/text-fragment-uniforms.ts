// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TextSdfRenderSettings} from './storage-text-state';

export function createArrowTextDefaultFragmentShaderUniforms(
  uniforms: Record<string, unknown> | undefined,
  sdfRenderSettings: TextSdfRenderSettings
): Record<string, unknown> {
  const nextUniforms = {...(uniforms || {})};
  updateArrowTextDefaultFragmentShaderUniforms(nextUniforms, sdfRenderSettings);
  return nextUniforms;
}

export function updateArrowTextDefaultFragmentShaderUniforms(
  uniforms: Record<string, unknown>,
  sdfRenderSettings: TextSdfRenderSettings
): void {
  uniforms['textUsesSdf'] = sdfRenderSettings.sdf ? 1 : 0;
  uniforms['textSdfThreshold'] = sdfRenderSettings.threshold;
  uniforms['textSdfSmoothing'] = sdfRenderSettings.smoothing;
}
