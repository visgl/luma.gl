import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { edgeWork } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('edgeWork#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(edgeWork, {}, {});
  expect(uniforms, 'edgeWork module build is ok').toBeTruthy();
  expect(uniforms.radius, 'edgeWork radius uniform is ok').toBe(2);
  expect(uniforms.mode, 'edgeWork mode uniform is ok').toEqual(0);
});
