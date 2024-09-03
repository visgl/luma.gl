// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

const source = /* wgsl */ `\
struct noiseUniforms {
  amount: f32
};

@group(0), @binding(0) var<uniform> noise: NoiseUniforms;

fn rand(co: vec2<f32>) -> f32 {
	return fract(sin(dot(co.xy, vec2<f32>(12.9898, 78.233))) * 43758.547);
} 

fn noise_filterColor_ext(color: vec4<f32>, texSize: vec2<f32>, texCoord: vec2<f32>) -> vec4<f32> {
	let diff: f32 = (rand(texCoord) - 0.5) * noise.amount;
	color.r = color.r + (diff);
	color.g = color.g + (diff);
	color.b = color.b + (diff);
	return color;
} 
`;

const fs = /* glsl */ `\
uniform noiseUniforms {
  float amount;
} noise;

float rand(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec4 noise_filterColor_ext(vec4 color, vec2 texSize, vec2 texCoord) {
  float diff = (rand(texCoord) - 0.5) * noise.amount;
  color.r += diff;
  color.g += diff;
  color.b += diff;
  return color;
}
`;

/**
 * Noise - Adds black and white noise to the image.
 */
export type NoiseProps = {
  /**  0 to 1 (0 for no effect, 1 for maximum noise) */
  amount?: number;
};

export type NoiseUniforms = NoiseProps;

/**
 * Noise
 * Adds black and white noise to the image.
 */
export const noise = {
  props: {} as NoiseProps,
  uniforms: {} as NoiseUniforms,

  name: 'noise',
  uniformTypes: {
    amount: 'f32'
  },
  propTypes: {
    amount: {value: 0.5, min: 0, max: 1}
  },
  fs,
  source,
  passes: [{filter: true}]
} as const satisfies ShaderPass<NoiseProps, NoiseProps>;
