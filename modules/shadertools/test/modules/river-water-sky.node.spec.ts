// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  getShaderModuleUniformLayoutValidationResult,
  riverWaterMaterial
} from '@luma.gl/shadertools';

it('river sky uniform schemas match on both backends', () => {
  expect(
    getShaderModuleUniformLayoutValidationResult(riverWaterMaterial, 'fragment')?.matches
  ).toBe(true);
  expect(getShaderModuleUniformLayoutValidationResult(riverWaterMaterial, 'wgsl')?.matches).toBe(
    true
  );
});
