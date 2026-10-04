// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  atmosphere,
  surfaceWeather,
  integrateSurfaceWeather,
  clouds,
  heightFogFunctions,
  valueNoise,
  getShaderModuleDependencies,
  getShaderModuleUniformLayoutValidationResult
} from '@luma.gl/shadertools';

test.each([
  atmosphere,
  surfaceWeather
])('$name has matching shader layouts and incremental uniforms', module => {
  expect(getShaderModuleUniformLayoutValidationResult(module, 'fragment')?.matches).toBe(true);
  expect(getShaderModuleUniformLayoutValidationResult(module, 'wgsl')?.matches).toBe(true);
});
test('environmental modules share the same noise dependency', () => {
  const dependencies = getShaderModuleDependencies([clouds, surfaceWeather, heightFogFunctions]);
  expect(dependencies.filter(module => module === valueNoise)).toHaveLength(1);
  expect(
    surfaceWeather.getUniforms({snow: 0.4}, surfaceWeather.getUniforms({wetness: 0.8}))
  ).toMatchObject({wetness: 0.8, snow: 0.4});
  expect(
    atmosphere.getUniforms({haze: 2}, atmosphere.getUniforms({sunDirection: [1, 0, 0]}))
  ).toMatchObject({haze: 2, sunDirection: [1, 0, 0]});
});
test('surface accumulation is invariant to frame rate, bounded and exactly paused', () => {
  const initial = {wetness: 0.2, snow: 0.1};
  const rates = {rainfall: 0.12, snowfall: 0.06, evaporation: 0.01, snowmelt: 0.004};
  const coarse = integrateSurfaceWeather(initial, rates, 30);
  let fine = initial;
  for (let frame = 0; frame < 1800; frame++) fine = integrateSurfaceWeather(fine, rates, 1 / 60);
  expect(fine.wetness).toBeCloseTo(coarse.wetness, 12);
  expect(fine.snow).toBeCloseTo(coarse.snow, 12);
  expect(integrateSurfaceWeather(initial, rates, 0)).toEqual(initial);
  expect(coarse.wetness).toBeGreaterThan(initial.wetness);
  expect(coarse.snow).toBeGreaterThan(initial.snow);
  const dry = integrateSurfaceWeather(coarse, {...rates, rainfall: 0, snowfall: 0}, 1000);
  expect(dry.wetness).toBeLessThan(0.001);
  expect(dry.snow).toBeLessThan(0.1);
  expect(integrateSurfaceWeather(initial, rates, -1)).toEqual(initial);
});
