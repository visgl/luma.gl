// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';
import {random} from '@luma.gl/shadertools';

const fs = /* glsl */ `\
uniform edgeWorkUniforms {
  float radius;
  int mode;
} edgeWork;

vec4 edgeWork_sampleColorRGB(sampler2D source, vec2 texSize, vec2 texCoord, vec2 delta) {
  vec2 relativeDelta = edgeWork.radius * delta / texSize;

  vec2 color = vec2(0.0);
  vec2 total = vec2(0.0);

  /* randomize the lookup values to hide the fixed number of samples */
  float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

  for (float t = -30.0; t <= 30.0; t++) {
    float percent = (t + offset - 0.5) / 30.0;
    float weight = 1.0 - abs(percent);
    vec3 sampleColor = texture(source, texCoord + relativeDelta * percent).rgb;
    float average = (sampleColor.r + sampleColor.g + sampleColor.b) / 3.0;
    color.x += average * weight;
    total.x += weight;
    if (abs(t) < 15.0) {
      weight = weight * 2.0 - 1.0;
      color.y += average * weight;
      total.y += weight;
    }
  }
  return vec4(color / total, 0.0, 1.0);
}

vec4 edgeWork_sampleColorXY(sampler2D source, vec2 texSize, vec2 texCoord, vec2 delta) {
  vec2 relativeDelta = edgeWork.radius * delta / texSize;

  vec2 color = vec2(0.0);
  vec2 total = vec2(0.0);

  /* randomize the lookup values to hide the fixed number of samples */
  float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

  for (float t = -30.0; t <= 30.0; t++) {
    float percent = (t + offset - 0.5) / 30.0;
    float weight = 1.0 - abs(percent);
    vec2 sampleColor = texture(source, texCoord + relativeDelta * percent).xy;
    color.x += sampleColor.x * weight;
    total.x += weight;
    if (abs(t) < 15.0) {
      weight = weight * 2.0 - 1.0;
      color.y += sampleColor.y * weight;
      total.y += weight;
    }
  }
  float c = clamp(10000.0 * (color.y / total.y - color.x / total.x) + 0.5, 0.0, 1.0);
  return vec4(c, c, c, 1.0);
}

vec4 edgeWork_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  switch (edgeWork.mode) {
    case 0: 
    return edgeWork_sampleColorRGB(source, texSize, texCoord, vec2(1., 0.));
    case 1: 
    default:
      return edgeWork_sampleColorXY(source, texSize, texCoord, vec2(0., 1.));
  }
}
`;

/**
 * Edge Work -
 * Picks out different frequencies in the image by subtracting two
 * copies of the image blurred with different radii.
 */
export type EdgeWorkProps = {
  /** radius The radius of the effect in pixels. */
  radius?: number;
  /** @deprecated xy or RGB */
  mode?: 0 | 1;
};

export type EdgeWorkUniforms = EdgeWorkProps;

/**
 * Edge Work -
 * Picks out different frequencies in the image by subtracting two
 * copies of the image blurred with different radii.
 */
export const edgeWork = {
  props: {} as EdgeWorkProps,
  uniforms: {} as EdgeWorkProps,

  name: 'edgeWork',
  dependencies: [random],
  fs,
  uniformTypes: {
    radius: 'f32',
    mode: 'i32'
  },
  propTypes: {
    radius: {value: 2, min: 1, softMax: 50},
    mode: {value: 0, private: true}
  },

  passes: [
    {
      sampler: true,
      uniforms: {mode: 0}
    },
    {
      sampler: true,
      uniforms: {mode: 1}
    }
  ]
} as const satisfies ShaderPass<EdgeWorkProps, EdgeWorkProps>;
