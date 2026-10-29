// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';

export type FireflyProps = {
  enabled?: number;
  time?: number;
  radius?: number;
  speed?: number;
  pulse?: number;
};
export type FireflyUniforms = Required<FireflyProps>;
const uniforms = {enabled: 0, time: 0, radius: 8, speed: 0.6, pulse: 0.85};

/** Seeded smooth wandering and independently phased bioluminescence. Positions are in metres. */
export const firefly = {
  name: 'firefly',
  uniformTypes: {enabled: 'f32', time: 'f32', radius: 'f32', speed: 'f32', pulse: 'f32'},
  defaultUniforms: uniforms,
  getUniforms(props = {}, previous = uniforms) {
    return {...uniforms, ...previous, ...props};
  },
  source: `struct FireflyUniforms {enabled: f32, time: f32, radius: f32, speed: f32, pulse: f32};
  @group(3) @binding(auto) var<uniform> firefly: FireflyUniforms;
  fn firefly_getPosition(position: vec3f, seed: f32, time: f32) -> vec3f {
    if (firefly.enabled <= 0.0) { return position; }
    let phase = seed * 2.399963;
    let travel = time * firefly.speed;
    let offset = vec3f(sin(travel * 0.71 + phase) + sin(travel * 1.31 + phase * 1.7) * 0.35,
      cos(travel * 0.83 + phase * 1.2) + sin(travel * 0.47 + phase * 2.3) * 0.4,
      sin(travel * 0.59 + phase * 1.9) * 0.3);
    return position + offset * firefly.radius * firefly.enabled;
  }
  fn firefly_getBrightness(seed: f32, time: f32) -> f32 {
    if (firefly.enabled <= 0.0) { return 1.0; }
    let phase = seed * 2.399963;
    let pulse = pow(0.5 + 0.5 * sin(time * firefly.speed * (1.6 + fract(seed * 0.37)) + phase), 3.0);
    return mix(1.0, mix(0.08, 1.0, pulse), firefly.pulse * firefly.enabled);
  }`,
  vs: `layout(std140) uniform fireflyUniforms {
    float enabled;
    float time;
    float radius;
    float speed;
    float pulse;
  } firefly;
  vec3 firefly_getPosition(vec3 position, float seed, float time) {
    if (firefly.enabled <= 0.0) { return position; }
    float phase = seed * 2.399963;
    float travel = time * firefly.speed;
    vec3 offset = vec3(sin(travel * 0.71 + phase) + sin(travel * 1.31 + phase * 1.7) * 0.35,
      cos(travel * 0.83 + phase * 1.2) + sin(travel * 0.47 + phase * 2.3) * 0.4,
      sin(travel * 0.59 + phase * 1.9) * 0.3);
    return position + offset * firefly.radius * firefly.enabled;
  }
  float firefly_getBrightness(float seed, float time) {
    if (firefly.enabled <= 0.0) { return 1.0; }
    float phase = seed * 2.399963;
    float pulse = pow(0.5 + 0.5 * sin(time * firefly.speed * (1.6 + fract(seed * 0.37)) + phase), 3.0);
    return mix(1.0, mix(0.08, 1.0, pulse), firefly.pulse * firefly.enabled);
  }`
} as const satisfies ShaderModule<FireflyProps, FireflyUniforms>;
