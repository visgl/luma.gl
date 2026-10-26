// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SlangNativeModule} from '@luma.gl/slang';
import {valueNoise} from '@luma.gl/shadertools';

/** Adapt an existing native ShaderModule using an application-owned Slang contract. */
export const filmGrain = {
  declarations:
    'float3 applyNativeGrain(float3 color, float2 coordinates, float time, float amount);',
  imports: 'float scaleGrain(float noise, float amount);',
  wgsl: `${valueNoise.source}
fn applyNativeGrain(color: vec3<f32>, coordinates: vec2<f32>, time: f32, amount: f32) -> vec3<f32> {
  let noise = valueNoise_noise(coordinates + vec2<f32>(time * 47.0, time * 31.0));
  return clamp(color + vec3<f32>(scaleGrain(noise, amount)), vec3<f32>(0), vec3<f32>(1));
}`,
  glsl: `${valueNoise.fs}
vec3 applyNativeGrain(vec3 color, vec2 coordinates, float time, float amount) {
  float noise = valueNoise_noise(coordinates + vec2(time * 47.0, time * 31.0));
  return clamp(color + vec3(scaleGrain(noise, amount)), 0.0, 1.0);
}`
} satisfies SlangNativeModule;
