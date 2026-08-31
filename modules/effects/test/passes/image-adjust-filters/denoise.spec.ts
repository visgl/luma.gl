// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {denoise} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('denoise#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(denoise, {}, {});

  expect(Boolean(uniforms), 'denoise module build is ok').toBe(true);
  expect(uniforms.strength, 'denoise strength uniform is ok').toBe(0.5);
  void 0;
});
