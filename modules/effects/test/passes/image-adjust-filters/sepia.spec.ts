import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { sepia } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('sepia#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(sepia, {}, {});
  expect(uniforms, 'sepia module build is ok').toBeTruthy();
  expect(uniforms.amount, 'sepia amount uniform is ok').toBe(0.5);
});
