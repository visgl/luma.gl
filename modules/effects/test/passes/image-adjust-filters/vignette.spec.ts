import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { vignette } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('vignette#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(vignette, {}, {});
  expect(uniforms, 'vignette module build is ok').toBeTruthy();
  expect(uniforms.radius, 'vignette radius uniform is ok').toBe(0.5);
  expect(uniforms.amount, 'vignette amount uniform is ok').toBe(0.5);
});
