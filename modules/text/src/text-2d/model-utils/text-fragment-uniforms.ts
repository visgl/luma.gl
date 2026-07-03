// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {FontAtlasRenderSettings} from '../atlas/font-atlas';

/** Uniform values consumed by bitmap, SDF, and MSDF fragment shader branches. */
export type FontAtlasShaderProps = {
  renderMode: number;
  sdfThreshold: number;
  sdfSmoothing: number;
  msdfDistanceRange: number;
};

/** Maps normalized render settings to the compact fragment shader contract. */
export function getFontAtlasShaderProps(
  fontRenderSettings: FontAtlasRenderSettings
): FontAtlasShaderProps {
  return {
    renderMode:
      fontRenderSettings.mode === 'bitmap' ? 0 : fontRenderSettings.mode === 'sdf' ? 1 : 2,
    sdfThreshold: fontRenderSettings.threshold,
    sdfSmoothing: fontRenderSettings.smoothing,
    msdfDistanceRange: fontRenderSettings.distanceRange ?? 0
  };
}

export function createTextDefaultFragmentShaderUniforms(
  uniforms: Record<string, unknown> | undefined,
  fontRenderSettings: FontAtlasRenderSettings
): Record<string, unknown> {
  const nextUniforms = {...(uniforms || {})};
  updateTextDefaultFragmentShaderUniforms(nextUniforms, fontRenderSettings);
  return nextUniforms;
}

export function updateTextDefaultFragmentShaderUniforms(
  uniforms: Record<string, unknown>,
  fontRenderSettings: FontAtlasRenderSettings
): void {
  const fontShaderProps = getFontAtlasShaderProps(fontRenderSettings);
  uniforms['textFontRenderMode'] = fontShaderProps.renderMode;
  uniforms['textSdfThreshold'] = fontShaderProps.sdfThreshold;
  uniforms['textSdfSmoothing'] = fontShaderProps.sdfSmoothing;
  uniforms['textMsdfDistanceRange'] = fontShaderProps.msdfDistanceRange;
}
