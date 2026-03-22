// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';
import {warp} from './warp';

const source = /* wgsl */ `\
struct bulgePinchUniforms {
  center: vec2f,
  radius: f32,
  strength: f32,
};

@group(0) @binding(auto) var<uniform> bulgePinch: bulgePinchUniforms;

fn bulgePinch_warp(coordIn: vec2f, texCenter: vec2f) -> vec2f {
  var coord = coordIn - texCenter;
  let distance = length(coord);
  if (distance < bulgePinch.radius) {
    let percent = distance / bulgePinch.radius;
    let safeDistance = max(distance, 0.00001);
    if (bulgePinch.strength > 0.0) {
      coord *= mix(
        1.0,
        smoothstep(0.0, bulgePinch.radius / safeDistance, percent),
        bulgePinch.strength * 0.75
      );
    } else {
      coord *= mix(
        1.0,
        pow(percent, 1.0 + bulgePinch.strength * 0.75) * bulgePinch.radius / safeDistance,
        1.0 - percent
      );
    }
  }
  coord += texCenter;
  return coord;
}

fn bulgePinch_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  var coord = texCoord * texSize;
  coord = bulgePinch_warp(coord, bulgePinch.center * texSize);
  return warp_sampleColor(sourceTexture, sourceTextureSampler, texSize, coord);
}
`;

const fs = /* glsl */ `\
uniform bulgePinchUniforms {
  vec2 center;
  float radius;
  float strength;
} bulgePinch;

vec2 bulgePinch_warp(vec2 coord, vec2 texCenter) {
  coord -= texCenter;
  float distance = length(coord);
  if (distance < bulgePinch.radius) {
    float percent = distance / bulgePinch.radius;
    if (bulgePinch.strength > 0.0) {
      coord *= mix(1.0, smoothstep(0.0, bulgePinch.radius / distance, percent), bulgePinch.strength * 0.75);
    } else {
      coord *= mix(1.0, pow(percent, 1.0 + bulgePinch.strength * 0.75) * bulgePinch.radius / distance, 1.0 - percent);
    }
  }
  coord += texCenter;
  return coord;
}

vec4 bulgePinch_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec2 coord = texCoord * texSize;
  coord = bulgePinch_warp(coord, bulgePinch.center * texSize);

  return warp_sampleColor(source, texSize, coord);
}
`;

/** Bulges or pinches the image in a circle. */
export type BulgePinchProps = {
  /** The [x, y] coordinates of the center of the circle of effect. */
  center?: [number, number];
  /** The radius of the circle of effect. */
  radius?: number;
  /** strength -1 to 1 (-1 is strong pinch, 0 is no effect, 1 is strong bulge) */
  strength?: number;
};

export type BulgePinchUniforms = BulgePinchProps;

/**
 * Bulge / Pinch -
 * Bulges or pinches the image in a circle.
 */
export const bulgePinch = {
  name: 'bulgePinch',
  dependencies: [warp],
  source,
  fs,

  props: {} as BulgePinchProps,
  uniforms: {} as BulgePinchUniforms,
  uniformTypes: {
    center: 'vec2<f32>',
    radius: 'f32',
    strength: 'f32'
  },
  propTypes: {
    center: {value: [0.5, 0.5]},
    radius: {value: 200, min: 1, softMax: 600},
    strength: {value: 0.5, min: -1, max: 1}
  },

  passes: [{sampler: true}]
} as const satisfies ShaderPass<BulgePinchProps, BulgePinchProps>;
