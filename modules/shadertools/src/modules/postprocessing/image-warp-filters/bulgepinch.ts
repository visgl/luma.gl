// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderPass} from '../../../lib/shader-module/shader-pass';
import {glsl} from '../../../lib/glsl-utils/highlight';
import {warp} from './warp';

const fs = glsl`\
uniform bulgePinchUniforms {
  float radius;
  float strength;
  vec2 center;
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

/**
 * Bulge / Pinch -
 * Bulges or pinches the image in a circle.
 */
export const bulgePinch: ShaderPass<BulgePinchProps, BulgePinchProps> = {
  name: 'bulgePinch',
  fs,
  uniformTypes: {
    center: 'vec2<f32>',
    radius: 'f32',
    strength: 'f32'
  },
  uniformPropTypes: {
    center: {value: [0.5, 0.5]},
    radius: {value: 200, min: 1, softMax: 600},
    strength: {value: 0.5, min: -1, max: 1}
  },
  dependencies: [warp],
  passes: [{sampler: true}]
};
