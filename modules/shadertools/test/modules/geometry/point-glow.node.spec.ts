// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getShaderModuleUniformLayoutValidationResult,
  getShaderModuleUniforms,
  pointGlow
} from '@luma.gl/shadertools';

test('point glow uniforms agree across GLSL and WGSL', () => {
  for (const stage of ['fragment', 'wgsl'] as const) {
    expect(getShaderModuleUniformLayoutValidationResult(pointGlow, stage)?.matches).toBe(true);
  }
});
test('point glow partial updates preserve shape while allowing unbounded radiance and zero intensity', () => {
  const previous = getShaderModuleUniforms(
    pointGlow,
    {coreRadius: 0.2, coreIntensity: 4, falloff: 8},
    {}
  );
  const uniforms = getShaderModuleUniforms(pointGlow, {haloIntensity: 0}, previous);
  expect(uniforms).toEqual({coreRadius: 0.2, coreIntensity: 4, haloIntensity: 0, falloff: 8});
  expect(pointGlow.defaultUniforms.haloIntensity).toBe(0.6);
});
