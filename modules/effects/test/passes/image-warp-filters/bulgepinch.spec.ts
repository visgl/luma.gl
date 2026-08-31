// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {bulgePinch} from '@luma.gl/effects';
import {getShaderModuleUniforms} from '@luma.gl/shadertools';
import {expect, it} from 'vitest';

it('bulgePinch#build/uniform', () => {
  const uniforms = getShaderModuleUniforms(bulgePinch, {}, {});

  expect(Boolean(uniforms), 'bulgePinch module build is ok').toBe(true);
  expect(uniforms.center, 'bulgePinch center uniform is ok').toEqual([0.5, 0.5]);
  expect(uniforms.radius, 'bulgePinch radius uniform is ok').toBe(200);
  expect(uniforms.strength, 'bulgePinch strength uniform is ok').toBe(0.5);
  void 0;
});
