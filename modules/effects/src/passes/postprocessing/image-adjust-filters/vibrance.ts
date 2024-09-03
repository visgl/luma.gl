// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

const fs = /* glsl */ `\
uniform vibranceUniforms {
  float amount;
} vibrance;

vec4 vibrance_filterColor(vec4 color) {
  float average = (color.r + color.g + color.b) / 3.0;
  float mx = max(color.r, max(color.g, color.b));
  float amt = (mx - average) * (-vibrance.amount * 3.0);
  color.rgb = mix(color.rgb, vec3(mx), amt);
  return color;
}

vec4 vibrance_filterColor_ext(vec4 color, vec2 texSize, vec2 texCoord) {
  return vibrance_filterColor(color);
}
`;

/**
 * Vibrance - Modifies the saturation of desaturated colors, leaving saturated colors unmodified.
 */
export type VibranceProps = {
  /** -1 to 1 (-1 is minimum vibrance, 0 is no change, and 1 is maximum vibrance) */
  amount?: number;
};

export type VibranceUniforms = VibranceProps;

/** Vibrance - Modifies the saturation of desaturated colors, leaving saturated colors unmodified. */
export const vibrance = {
  props: {} as VibranceProps,
  uniforms: {} as VibranceUniforms,
  name: 'vibrance',
  uniformTypes: {
    amount: 'f32'
  },
  propTypes: {
    amount: {value: 0, min: -1, max: 1}
  },
  fs,
  passes: [{filter: true}]
} as const satisfies ShaderPass<VibranceProps, VibranceProps>;
