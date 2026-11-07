// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray4} from '@math.gl/core';
import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import {pbrMaterial} from '../pbr-material/pbr-material';

export type PBRAmbientOcclusionProps<TextureT = unknown> = {
  ambientOcclusionTexture?: TextureT;
  /** Origin and dimensions of the receiver viewport, in physical pixels. */
  viewport?: Readonly<NumberArray4>;
  strength?: number;
  enabled?: boolean;
};
type AmbientUniforms = {viewport: Readonly<NumberArray4>; strength: number; enabled: number};
type AmbientBindings<TextureT = unknown> = {ambientOcclusionTexture?: TextureT};

/** Sets ambient visibility for the canonical PBR material; direct lighting and emission remain independent. */
export const pbrAmbientOcclusion: ShaderModule<
  PBRAmbientOcclusionProps,
  AmbientUniforms,
  AmbientBindings
> = {
  name: 'pbrAmbientOcclusion',
  dependencies: [pbrMaterial],
  bindingLayout: [
    {name: 'pbrAmbientOcclusion', group: 0},
    {name: 'ambientOcclusionTexture', group: 2}
  ],
  uniformTypes: {viewport: 'vec4<f32>', strength: 'f32', enabled: 'i32'},
  defaultUniforms: {viewport: [0, 0, 1, 1], strength: 1, enabled: 1},
  getUniforms(properties = {}) {
    return {
      ...(properties.viewport ? {viewport: properties.viewport} : {}),
      ...(properties.strength === undefined ? {} : {strength: properties.strength}),
      ...(properties.enabled === undefined ? {} : {enabled: Number(properties.enabled)}),
      ...(properties.ambientOcclusionTexture
        ? {ambientOcclusionTexture: properties.ambientOcclusionTexture}
        : {})
    };
  },
  source: /* wgsl */ `
struct PBRAmbientOcclusionUniforms {
  viewport: vec4f,
  strength: f32,
  enabled: i32,
};
@group(0) @binding(auto) var<uniform> pbrAmbientOcclusion: PBRAmbientOcclusionUniforms;
@group(2) @binding(auto) var ambientOcclusionTexture: texture_2d<f32>;
@group(2) @binding(auto) var ambientOcclusionTextureSampler: sampler;
fn pbrAmbientOcclusion_getFactor(pixelPosition:vec2f)->f32 {
  if(pbrAmbientOcclusion.enabled==0){return 1.0;}
  let coordinates=(pixelPosition-pbrAmbientOcclusion.viewport.xy)/pbrAmbientOcclusion.viewport.zw;
  if(any(coordinates<vec2f(0.0))||any(coordinates>vec2f(1.0))){return 1.0;}
  let visibility=textureSampleLevel(ambientOcclusionTexture,ambientOcclusionTextureSampler,coordinates,0.0).r;
  return mix(1.0,clamp(visibility,0.0,1.0),clamp(pbrAmbientOcclusion.strength,0.0,1.0));
}
fn pbrAmbientOcclusion_setFactor(pixelPosition:vec2f) {
  pbr_ambientVisibility = pbrAmbientOcclusion_getFactor(pixelPosition);
}`,
  fs: /* glsl */ `
layout(std140) uniform pbrAmbientOcclusionUniforms {
  vec4 viewport;
  float strength;
  int enabled;
} pbrAmbientOcclusion;
uniform sampler2D ambientOcclusionTexture;
float pbrAmbientOcclusion_getFactor(vec2 pixelPosition) {
  if(pbrAmbientOcclusion.enabled==0)return 1.0;
  vec2 coordinates=(pixelPosition-pbrAmbientOcclusion.viewport.xy)/pbrAmbientOcclusion.viewport.zw;
  if(any(lessThan(coordinates,vec2(0.0)))||any(greaterThan(coordinates,vec2(1.0))))return 1.0;
  float visibility=texture(ambientOcclusionTexture,coordinates).r;
  return mix(1.0,clamp(visibility,0.0,1.0),clamp(pbrAmbientOcclusion.strength,0.0,1.0));
}
void pbrAmbientOcclusion_setFactor(vec2 pixelPosition) {
  pbr_ambientVisibility = pbrAmbientOcclusion_getFactor(pixelPosition);
}`
};
