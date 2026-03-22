import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { colorHalftone } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('colorHalftone#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(colorHalftone, {}, {});
  expect(uniforms, 'colorHalftone module build is ok').toBeTruthy();
  expect(uniforms.center, 'colorHalftone center uniform is ok').toEqual([0.5, 0.5]);
  expect(uniforms.angle, 'colorHalftone angle uniform is ok').toBe(1.1);
  expect(uniforms.size, 'colorHalftone size uniform is ok').toBe(4);
});
