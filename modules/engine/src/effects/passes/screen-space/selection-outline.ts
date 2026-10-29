// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

export type SelectionOutlineProps = {
  color?: [number, number, number, number];
  /** Outline radius in mask pixels, clamped to [0, 8]. */
  thickness?: number;
};
export type SelectionOutlineUniforms = Required<SelectionOutlineProps>;

/** Outlines an external selectionTexture mask over premultiplied source color. */
export const selectionOutline = {
  name: 'selectionOutline',
  source: /* wgsl */ `
struct selectionOutlineUniforms {
  color: vec4<f32>,
  thickness: f32,
};
@group(0) @binding(auto) var<uniform> selectionOutline: selectionOutlineUniforms;
@group(0) @binding(auto) var selectionTexture: texture_2d<f32>;
@group(0) @binding(auto) var selectionTextureSampler: sampler;
fn selectionOutline_sampleColor(sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler,
  sourceSize: vec2<f32>, texCoord: vec2<f32>) -> vec4<f32> {
  let center = textureSample(selectionTexture, selectionTextureSampler, texCoord).r;
  let texel = clamp(selectionOutline.thickness, 0.0, 8.0) / (2.0 * vec2<f32>(textureDimensions(selectionTexture)));
  var maximum = center;
  for (var horizontal = -2; horizontal <= 2; horizontal++) {
    for (var vertical = -2; vertical <= 2; vertical++) {
      let offset = vec2<f32>(f32(horizontal), f32(vertical)) * texel;
      maximum = max(maximum, textureSample(selectionTexture, selectionTextureSampler, clamp(texCoord + offset, vec2<f32>(0.0), vec2<f32>(1.0))).r);
    }
  }
  let coverage = clamp(maximum - center, 0.0, 1.0) * selectionOutline.color.a;
  let source = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  return vec4<f32>(mix(source.rgb, selectionOutline.color.rgb, coverage), coverage + source.a * (1.0 - coverage));
}
`,
  fs: /* glsl */ `
layout(std140) uniform selectionOutlineUniforms {
  vec4 color;
  float thickness;
} selectionOutline;
uniform sampler2D selectionTexture;
vec4 selectionOutline_sampleColor(sampler2D sourceTexture, vec2 sourceSize, vec2 texCoord) {
  float center = texture(selectionTexture, texCoord).r;
  vec2 texel = clamp(selectionOutline.thickness, 0.0, 8.0) / (2.0 * vec2(textureSize(selectionTexture, 0)));
  float maximum = center;
  for (int horizontal = -2; horizontal <= 2; horizontal++) {
    for (int vertical = -2; vertical <= 2; vertical++) {
      vec2 offset = vec2(float(horizontal), float(vertical)) * texel;
      maximum = max(maximum, texture(selectionTexture, clamp(texCoord + offset, vec2(0.0), vec2(1.0))).r);
    }
  }
  float coverage = clamp(maximum - center, 0.0, 1.0) * selectionOutline.color.a;
  vec4 source = texture(sourceTexture, texCoord);
  return vec4(mix(source.rgb, selectionOutline.color.rgb, coverage), coverage + source.a * (1.0 - coverage));
}
`,
  bindingLayout: [{name: 'selectionTexture', group: 0}],
  props: {} as SelectionOutlineProps,
  uniforms: {} as SelectionOutlineUniforms,
  uniformTypes: {color: 'vec4<f32>', thickness: 'f32'},
  defaultUniforms: {color: [0.12, 1, 0.7, 0.9], thickness: 2},
  passes: [{sampler: true}]
} as const satisfies ShaderPass<SelectionOutlineProps, SelectionOutlineUniforms>;
