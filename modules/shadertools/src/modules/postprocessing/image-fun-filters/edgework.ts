// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderPass} from '../../../lib/shader-module/shader-pass';
import {glsl} from '../../../lib/glsl-utils/highlight';
import {random} from '../../math/random/random';

const fs = glsl`\
uniform edgeWorkUniforms {
  float radius;
  vec2 delta;
} edgeWork;

vec4 edgeWork_sampleColor1(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec2 relativeDelta = edgeWork.radius * edgeWork.delta / texSize;

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

vec4 edgeWork_sampleColor2(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec2 relativeDelta = edgeWork.radius * edgeWork.delta / texSize;

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
`;

/**
 * Edge Work -
 * Picks out different frequencies in the image by subtracting two
 * copies of the image blurred with different radii.
 */
export type EdgeWorkProps = {
  /** radius The radius of the effect in pixels. */
  radius?: number;
  /** @deprecated internal */
  delta?: number;
};

/**
 * Edge Work -
 * Picks out different frequencies in the image by subtracting two
 * copies of the image blurred with different radii.
 */
export const edgeWork: ShaderPass<EdgeWorkProps, EdgeWorkProps> = {
  name: 'edgeWork',
  uniformPropTypes: {
    radius: {value: 2, min: 1, softMax: 50},
    delta: {value: [1, 0], private: true}
  },
  fs,
  dependencies: [random],
  passes: [
    {
      // @ts-expect-error
      sampler: 'edgeWork_sampleColor1',
      uniformPropTypes: {delta: [1, 0]}
    },
    {
      // @ts-expect-error
      sampler: 'edgeWork_sampleColor2',
      uniformPropTypes: {delta: [0, 1]}
    }
  ]
};
