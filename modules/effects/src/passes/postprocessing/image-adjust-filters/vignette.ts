// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

const source = /* wgsl */ `\
struct vignetteUniforms {
  radius: f32,
  amount: f32
};

@group(0) @binding(1) var<uniform> vignette: vignetteUniforms;

fn vibrance_filterColor(color: vec4f) -> vec4f {
  let average: f32 = (color.r + color.g + color.b) / 3.0;
  let mx: f32 = max(color.r, max(color.g, color.b));
  let amt: f32 = (mx - average) * (-vibrance.amount * 3.0);
  color.rgb = mix(color.rgb, vec3f(mx), amt);
  return color;
}

fn vignette_filterColor_ext(color: vec4f, texSize: vec2f, texCoord: vec2f) ->vec4f {
  let dist: f32 = distance(texCoord, vec2f(0.5, 0.5));
  let ratio: f32 = smoothstep(0.8, vignette.radius * 0.799, dist * (vignette.amount + vignette.radius));
  return color.rgba * ratio + (1.0 - ratio)*vec4f(0.0, 0.0, 0.0, 1.0);
}
`;

const fs = /* glsl */ `\
uniform vignetteUniforms {
  float radius;
  float amount;
} vignette;

vec4 vignette_filterColor_ext(vec4 color, vec2 texSize, vec2 texCoord) {
  float dist = distance(texCoord, vec2(0.5, 0.5));
  float ratio = smoothstep(0.8, vignette.radius * 0.799, dist * (vignette.amount + vignette.radius));
  return color.rgba * ratio + (1.0 - ratio)*vec4(0.0, 0.0, 0.0, 1.0);
}
`;

/**
 * Vignette - Adds a simulated lens edge darkening effect.
 */
export type VignetteProps = {
  /** 0 to 1 (0 for center of frame, 1 for edge of frame) */
  radius?: number;
  /** 0 to 1 (0 for no effect, 1 for maximum lens darkening) */
  amount?: number;
};

export type VignetteUniforms = VignetteProps;

/**
 * Vignette -
 * Adds a simulated lens edge darkening effect.
 */
export const vignette = {
  props: {} as VignetteProps,
  uniforms: {} as VignetteUniforms,

  name: 'vignette',
  source,
  fs,

  uniformTypes: {
    radius: 'f32',
    amount: 'f32'
  },
  defaultUniforms: {
    radius: 0.5,
    amount: 0.5
  },
  propTypes: {
    radius: {value: 0.5, min: 0, max: 1},
    amount: {value: 0.5, min: 0, max: 1}
  },

  passes: [{filter: true}]
} as const satisfies ShaderPass<VignetteProps, VignetteProps>;
