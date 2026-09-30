// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import {heightFogFunctions} from './height-fog-functions';

export type HeightFogUniforms = {
  color: [number, number, number];
  density: number;
  baseHeight: number;
  heightFalloff: number;
};
export type HeightFogProps = Partial<HeightFogUniforms>;

/** Analytic extinction through a height-dependent atmosphere. All distances are metres. */
export const heightFog = {
  name: 'heightFog',
  dependencies: [heightFogFunctions],
  bindingLayout: [{name: 'heightFog', group: 3}],
  uniformTypes: {color: 'vec3<f32>', density: 'f32', baseHeight: 'f32', heightFalloff: 'f32'},
  defaultUniforms: {color: [0.65, 0.72, 0.78], density: 0, baseHeight: 0, heightFalloff: 0.01},
  getUniforms(props: HeightFogProps = {}) {
    return props;
  },
  fs: /* glsl */ `
layout(std140) uniform heightFogUniforms {
  vec3 color;
  float density;
  float baseHeight;
  float heightFalloff;
} heightFog;
float heightFog_getTransmittance(vec3 position, vec3 cameraPosition) {
  return heightFog_getRayTransmittance(distance(position, cameraPosition), cameraPosition.z, position.z,
    heightFog.density, heightFog.baseHeight, heightFog.heightFalloff);
}
vec4 heightFog_getColor(vec4 color, vec3 position, vec3 cameraPosition) {
  return vec4(mix(heightFog.color, color.rgb, heightFog_getTransmittance(position, cameraPosition)), color.a);
}
`,
  source: /* wgsl */ `
struct heightFogUniforms {
  color: vec3<f32>,
  density: f32,
  baseHeight: f32,
  heightFalloff: f32,
};
@group(3) @binding(auto) var<uniform> heightFog: heightFogUniforms;
fn heightFog_getTransmittance(position: vec3<f32>, cameraPosition: vec3<f32>) -> f32 {
  return heightFog_getRayTransmittance(distance(position, cameraPosition), cameraPosition.z, position.z,
    heightFog.density, heightFog.baseHeight, heightFog.heightFalloff);
}
fn heightFog_getColor(color: vec4<f32>, position: vec3<f32>, cameraPosition: vec3<f32>) -> vec4<f32> {
  return vec4<f32>(mix(heightFog.color, color.rgb, heightFog_getTransmittance(position, cameraPosition)), color.a);
}
`
} as const satisfies ShaderModule<HeightFogProps, HeightFogUniforms>;
