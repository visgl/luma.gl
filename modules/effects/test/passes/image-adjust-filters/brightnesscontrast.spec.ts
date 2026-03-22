import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { brightnessContrast } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('brightnessContrast#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(brightnessContrast, {}, {});
  expect(uniforms, 'brightnessContrast module build is ok').toBeTruthy();
  expect(uniforms.brightness, 'brightnessContrast brightness uniform is ok').toBe(0);
  expect(uniforms.contrast, 'brightnessContrast contrast uniform is ok').toBe(0);
});
