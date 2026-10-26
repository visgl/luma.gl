// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getShaderModuleUniformLayoutValidationResult,
  getShaderModuleUniforms,
  patternFill
} from '@luma.gl/shadertools';

test('pattern fill uniforms agree across GLSL and WGSL', () => {
  for (const stage of ['fragment', 'wgsl'] as const) {
    expect(getShaderModuleUniformLayoutValidationResult(patternFill, stage)?.matches).toBe(true);
  }
});

test('pattern updates retain phase and accept zero ink coverage', () => {
  const previous = getShaderModuleUniforms(
    patternFill,
    {pattern: 'dots', offset: [-3, 5], angle: 0},
    {}
  );
  const uniforms = getShaderModuleUniforms(patternFill, {width: 0}, previous);
  expect(uniforms.patternType).toBe(2);
  expect(uniforms.angle).toBe(0);
  expect(uniforms.offset).toEqual([-3, 5]);
  expect(uniforms.width).toBe(0);
  expect(patternFill.defaultUniforms.width).toBe(0.12);
});
