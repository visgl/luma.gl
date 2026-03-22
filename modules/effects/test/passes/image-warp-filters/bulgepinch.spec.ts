import {expect, test} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { bulgePinch } from '@luma.gl/effects';
import { getShaderModuleUniforms } from '@luma.gl/shadertools';
test('bulgePinch#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(bulgePinch, {}, {});
  expect(uniforms, 'bulgePinch module build is ok').toBeTruthy();
  expect(uniforms.center, 'bulgePinch center uniform is ok').toEqual([0.5, 0.5]);
  expect(uniforms.radius, 'bulgePinch radius uniform is ok').toBe(200);
  expect(uniforms.strength, 'bulgePinch strength uniform is ok').toBe(0.5);
});
