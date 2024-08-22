// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderPass} from '../../../lib/shader-module/shader-pass';

const source = /* wgsl */ `\
struct brightnessContrastUniforms {
  float brightness;
  float contrast;
};

// Binding 0:1 is reserved for shader passes
@binding(1) @group(0) var<uniform> brightnessContrast : brightnessContrastUniforms;

fn brightnessContrast_filterColor_ext(color: vec4<f32>, texSize: vec2<f32>, texCoords: vec2<f32>) -> vec4<f32> {
  color.rgb += brightnessContrast.brightness;
  if (brightnessContrast.contrast > 0.0) {
    color.rgb = (color.rgb - 0.5) / (1.0 - brightnessContrast.contrast) + 0.5;
  } else {
    color.rgb = (color.rgb - 0.5) * (1.0 + brightnessContrast.contrast) + 0.5;
  }
  return color;
}
`;

const fs = /* glsl */ `\
uniform brightnessContrastUniforms {
  float brightness;
  float contrast;
} brightnessContrast;

vec4 brightnessContrast_filterColor(vec4 color) {
  color.rgb += brightnessContrast.brightness;
  if (brightnessContrast.contrast > 0.0) {
    color.rgb = (color.rgb - 0.5) / (1.0 - brightnessContrast.contrast) + 0.5;
  } else {
    color.rgb = (color.rgb - 0.5) * (1.0 + brightnessContrast.contrast) + 0.5;
  }
  return color;
}

vec4 brightnessContrast_filterColor_ext(vec4 color, vec2 texSize, vec2 texCoord) {
  return brightnessContrast_filterColor(color);
}
`;

export type BrightnessContrastProps = {
  brightness?: number;
  contrast?: number;
};

export type BrightnessContrastUniforms = BrightnessContrastProps;

/**
 * Brightness / Contrast -
 * Provides additive brightness and multiplicative contrast control.
 * @param brightness -1 to 1 (-1 is solid black, 0 is no change, and 1 is solid white)
 * @param contrast   -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)
 */
export const brightnessContrast = {
  props: {} as BrightnessContrastProps,

  name: 'brightnessContrast',
  uniformTypes: {
    brightness: 'f32',
    contrast: 'f32'
  },
  defaultUniforms: {
    brightness: 0,
    contrast: 0
  },
  propTypes: {
    brightness: {format: 'f32', value: 0, min: -1, max: 1},
    contrast: {format: 'f32', value: 0, min: -1, max: 1}
  },
  passes: [{filter: true}],

  source,
  fs
} as const satisfies ShaderPass<BrightnessContrastProps>;
