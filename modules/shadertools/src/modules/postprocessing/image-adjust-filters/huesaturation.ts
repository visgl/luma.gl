// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderPass} from '../../../lib/shader-module/shader-pass';
import {glsl} from '../../../lib/glsl-utils/highlight';

const fs = glsl`\
uniform hueSaturationUniforms {
  float hue;
  float saturation;
} hueSaturation;

vec4 hueSaturation_filterColor(vec4 color) {
  // hue adjustment, wolfram alpha: RotationTransform[angle, {1, 1, 1}][{x, y, z}]
  float angle = hueSaturation.hue * 3.14159265;
  float s = sin(angle), c = cos(angle);
  vec3 weights = (vec3(2.0 * c, -sqrt(3.0) * s - c, sqrt(3.0) * s - c) + 1.0) / 3.0;
  float len = length(color.rgb);
  color.rgb = vec3(
    dot(color.rgb, weights.xyz),
    dot(color.rgb, weights.zxy),
    dot(color.rgb, weights.yzx)
  );

  // saturation adjustment
  float average = (color.r + color.g + color.b) / 3.0;
  if (hueSaturation.saturation > 0.0) {
    color.rgb += (average - color.rgb) * (1.0 - 1.0 / (1.001 - hueSaturation.saturation));
  } else {
    color.rgb += (average - color.rgb) * (-hueSaturation.saturation);
  }

  return color;
}

vec4 hueSaturation_filterColor(vec4 color, vec2 texSize, vec2 texCoord) {
  return hueSaturation_filterColor(color);
}
`;

/**
 * Hue / Saturation
 */
export type HueSaturationProps = {
  /** -1 to 1 (-1 is 180 degree rotation in the negative direction, 0 is no change,
   * and 1 is 180 degree rotation in the positive direction) */
  hue?: number;
  /** @param saturation -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast) */
  saturation?: number;
};

/**
 * Hue / Saturation
 * Provides rotational hue and multiplicative saturation control. RGB color space
 * can be imagined as a cube where the axes are the red, green, and blue color
 * values. Hue changing works by rotating the color vector around the grayscale
 * line, which is the straight line from black (0, 0, 0) to white (1, 1, 1).
 * Saturation is implemented by scaling all color channel values either toward
 * or away from the average color channel value.
 */
export const hueSaturation: ShaderPass<HueSaturationProps> = {
  name: 'hueSaturation',
  uniformTypes: {
    hue: 'f32',
    saturation: 'f32'
  },
  uniformPropTypes: {
    hue: {value: 0, min: -1, max: 1},
    saturation: {value: 0, min: -1, max: 1}
  },
  fs,
  passes: [{filter: true}]
};
