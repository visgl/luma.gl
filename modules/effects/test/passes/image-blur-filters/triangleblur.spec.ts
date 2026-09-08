// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {triangleBlur} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('triangleBlur#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(triangleBlur, {}, {});

  expect(Boolean(uniforms), 'triangleBlur module build is ok').toBe(true);
  expect(uniforms.radius, 'triangleBlur radius uniform is ok').toBe(20);
  expect(uniforms.delta, 'triangleBlur delta uniform is ok').toEqual([1, 0]);
  void 0;
});
