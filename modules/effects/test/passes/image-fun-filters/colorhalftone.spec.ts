// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {colorHalftone} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('colorHalftone#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(colorHalftone, {}, {});

  expect(Boolean(uniforms), 'colorHalftone module build is ok').toBe(true);
  expect(uniforms.center, 'colorHalftone center uniform is ok').toEqual([0.5, 0.5]);
  expect(uniforms.angle, 'colorHalftone angle uniform is ok').toBe(1.1);
  expect(uniforms.size, 'colorHalftone size uniform is ok').toBe(4);
  void 0;
});
