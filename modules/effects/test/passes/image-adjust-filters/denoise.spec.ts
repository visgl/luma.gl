import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { denoise } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('denoise#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(denoise, {}, {});
  expect(uniforms, 'denoise module build is ok').toBeTruthy();
  expect(uniforms.strength, 'denoise strength uniform is ok').toBe(0.5);
});
