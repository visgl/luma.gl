// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  getShaderModuleUniformLayoutValidationResult,
  getShaderModuleUniforms,
  pathDash
} from '@luma.gl/shadertools';

test('path dash uniforms agree across GLSL and WGSL', () => {
  for (const stage of ['fragment', 'wgsl'] as const)
    expect(getShaderModuleUniformLayoutValidationResult(pathDash, stage)?.matches).toBe(true);
});
test('dash updates retain phase and allow zero gap or zero dash length', () => {
  const previous = getShaderModuleUniforms(pathDash, {offset: -5, dashLength: 20}, {});
  const solid = getShaderModuleUniforms(pathDash, {gapLength: 0}, previous);
  expect(solid).toEqual({dashLength: 20, gapLength: 0, offset: -5});
  expect(getShaderModuleUniforms(pathDash, {dashLength: 0}, previous).dashLength).toBe(0);
});
