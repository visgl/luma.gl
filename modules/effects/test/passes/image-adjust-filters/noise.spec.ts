// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {noise} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('noise#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(noise, {}, {});

  expect(Boolean(uniforms), 'noise module build is ok').toBe(true);
  expect(uniforms.amount, 'noise amount uniform is ok').toBe(0.5);
  void 0;
});
