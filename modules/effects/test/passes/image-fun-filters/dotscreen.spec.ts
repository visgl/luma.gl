import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { dotScreen } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('dotScreen#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(dotScreen, {}, {});
  expect(uniforms, 'dotScreen module build is ok').toBeTruthy();
  expect(uniforms.center, 'dotScreen center uniform is ok').toEqual([0.5, 0.5]);
  expect(uniforms.angle, 'dotScreen angle uniform is ok').toBe(1.1);
  expect(uniforms.size, 'dotScreen size uniform is ok').toBe(3);
});
