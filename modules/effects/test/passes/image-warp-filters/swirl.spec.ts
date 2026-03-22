import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { swirl } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('swirl#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(swirl, {}, {});
  expect(uniforms, 'swirl module build is ok').toBeTruthy();
  expect(uniforms.center, 'swirl center uniform is ok').toEqual([0.5, 0.5]);
  expect(uniforms.radius, 'swirl radius uniform is ok').toBe(200);
  expect(uniforms.angle, 'swirl angle uniform is ok').toBe(3);
});
