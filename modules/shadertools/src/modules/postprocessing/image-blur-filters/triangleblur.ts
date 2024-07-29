// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderPass} from '../../../lib/shader-module/shader-pass';
import {glsl} from '../../../lib/glsl-utils/highlight';
import {random} from '../..//math/random/random';

const fs = glsl`\
uniform triangleBlurUniforms {
  float radius;
  vec2 delta;
} triangleBlur;

vec4 triangleBlur_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec2 adjustedDelta = triangleBlur.delta * triangleBlur.radius / texSize;

  vec4 color = vec4(0.0);
  float total = 0.0;

  /* randomize the lookup values to hide the fixed number of samples */
  float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

  for (float t = -30.0; t <= 30.0; t++) {
    float percent = (t + offset - 0.5) / 30.0;
    float weight = 1.0 - abs(percent);
    vec4 offsetColor = texture(source, texCoord + adjustedDelta * percent);

    /* switch to pre-multiplied alpha to correctly blur transparent images */
    offsetColor.rgb *= offsetColor.a;

    color += offsetColor * weight;
    total += weight;
  }

  color = color / total;

  /* switch back from pre-multiplied alpha */
  color.rgb /= color.a + 0.00001;

  return color;
}
`;

/**
 * @filter       Triangle Blur
 * @description  This is the most basic blur filter, which convolves the image with a
 *               pyramid filter. The pyramid filter is separable and is applied as two
 *               perpendicular triangle filters.
 */
export type TriangleBlurProps = {
  /** The radius of the pyramid convolved with the image. */
  radius?: number;
  /** @deprecated internal property */
  delta?: [number, number];
};

/**
 * @filter       Triangle Blur
 * @description  This is the most basic blur filter, which convolves the image with a
 *               pyramid filter. The pyramid filter is separable and is applied as two
 *               perpendicular triangle filters.
 */
export const triangleBlur: ShaderPass<TriangleBlurProps, TriangleBlurProps> = {
  name: 'triangleBlur',
  uniformTypes: {
    radius: 'f32',
    delta: 'vec2<f32>'
  },
  uniformPropTypes: {
    radius: {value: 20, min: 0, softMax: 100},
    delta: {value: [1, 0], private: true}
  },
  fs,
  dependencies: [random],
  passes: [
    {sampler: true, uniforms: {delta: [1, 0]}},
    {sampler: true, uniforms: {delta: [0, 1]}}
  ]
};
