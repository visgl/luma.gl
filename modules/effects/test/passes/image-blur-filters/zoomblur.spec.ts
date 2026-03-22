import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { zoomBlur } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('zoomBlur#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(zoomBlur, {}, {});
  expect(uniforms, 'zoomBlur module build is ok').toBeTruthy();
  expect(uniforms.center, 'zoomBlur center uniform is ok').toEqual([0.5, 0.5]);
  expect(uniforms.strength, 'zoomBlur strength uniform is ok').toBe(0.3);
});
