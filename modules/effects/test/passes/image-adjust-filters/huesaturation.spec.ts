import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { hueSaturation } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('hueSaturation#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(hueSaturation, {}, {});
  expect(uniforms, 'hueSaturation module build is ok').toBeTruthy();
  expect(uniforms.hue, 'hueSaturation hue uniform is ok').toBe(0);
  expect(uniforms.saturation, 'hueSaturation saturation uniform is ok').toBe(0);
});
