// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {ShaderPass} from '../../../lib/shader-module/shader-pass';
import {glsl} from '../../../lib/glsl-utils/highlight';

// TODO pass texCoord to angle
const fs = glsl`\
uniform colorHalftoneUniforms {
  vec2 center;
  float angle;
  float size;
} colorHalftone;

float scale = 3.1514 / colorHalftone.size;

float pattern(float angle, vec2 texSize, vec2 texCoord) {
  float s = sin(colorHalftone.angle), c = cos(colorHalftone.angle);
  vec2 tex = texCoord * texSize - colorHalftone.center * texSize;
  vec2 point = vec2(
	c * tex.x - s * tex.y,
	s * tex.x + c * tex.y
  ) * scale;
  return (sin(point.x) * sin(point.y)) * 4.0;
}

vec4 colorHalftone_filterColor(vec4 color, vec2 texSize, vec2 texCoord) {
  vec3 cmy = 1.0 - color.rgb;
  float k = min(cmy.x, min(cmy.y, cmy.z));
  cmy = (cmy - k) / (1.0 - k);
  cmy = clamp(
	cmy * 10.0 - 3.0 + vec3(
    pattern(angle + 0.26179, texSize, texCoord),
	  pattern(angle + 1.30899, texSize, texCoord),
    pattern(angle, texSize, texCoord)
  ),
	0.0,
	1.0
  );
  k = clamp(k * 10.0 - 5.0 + pattern(angle + 0.78539, texSize, texCoord), 0.0, 1.0);
  return vec4(1.0 - cmy - k, color.a);
}
`;

/**
 * Color Halftone -
 * Simulates a CMYK halftone rendering of the image by multiplying pixel values
 * with a four rotated 2D sine wave patterns, one each for cyan, magenta, yellow,
 * and black.
 */
export type ColorHalftoneProps = {
  /** The x,y coordinate of the pattern origin. */
  center?: number[];
  /** The rotation of the pattern in radians. */
  angle?: number;
  /** The diameter of a dot in pixels. */
  size?: number;
};

/**
 * Color Halftone -
 * Simulates a CMYK halftone rendering of the image by multiplying pixel values
 * with a four rotated 2D sine wave patterns, one each for cyan, magenta, yellow,
 * and black.
 */
export const colorHalftone: ShaderPass<ColorHalftoneProps, ColorHalftoneProps> = {
  name: 'colorHalftone',
  uniformTypes: {
    center: 'vec2<f32>',
    angle: 'f32',
    size: 'f32'
  },
  uniformPropTypes: {
    center: {value: [0.5, 0.5]},
    angle: {value: 1.1, softMin: 0, softMax: Math.PI / 2},
    size: {value: 4, min: 1, softMin: 3, softMax: 20}
  },
  fs,
  passes: [{filter: true}]
};
