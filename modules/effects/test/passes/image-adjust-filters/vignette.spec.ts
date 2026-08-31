// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {vignette} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('vignette#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(vignette, {}, {});

  expect(Boolean(uniforms), 'vignette module build is ok').toBe(true);
  expect(uniforms.radius, 'vignette radius uniform is ok').toBe(0.5);
  expect(uniforms.amount, 'vignette amount uniform is ok').toBe(0.5);
  void 0;
});
