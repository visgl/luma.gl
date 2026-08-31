// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {edgeWork} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('edgeWork#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(edgeWork, {}, {});

  expect(Boolean(uniforms), 'edgeWork module build is ok').toBe(true);
  expect(uniforms.radius, 'edgeWork radius uniform is ok').toBe(2);
  expect(uniforms.mode, 'edgeWork mode uniform is ok').toEqual(0);
  void 0;
});
