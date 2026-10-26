// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  clouds,
  heightFogFunctions,
  valueNoise,
  getShaderModuleDependencies,
  getShaderModuleUniformLayoutValidationResult
} from '@luma.gl/shadertools';

test('cloud uniforms agree across shader languages and preserve incremental changes', () => {
  expect(getShaderModuleUniformLayoutValidationResult(clouds, 'fragment')?.matches).toBe(true);
  expect(getShaderModuleUniformLayoutValidationResult(clouds, 'wgsl')?.matches).toBe(true);
  const previous = clouds.getUniforms({time: 12, velocity: [20, 5]});
  const updated = clouds.getUniforms({cover: 0.7}, previous);
  expect(updated.time).toBe(12);
  expect(updated.velocity).toEqual([20, 5]);
  expect(updated.cover).toBe(0.7);
  expect(clouds.defaultUniforms.cover).toBe(0.45);
});

test('clouds and height fog share one noise dependency', () => {
  const dependencies = getShaderModuleDependencies([clouds, heightFogFunctions]);
  expect(dependencies.filter(module => module === valueNoise)).toHaveLength(1);
  expect(dependencies.indexOf(valueNoise)).toBeLessThan(dependencies.indexOf(clouds));
  expect(dependencies.indexOf(valueNoise)).toBeLessThan(dependencies.indexOf(heightFogFunctions));
});
