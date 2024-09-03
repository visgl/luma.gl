// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

const fs = /* glsl */ `\
uniform sepiaUniforms {
  float amount;
} sepia;

vec4 sepia_filterColor(vec4 color) {
  float r = color.r;
  float g = color.g;
  float b = color.b;

  color.r =
    min(1.0, (r * (1.0 - (0.607 * sepia.amount))) + (g * (0.769 * sepia.amount)) + (b * (0.189 * sepia.amount)));
  color.g = min(1.0, (r * 0.349 * sepia.amount) + (g * (1.0 - (0.314 * sepia.amount))) + (b * 0.168 * sepia.amount));
  color.b = min(1.0, (r * 0.272 * sepia.amount) + (g * 0.534 * sepia.amount) + (b * (1.0 - (0.869 * sepia.amount))));

  return color;
}

vec4 sepia_filterColor_ext(vec4 color, vec2 texSize, vec2 texCoord) {
  return sepia_filterColor(color);
}
`;

export type SepiaProps = {
  amount?: number;
};

export type SepiaUniforms = SepiaProps;

/**
 * @filter         Sepia
 * @description    Gives the image a reddish-brown monochrome tint that imitates an old photograph.
 * @param amount   0 to 1 (0 for no effect, 1 for full sepia coloring)
 */
export const sepia = {
  props: {} as SepiaProps,
  uniforms: {} as SepiaUniforms,

  name: 'sepia',
  uniformTypes: {
    amount: 'f32'
  },
  propTypes: {
    amount: {value: 0.5, min: 0, max: 1}
  },
  fs,
  passes: [{filter: true}]
} as const satisfies ShaderPass<SepiaProps, SepiaProps>;
