// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {gaussianBlur} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('gaussianBlur#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(gaussianBlur, {}, {});

  expect(Boolean(uniforms), 'gaussianBlur module build is ok').toBe(true);
  expect(uniforms.radius, 'gaussianBlur radius uniform is ok').toBe(12);
  expect(uniforms.delta, 'gaussianBlur delta uniform is ok').toEqual([1, 0]);
  void 0;
});
