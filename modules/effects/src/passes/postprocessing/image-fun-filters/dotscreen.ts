// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

const source = /* wgsl */ `\
struct dotScreenUniforms {
  center: vec2f,
  angle: f32,
  size: f32,
};

@group(0) @binding(1) var<uniform> dotScreen: dotScreenUniforms;

fn pattern(texSize: vec2f, texCoord: vec2f) -> f32 {
  let scale = 3.1415 / dotScreen.size;
  let s = sin(dotScreen.angle);
  let c = cos(dotScreen.angle);
  let tex = texCoord * texSize - dotScreen.center * texSize;
  let point = vec2f(
    c * tex.x - s * tex.y,
    s * tex.x + c * tex.y
  ) * scale;
  return (sin(point.x) * sin(point.y)) * 4.0;
}

fn dotScreen_filterColor_ext(color: vec4f, texSize: vec2f, texCoord: vec2f) -> vec4f {
  let average = (color.r + color.g + color.b) / 3.0;
  return vec4f(vec3f(average * 10.0 - 5.0 + pattern(texSize, texCoord)), color.a);
}
`;

const fs = /* glsl */ `\
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

vec4 dotScreen_filterColor_ext(vec4 color, vec2 texSize, vec2 texCoord) {
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

export type DotScreenUniforms = DotScreenProps;

/**
 * Dot Screen -
 * Simulates a black and white halftone rendering of the image by multiplying
 * pixel values with a rotated 2D sine wave pattern.
 */
export const dotScreen = {
  name: 'dotScreen',
  source,
  fs,

  props: {} as DotScreenProps,
  uniforms: {} as DotScreenUniforms,
  uniformTypes: {
    center: 'vec2<f32>',
    angle: 'f32',
    size: 'f32'
  },
  propTypes: {
    center: {value: [0.5, 0.5]},
    angle: {value: 1.1, softMin: 0, softMax: Math.PI / 2},
    size: {value: 3, min: 1, softMin: 3, softMax: 20}
  },

  passes: [{filter: true}]
} as const satisfies ShaderPass<DotScreenProps, DotScreenProps>;
