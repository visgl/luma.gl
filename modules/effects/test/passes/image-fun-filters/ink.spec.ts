// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ink} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('ink#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(ink, {}, {});

  expect(Boolean(uniforms), 'ink module build is ok').toBe(true);
  expect(uniforms.strength, 'ink strength uniform is ok').toBe(0.25);
  void 0;
});
