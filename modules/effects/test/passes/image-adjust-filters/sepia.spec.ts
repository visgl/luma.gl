// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {sepia} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('sepia#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(sepia, {}, {});

  expect(Boolean(uniforms), 'sepia module build is ok').toBe(true);
  expect(uniforms.amount, 'sepia amount uniform is ok').toBe(0.5);
  void 0;
});
