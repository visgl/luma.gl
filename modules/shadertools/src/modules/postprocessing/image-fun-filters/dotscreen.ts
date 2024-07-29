// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderPass} from '../../../lib/shader-module/shader-pass';
import {glsl} from '../../../lib/glsl-utils/highlight';

const fs = glsl`\
uniform dotScreenUniforms {
  vec2 center;
  float angle;
  float size;
} dotScreen;

float pattern(vec2 texSize, vec2 texCoord) {
  float scale = 3.1415 / dotScreen.size;

  float s = sin(dotScreen.angle), c = cos(dotScreen.angle);
  vec2 tex = texCoord * texSize - dotScreen.center * texSize;
  vec2 point = vec2(
    c * tex.x - s * tex.y,
    s * tex.x + c * tex.y
  ) * scale;
  return (sin(point.x) * sin(point.y)) * 4.0;
}

vec4 dotScreen_filterColor(vec4 color, vec2 texSize, vec2 texCoord) {
  float average = (color.r + color.g + color.b) / 3.0;
  return vec4(vec3(average * 10.0 - 5.0 + pattern(texSize, texCoord)), color.a);
}
`;

/**
 * Dot Screen -
 * Simulates a black and white halftone rendering of the image by multiplying
 * pixel values with a rotated 2D sine wave pattern.
 */
export type DotScreenProps = {
  /** The x, y coordinate of the pattern origin. */
  center?: [number, number];
  /** The rotation of the pattern in radians. */
  angle?: number;
  /** The diameter of a dot in pixels. */
  size?: number;
};

/**
 * Dot Screen -
 * Simulates a black and white halftone rendering of the image by multiplying
 * pixel values with a rotated 2D sine wave pattern.
 */
export const dotScreen: ShaderPass<DotScreenProps, DotScreenProps> = {
  name: 'dotScreen',
  uniformTypes: {
    center: 'vec2<f32>',
    angle: 'f32',
    size: 'f32'
  },
  uniformPropTypes: {
    center: {value: [0.5, 0.5]},
    angle: {value: 1.1, softMin: 0, softMax: Math.PI / 2},
    size: {value: 3, min: 1, softMin: 3, softMax: 20}
  },
  fs,
  passes: [{filter: true}]
};
