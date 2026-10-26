// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  clouds,
  globeClouds,
  valueNoise,
  getShaderModuleDependencies,
  getShaderModuleUniformLayoutValidationResult
} from '@luma.gl/shadertools';

test('globe clouds preserve shared cloud uniforms and a single noise dependency', () => {
  expect(getShaderModuleUniformLayoutValidationResult(globeClouds, 'fragment')?.matches).toBe(true);
  expect(getShaderModuleUniformLayoutValidationResult(globeClouds, 'wgsl')?.matches).toBe(true);
  expect(globeClouds.defaultUniforms.planetRadius).toBe(6370972);
  const dependencies = getShaderModuleDependencies([globeClouds, clouds]);
  expect(dependencies.filter(module => module === valueNoise)).toHaveLength(1);
  expect(dependencies.filter(module => module === clouds)).toHaveLength(1);
  expect(dependencies.indexOf(clouds)).toBeLessThan(dependencies.indexOf(globeClouds));
});
