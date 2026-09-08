// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {swirl} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('swirl#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(swirl, {}, {});

  expect(Boolean(uniforms), 'swirl module build is ok').toBe(true);
  expect(uniforms.center, 'swirl center uniform is ok').toEqual([0.5, 0.5]);
  expect(uniforms.radius, 'swirl radius uniform is ok').toBe(200);
  expect(uniforms.angle, 'swirl angle uniform is ok').toBe(3);
  void 0;
});
