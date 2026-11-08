// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray4} from '@math.gl/core';
import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import {pbrMaterial} from '../pbr-material/pbr-material';

export type PBRContactShadowProps<TextureT = unknown> = {
  contactShadowTexture?: TextureT;
  /** Origin and dimensions of the receiver viewport, in physical pixels. */
  viewport?: Readonly<NumberArray4>;
  strength?: number;
  enabled?: boolean;
};
type ContactUniforms = {viewport: Readonly<NumberArray4>; strength: number; enabled: number};
type ContactBindings<TextureT = unknown> = {contactShadowTexture?: TextureT};

/** Applies a screen-space visibility mask to the first directional light only. */
export const pbrContactShadow: ShaderModule<
  PBRContactShadowProps,
  ContactUniforms,
  ContactBindings
> = {
  name: 'pbrContactShadow',
  dependencies: [pbrMaterial],
  bindingLayout: [
    {name: 'pbrContactShadow', group: 0},
    {name: 'contactShadowTexture', group: 2}
  ],
  uniformTypes: {viewport: 'vec4<f32>', strength: 'f32', enabled: 'i32'},
  defaultUniforms: {viewport: [0, 0, 1, 1], strength: 1, enabled: 1},
  getUniforms(properties = {}) {
    return {
      ...(properties.viewport ? {viewport: properties.viewport} : {}),
      ...(properties.strength === undefined ? {} : {strength: properties.strength}),
      ...(properties.enabled === undefined ? {} : {enabled: Number(properties.enabled)}),
      ...(properties.contactShadowTexture
        ? {contactShadowTexture: properties.contactShadowTexture}
        : {})
    };
  },
  source: /* wgsl */ `
struct PBRContactShadowUniforms {
  viewport: vec4f,
  strength: f32,
  enabled: i32,
};
@group(0) @binding(auto) var<uniform> pbrContactShadow: PBRContactShadowUniforms;
@group(2) @binding(auto) var contactShadowTexture: texture_2d<f32>;
@group(2) @binding(auto) var contactShadowTextureSampler: sampler;
fn pbrContactShadow_getFactor(pixelPosition:vec2f)->f32 {
  if(pbrContactShadow.enabled==0){return 1.0;}
  let coordinates=(pixelPosition-pbrContactShadow.viewport.xy)/pbrContactShadow.viewport.zw;
  if(any(coordinates<vec2f(0.0))||any(coordinates>vec2f(1.0))){return 1.0;}
  let visibility=textureSampleLevel(contactShadowTexture,contactShadowTextureSampler,coordinates,0.0).r;
  return mix(1.0,clamp(visibility,0.0,1.0),clamp(pbrContactShadow.strength,0.0,1.0));
}
fn pbrContactShadow_filterColor(vertexColor:vec4f,pixelPosition:vec2f)->vec4f {
  return pbr_filterColorWithShadows(vertexColor,pbrContactShadow_getFactor(pixelPosition),vec4f(1.0),vec4f(1.0));
}`,
  fs: /* glsl */ `
layout(std140) uniform pbrContactShadowUniforms {
  vec4 viewport;
  float strength;
  int enabled;
} pbrContactShadow;
uniform sampler2D contactShadowTexture;
float pbrContactShadow_getFactor(vec2 pixelPosition) {
  if(pbrContactShadow.enabled==0)return 1.0;
  vec2 coordinates=(pixelPosition-pbrContactShadow.viewport.xy)/pbrContactShadow.viewport.zw;
  if(any(lessThan(coordinates,vec2(0.0)))||any(greaterThan(coordinates,vec2(1.0))))return 1.0;
  float visibility=texture(contactShadowTexture,coordinates).r;
  return mix(1.0,clamp(visibility,0.0,1.0),clamp(pbrContactShadow.strength,0.0,1.0));
}
vec4 pbrContactShadow_filterColor(vec4 vertexColor,vec2 pixelPosition) {
  return pbr_filterColorWithShadows(vertexColor,pbrContactShadow_getFactor(pixelPosition),vec4(1.0),vec4(1.0));
}`
};
