import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { ink } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('ink#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(ink, {}, {});
  expect(uniforms, 'ink module build is ok').toBeTruthy();
  expect(uniforms.strength, 'ink strength uniform is ok').toBe(0.25);
});
