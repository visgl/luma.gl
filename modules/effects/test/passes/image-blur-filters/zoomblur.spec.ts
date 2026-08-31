// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {zoomBlur} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('zoomBlur#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(zoomBlur, {}, {});

  expect(Boolean(uniforms), 'zoomBlur module build is ok').toBe(true);
  expect(uniforms.center, 'zoomBlur center uniform is ok').toEqual([0.5, 0.5]);
  expect(uniforms.strength, 'zoomBlur strength uniform is ok').toBe(0.3);
  void 0;
});
