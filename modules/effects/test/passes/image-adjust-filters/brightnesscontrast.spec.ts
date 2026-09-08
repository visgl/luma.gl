// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {brightnessContrast} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('brightnessContrast#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(brightnessContrast, {}, {});

  expect(Boolean(uniforms), 'brightnessContrast module build is ok').toBe(true);
  expect(uniforms.brightness, 'brightnessContrast brightness uniform is ok').toBe(0);
  expect(uniforms.contrast, 'brightnessContrast contrast uniform is ok').toBe(0);
  void 0;
});
