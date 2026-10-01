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
  /** Spatial density variation, from uniform (0) to wispy (1). */
  variation: number;
  /** Horizontal size of fog banks in metres. */
  wispScale: number;
  /** Fog advection in metres per second in the same frame as the positions. */
  velocity: [number, number, number];
  time: number;
  /** Rate of internal wisp deformation; zero keeps a rigidly advected field. */
  evolutionSpeed: number;
};
export type HeightFogProps = Partial<HeightFogUniforms>;

/** Analytic extinction through a height-dependent atmosphere. All distances are metres. */
export const heightFog = {
  name: 'heightFog',
  dependencies: [heightFogFunctions],
  bindingLayout: [{name: 'heightFog', group: 3}],
  uniformTypes: {
    color: 'vec3<f32>',
    density: 'f32',
    baseHeight: 'f32',
    heightFalloff: 'f32',
    variation: 'f32',
    wispScale: 'f32',
    velocity: 'vec3<f32>',
    time: 'f32',
    evolutionSpeed: 'f32'
  },
  defaultUniforms: {
    color: [0.65, 0.72, 0.78],
    density: 0,
    baseHeight: 0,
    heightFalloff: 0.01,
    variation: 0,
    wispScale: 160,
    velocity: [0, 0, 0],
    time: 0,
    evolutionSpeed: 0
  },
  getUniforms(props: HeightFogProps = {}) {
    return props;
  },
  fs: /* glsl */ `
layout(std140) uniform heightFogUniforms {
  vec3 color;
  float density;
  float baseHeight;
  float heightFalloff;
  float variation;
  float wispScale;
  vec3 velocity;
  float time;
  float evolutionSpeed;
} heightFog;
float heightFog_getTransmittance(vec3 position, vec3 cameraPosition) {
  return heightFog_getSpatialTransmittance(cameraPosition, position, vec3(0.0, 0.0, 1.0),
    heightFog.density, heightFog.baseHeight, heightFog.heightFalloff, heightFog.variation, heightFog.wispScale, heightFog.time, heightFog.velocity, heightFog.evolutionSpeed);
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
  variation: f32,
  wispScale: f32,
  velocity: vec3<f32>,
  time: f32,
  evolutionSpeed: f32,
};
@group(3) @binding(auto) var<uniform> heightFog: heightFogUniforms;
fn heightFog_getTransmittance(position: vec3<f32>, cameraPosition: vec3<f32>) -> f32 {
  return heightFog_getSpatialTransmittance(cameraPosition, position, vec3<f32>(0.0, 0.0, 1.0),
    heightFog.density, heightFog.baseHeight, heightFog.heightFalloff, heightFog.variation, heightFog.wispScale, heightFog.time, heightFog.velocity, heightFog.evolutionSpeed);
}
fn heightFog_getColor(color: vec4<f32>, position: vec3<f32>, cameraPosition: vec3<f32>) -> vec4<f32> {
  return vec4<f32>(mix(heightFog.color, color.rgb, heightFog_getTransmittance(position, cameraPosition)), color.a);
}
`
} as const satisfies ShaderModule<HeightFogProps, HeightFogUniforms>;
