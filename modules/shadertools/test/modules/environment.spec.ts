// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {atmosphere, clouds, surfaceWeather} from '@luma.gl/shadertools';
import {getTestDevice} from '@luma.gl/test-utils';
import {makeShaderModuleRenderer} from './render-shader-module';

for (const backend of ['webgpu', 'webgl'] as const) {
  test(`atmosphere on ${backend}: blue daylight, nightfall, distance extinction and opt-out`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !device.isTextureFormatRenderable('rgba32float')) return context.skip();
    const sky = makeShaderModuleRenderer(device, [atmosphere], SKY_WGSL, SKY_GLSL);
    const aerial = makeShaderModuleRenderer(device, [atmosphere], AERIAL_WGSL, AERIAL_GLSL);
    try {
      sky.model.shaderInputs.setProps({atmosphere: {sunDirection: [0, 0.6, 0.8]}});
      const day = await sky.read();
      expect(day.every(Number.isFinite)).toBe(true);
      expect(day[2]).toBeGreaterThan(day[0]);
      expect(day[2]).toBeGreaterThan(0.02);
      sky.model.shaderInputs.setProps({atmosphere: {sunDirection: [0, 0, -1]}});
      const night = await sky.read();
      expect(night[2]).toBeLessThan(day[2] * 0.1);
      aerial.model.shaderInputs.setProps({atmosphere: {sunIntensity: 0, haze: 3}});
      const extinction = await aerial.read();
      expect(extinction.every(Number.isFinite)).toBe(true);
      expect(extinction[0]).toBeGreaterThan(extinction[20]);
      expect(extinction[3]).toBeCloseTo(0.4);
      aerial.model.shaderInputs.setProps({atmosphere: {enabled: 0}});
      const disabled = await aerial.read();
      expect(disabled[0]).toBeCloseTo(1);
      expect(disabled[20]).toBeCloseTo(1);
    } finally {
      sky.destroy();
      aerial.destroy();
    }
  });

  test(`cloud sunlight extinction on ${backend}: shared field, drift and clear/night opt-out`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !device.isTextureFormatRenderable('rgba32float')) return context.skip();
    const renderer = makeShaderModuleRenderer(device, [clouds], CLOUD_WGSL, CLOUD_GLSL);
    try {
      renderer.model.shaderInputs.setProps({clouds: {cover: 0}});
      const clear = await renderer.read();
      expect(clear.every(value => value === 1)).toBe(true);
      renderer.model.shaderInputs.setProps({
        clouds: {cover: 0.7, sunDirection: [0, 0, 1], velocity: [80, 0]}
      });
      const shaded = await renderer.read();
      expect(shaded.every(value => Number.isFinite(value) && value >= 0 && value <= 1)).toBe(true);
      expect(Math.min(...shaded)).toBeLessThan(0.8);
      renderer.model.shaderInputs.setProps({clouds: {time: 15}});
      const moved = await renderer.read();
      expect(moved.some((value, index) => Math.abs(value - shaded[index]) > 0.02)).toBe(true);
      renderer.model.shaderInputs.setProps({clouds: {sunDirection: [0, 0, -1]}});
      expect((await renderer.read()).every(value => value === 1)).toBe(true);
    } finally {
      renderer.destroy();
    }
  });

  test(`surface weather on ${backend}: snow slopes, exposure mask, wet albedo and roughness`, async context => {
    const device = await getTestDevice(backend);
    if (!device || !device.isTextureFormatRenderable('rgba32float')) return context.skip();
    const renderer = makeShaderModuleRenderer(device, [surfaceWeather], SURFACE_WGSL, SURFACE_GLSL);
    try {
      const dry = await renderer.read();
      expect(dry[0]).toBeCloseTo(0.5);
      expect(dry[3]).toBeCloseTo(1);
      renderer.model.shaderInputs.setProps({surfaceWeather: {snow: 1}});
      const snow = await renderer.read();
      expect(snow[0]).toBeCloseTo(0.9);
      expect(snow[3]).toBeCloseTo(0.95);
      expect(snow[4]).toBeCloseTo(0.5); // Vertical wall.
      expect(snow[8]).toBeCloseTo(0.5); // Water/shelter exposure mask.
      renderer.model.shaderInputs.setProps({surfaceWeather: {snow: 0, wetness: 1}});
      const wet = await renderer.read();
      expect(wet[0]).toBeLessThan(dry[0]);
      expect(wet[3]).toBeLessThan(dry[3]);
      expect(wet[8]).toBeCloseTo(dry[8]);
      expect(wet[11]).toBeCloseTo(dry[11]);
    } finally {
      renderer.destroy();
    }
  });
}
const SKY_WGSL = `@fragment fn fragmentMain() -> @location(0) vec4f {
  return vec4f(atmosphere_getSkyColor(vec3f(0.0, 0.0, 20.0), vec3f(0.0, 0.0, 1.0)), 1.0);
}`;
const SKY_GLSL = `void main() {fragmentColor = vec4(atmosphere_getSkyColor(vec3(0.0, 0.0, 20.0), vec3(0.0, 0.0, 1.0)), 1.0);}`;
const AERIAL_WGSL = `@fragment fn fragmentMain(@builtin(position) fragment: vec4f) -> @location(0) vec4f {
  return atmosphere_getColor(vec4f(1.0, 1.0, 1.0, 0.4), vec3f(fragment.x * 2000.0, 0.0, 20.0), vec3f(0.0, 0.0, 20.0));
}`;
const AERIAL_GLSL = `void main() {fragmentColor = atmosphere_getColor(vec4(1.0, 1.0, 1.0, 0.4), vec3(gl_FragCoord.x * 2000.0, 0.0, 20.0), vec3(0.0, 0.0, 20.0));}`;
const CLOUD_WGSL = `@fragment fn fragmentMain(@builtin(position) fragment: vec4f) -> @location(0) vec4f {
  return vec4f(clouds_getTransmittance(vec3f(fragment.x * 800.0, 0.0, 0.0)));
}`;
const CLOUD_GLSL = `void main() {fragmentColor = vec4(clouds_getTransmittance(vec3(gl_FragCoord.x * 800.0, 0.0, 0.0)));}`;
const SURFACE_WGSL = `@fragment fn fragmentMain(@builtin(position) fragment: vec4f) -> @location(0) vec4f {
  var normal = vec3f(0.0, 0.0, 1.0);
  if (fragment.x > 1.0 && fragment.x < 2.0) {normal = vec3f(1.0, 0.0, 0.0);}
  var exposure = 1.0;
  if (fragment.x > 2.0 && fragment.x < 3.0) {exposure = 0.0;}
  let position = vec3f(20.0, 30.0, 0.0);
  return vec4f(surfaceWeather_getAlbedo(vec3f(0.5), position, normal, exposure),
    surfaceWeather_getRoughness(1.0, position, normal, exposure));
}`;
const SURFACE_GLSL = `void main() {
  vec3 normal = vec3(0.0, 0.0, 1.0);
  if (gl_FragCoord.x > 1.0 && gl_FragCoord.x < 2.0) normal = vec3(1.0, 0.0, 0.0);
  float exposure = 1.0;
  if (gl_FragCoord.x > 2.0 && gl_FragCoord.x < 3.0) exposure = 0.0;
  vec3 position = vec3(20.0, 30.0, 0.0);
  fragmentColor = vec4(surfaceWeather_getAlbedo(vec3(0.5), position, normal, exposure),
    surfaceWeather_getRoughness(1.0, position, normal, exposure));
}`;
