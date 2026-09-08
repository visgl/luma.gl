// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {hexagonalPixelate} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('hexagonalPixelate#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(hexagonalPixelate, {}, {});

  expect(Boolean(uniforms), 'hexagonalPixelate module build is ok').toBe(true);
  expect(uniforms.center, 'hexagonalPixelate center uniform is ok').toEqual([0.5, 0.5]);
  expect(uniforms.scale, 'hexagonalPixelate strength uniform is ok').toBe(10);
  void 0;
});
