// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';
import {warp} from './warp';

const fs = /* glsl */ `\
uniform swirlUniforms {
  float radius;
  float angle;
  vec2 center;
} swirl;

vec2 swirl_warp(vec2 coord, vec2 texCenter) {
  coord -= texCenter;
  float distance = length(coord);
  if (distance < swirl.radius) {
    float percent = (swirl.radius - distance) / swirl.radius;
    float theta = percent * percent * swirl.angle;
    float s = sin(theta);
    float c = cos(theta);
    coord = vec2(
      coord.x * c - coord.y * s,
      coord.x * s + coord.y * c
    );
  }
  coord += texCenter;
  return coord;
}

vec4 swirl_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec2 coord = texCoord * texSize;
  coord = swirl_warp(coord, swirl.center * texSize);

  return warp_sampleColor(source, texSize, coord);
}
`;

/**
 * Warps a circular region of the image in a swirl.
 */
export type SwirlProps = {
  /** [x, y] coordinates of the center of the circle of effect. default: [0.5, 0.5] */
  center?: [number, number];
  /**  The radius of the circular region. */
  radius?: number;
  /** The angle in radians that the pixels in the center of the circular region will be rotated by. */
  angle?: number;
};

export type SwirlUniforms = SwirlProps;

/**
 * Warps a circular region of the image in a swirl.
 */
export const swirl = {
  props: {} as SwirlProps,
  uniforms: {} as SwirlProps,

  name: 'swirl',
  dependencies: [warp],
  fs,

  uniformTypes: {
    center: 'vec2<f32>',
    radius: 'f32',
    angle: 'f32'
  },
  propTypes: {
    center: {value: [0.5, 0.5]},
    radius: {value: 200, min: 1, softMax: 600},
    angle: {value: 3, softMin: -25, softMax: 25}
  },

  passes: [{sampler: true}]
} as const satisfies ShaderPass<SwirlProps, SwirlProps>;
