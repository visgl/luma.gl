// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderPass} from '../../../lib/shader-module/shader-pass';
import {glsl} from '../../../lib/glsl-utils/highlight';

const fs = glsl`\
uniform vignetteUniforms {
  float radius;
  float amount;
} vignette;

vec4 vignette_filterColor(vec4 color, vec2 texCoord) {
  float dist = distance(texCoord, vec2(0.5, 0.5));
  float ratio = smoothstep(0.8, vignette.radius * 0.799, dist * (vignette.amount + vignette.radius));
  return color.rgba * ratio + (1.0 - ratio)*vec4(0.0, 0.0, 0.0, 1.0);
}

vec4 vignette_filterColor(vec4 color, vec2 texSize, vec2 texCoord) {
  return vignette_filterColor(color, texCoord);
}
`;

/**
 * Vignette - Adds a simulated lens edge darkening effect.
 */
export type VignetteProps = {
  /** 0 to 1 (0 for center of frame, 1 for edge of frame) */
  radius?: number;
  /** 0 to 1 (0 for no effect, 1 for maximum lens darkening) */
  amount?: number;
};

/**
 * Vignette -
 * Adds a simulated lens edge darkening effect.
 */
export const vignette: ShaderPass<VignetteProps, VignetteProps> = {
  name: 'vignette',
  fs,
  uniformTypes: {
    radius: 'f32',
    amount: 'f32'
  },
  uniformPropTypes: {
    radius: {value: 0.5, min: 0, max: 1},
    amount: {value: 0.5, min: 0, max: 1}
  },
  passes: [{filter: true}]
};
