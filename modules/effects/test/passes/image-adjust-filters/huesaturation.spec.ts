// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {hueSaturation} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('hueSaturation#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(hueSaturation, {}, {});

  expect(Boolean(uniforms), 'hueSaturation module build is ok').toBe(true);
  expect(uniforms.hue, 'hueSaturation hue uniform is ok').toBe(0);
  expect(uniforms.saturation, 'hueSaturation saturation uniform is ok').toBe(0);
  void 0;
});
