import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { hexagonalPixelate } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('hexagonalPixelate#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(hexagonalPixelate, {}, {});
  expect(uniforms, 'hexagonalPixelate module build is ok').toBeTruthy();
  expect(uniforms.center, 'hexagonalPixelate center uniform is ok').toEqual([0.5, 0.5]);
  expect(uniforms.scale, 'hexagonalPixelate strength uniform is ok').toBe(10);
});
