import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { tiltShift } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('tiltShift#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(tiltShift, {}, {});
  expect(uniforms, 'tiltShift module build is ok').toBeTruthy();
  expect(uniforms.blurRadius, 'tiltShift blurRadius uniform is ok').toBe(15);
  expect(uniforms.gradientRadius, 'tiltShift gradientRadius uniform is ok').toBe(200);
  expect(uniforms.start, 'tiltShift start uniform is ok').toEqual([0, 0]);
  expect(uniforms.end, 'tiltShift end uniform is ok').toEqual([1, 1]);
  expect(uniforms.invert, 'tiltShift invert uniform is ok').toBe(0);
});
