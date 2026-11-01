// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';

export type PrecipitationUniforms = {
  time: number;
  fallSpeed: number;
  turbulence: number;
  seed: number;
  volumeCenter: [number, number, number];
  volumeSize: [number, number, number];
  wind: [number, number];
};
export type PrecipitationProps = Partial<PrecipitationUniforms>;

/** Stateless, seeded falling particles in a movable volume. Coordinates are local metres. */
export const precipitation = {
  name: 'precipitation',
  bindingLayout: [{name: 'precipitation', group: 3}],
  uniformTypes: {
    time: 'f32',
    fallSpeed: 'f32',
    turbulence: 'f32',
    seed: 'f32',
    volumeCenter: 'vec3<f32>',
    volumeSize: 'vec3<f32>',
    wind: 'vec2<f32>'
  },
  defaultUniforms: {
    time: 0,
    fallSpeed: 20,
    turbulence: 0,
    seed: 29,
    volumeCenter: [0, 0, 150],
    volumeSize: [1200, 1600, 300],
    wind: [2, 0]
  },
  getUniforms(props: PrecipitationProps = {}) {
    return props;
  },
  vs: /* glsl */ `
layout(std140) uniform precipitationUniforms {
  float time;
  float fallSpeed;
  float turbulence;
  float seed;
  vec3 volumeCenter;
  vec3 volumeSize;
  vec2 wind;
} precipitation;
float precipitation_random(uint identifier) {
  uint value = identifier + uint(precipitation.seed) * 747796405u;
  value = (value ^ (value >> 16u)) * 2246822519u;
  value = (value ^ (value >> 13u)) * 3266489917u;
  value = value ^ (value >> 16u);
  return float(value & 16777215u) / 16777216.0;
}
vec3 precipitation_getPosition(uint identifier) {
  vec3 randomPosition = vec3(precipitation_random(identifier * 3u), precipitation_random(identifier * 3u + 1u), precipitation_random(identifier * 3u + 2u));
  vec3 volumeSize = max(precipitation.volumeSize, vec3(0.001));
  vec3 minimum = precipitation.volumeCenter - volumeSize * 0.5;
  vec3 drift = vec3(precipitation.wind, -precipitation.fallSpeed) * precipitation.time;
  vec3 position = mod(randomPosition * volumeSize + drift - minimum, volumeSize) + minimum;
  position.xy += precipitation.turbulence * vec2(sin(precipitation.time * 0.9 + randomPosition.z * 31.0), cos(precipitation.time * 0.7 + randomPosition.x * 23.0));
  return position;
}
float precipitation_getFade(vec3 position) {
  vec3 edge = 0.5 - abs((position - precipitation.volumeCenter) / max(precipitation.volumeSize, vec3(0.001)));
  return smoothstep(0.0, 0.08, min(edge.x, min(edge.y, edge.z)));
}
`,
  source: /* wgsl */ `
struct precipitationUniforms {
  time: f32,
  fallSpeed: f32,
  turbulence: f32,
  seed: f32,
  volumeCenter: vec3<f32>,
  volumeSize: vec3<f32>,
  wind: vec2<f32>,
};
@group(3) @binding(auto) var<uniform> precipitation: precipitationUniforms;
fn precipitation_random(identifier: u32) -> f32 {
  var value = identifier + u32(precipitation.seed) * 747796405u;
  value = (value ^ (value >> 16u)) * 2246822519u;
  value = (value ^ (value >> 13u)) * 3266489917u;
  value = value ^ (value >> 16u);
  return f32(value & 16777215u) / 16777216.0;
}
fn precipitation_getPosition(identifier: u32) -> vec3<f32> {
  let randomPosition = vec3<f32>(precipitation_random(identifier * 3u), precipitation_random(identifier * 3u + 1u), precipitation_random(identifier * 3u + 2u));
  let volumeSize = max(precipitation.volumeSize, vec3<f32>(0.001));
  let minimum = precipitation.volumeCenter - volumeSize * 0.5;
  let drift = vec3<f32>(precipitation.wind, -precipitation.fallSpeed) * precipitation.time;
  let unwrapped = randomPosition * volumeSize + drift - minimum;
  var position = unwrapped - floor(unwrapped / volumeSize) * volumeSize + minimum;
  position.x += precipitation.turbulence * sin(precipitation.time * 0.9 + randomPosition.z * 31.0);
  position.y += precipitation.turbulence * cos(precipitation.time * 0.7 + randomPosition.x * 23.0);
  return position;
}
fn precipitation_getFade(position: vec3<f32>) -> f32 {
  let edge = 0.5 - abs((position - precipitation.volumeCenter) / max(precipitation.volumeSize, vec3<f32>(0.001)));
  return smoothstep(0.0, 0.08, min(edge.x, min(edge.y, edge.z)));
}
`
} as const satisfies ShaderModule<PrecipitationProps, PrecipitationUniforms>;
