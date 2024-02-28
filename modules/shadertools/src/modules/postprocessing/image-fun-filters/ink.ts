// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderPass} from '../../../lib/shader-module/shader-pass';
import {glsl} from '../../../lib/glsl-utils/highlight';

const fs = glsl`\
uniform inkUniforms {
  float strength;
} ink;

vec4 ink_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec2 dx = vec2(1.0 / texSize.x, 0.0);
  vec2 dy = vec2(0.0, 1.0 / texSize.y);
  vec4 color = texture(source, texCoord);
  float bigTotal = 0.0;
  float smallTotal = 0.0;
  vec3 bigAverage = vec3(0.0);
  vec3 smallAverage = vec3(0.0);
  for (float x = -2.0; x <= 2.0; x += 1.0) {
    for (float y = -2.0; y <= 2.0; y += 1.0) {
      vec3 offsetColor = texture(source, texCoord + dx * x + dy * y).rgb;
      bigAverage += offsetColor;
      bigTotal += 1.0;
      if (abs(x) + abs(y) < 2.0) {
        smallAverage += offsetColor;
        smallTotal += 1.0;
      }
    }
  }
  vec3 edge = max(vec3(0.0), bigAverage / bigTotal - smallAverage / smallTotal);
  float power = ink.strength * ink.strength * ink.strength * ink.strength * ink.strength;
  return vec4(color.rgb - dot(edge, edge) * power * 100000.0, color.a);
}
`;

/**
 * Ink -
 * Simulates outlining the image in ink by darkening edges stronger than a
 * certain threshold. The edge detection value is the difference of two
 * copies of the image, each blurred using a blur of a different radius.
 */
export type InkProps = {
  /** The multiplicative scale of the ink edges.
   * Values in the range 0 to 1 are usually sufficient, where 0 doesn't change the image and 1 adds lots of black edges.
   * Negative strength values will create white ink edges instead of black ones.
   */
  strength?: number;
};

/**
 * Ink -
 * Simulates outlining the image in ink by darkening edges stronger than a
 * certain threshold. The edge detection value is the difference of two
 * copies of the image, each blurred using a blur of a different radius.
 */
export const ink: ShaderPass<InkProps, InkProps> = {
  name: 'ink',
  uniformTypes: {
    strength: 'f32'
  },
  uniformPropTypes: {
    strength: {value: 0.25, min: 0, softMax: 1}
  },
  fs,
  passes: [{sampler: true}]
};
