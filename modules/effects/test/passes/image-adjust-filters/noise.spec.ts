import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { noise } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('noise#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(noise, {}, {});
  expect(uniforms, 'noise module build is ok').toBeTruthy();
  expect(uniforms.amount, 'noise amount uniform is ok').toBe(0.5);
});
