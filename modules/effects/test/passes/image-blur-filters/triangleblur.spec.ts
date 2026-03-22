import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { triangleBlur } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('triangleBlur#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(triangleBlur, {}, {});
  expect(uniforms, 'triangleBlur module build is ok').toBeTruthy();
  expect(uniforms.radius, 'triangleBlur radius uniform is ok').toBe(20);
  expect(uniforms.delta, 'triangleBlur delta uniform is ok').toEqual([1, 0]);
});
