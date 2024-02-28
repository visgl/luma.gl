// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderPass} from '../../../lib/shader-module/shader-pass';
import {random} from '../../math/random/random';

const fs = `
uniform zoomBlurUniforms {
  vec2 center;
  float strength;
} zoomBlur;

vec4 zoomBlur_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec4 color = vec4(0.0);
  float total = 0.0;
  vec2 toCenter = zoomBlur.center * texSize - texCoord * texSize;

  /* randomize the lookup values to hide the fixed number of samples */
  float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

  for (float t = 0.0; t <= 40.0; t++) {
    float percent = (t + offset) / 40.0;
    float weight = 4.0 * (percent - percent * percent);
    vec4 offsetColor = texture(source, texCoord + toCenter * percent * zoomBlur.strength / texSize);

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
 * Zoom Blur - Blurs the image away from a certain point, which looks like radial motion blur.
 */
export type ZoomBlurProps = {
  /** - The x, y coordinate of the blur origin. */
  center?: number[];
  /** - The strength of the blur. Values in the range 0 to 1 are usually sufficient, where 0 doesn't change the image and 1 creates a highly blurred image. */
  strength?: number;
};

/**
 * Zoom Blur
 * Blurs the image away from a certain point, which looks like radial motion blur.
 */
export const zoomBlur: ShaderPass<ZoomBlurProps, ZoomBlurProps> = {
  name: 'zoomBlur',
  uniformTypes: {
    center: 'vec2<f32>',
    strength: 'f32'
  },
  uniformPropTypes: {
    center: {value: [0.5, 0.5]},
    strength: {value: 0.3, min: 0, softMax: 1}
  },
  fs,
  dependencies: [random],
  passes: [{sampler: true}]
};
