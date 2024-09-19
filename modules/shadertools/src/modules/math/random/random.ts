// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderModule} from '../../../lib/shader-module/shader-module';

const source = /* wgsl */ `\
fn random(scale: vec3f, seed: float) -> f32 {
  /* use the fragment position for a different seed per-pixel */
  return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}
`;

const fs = /* glsl */ `\
float random(vec3 scale, float seed) {
  /* use the fragment position for a different seed per-pixel */
  return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}
`;

/** Quick random generator for fragment shaders */
export const random = {
  name: 'random',
  source,
  fs
} as const satisfies ShaderModule<{}, {}>;
