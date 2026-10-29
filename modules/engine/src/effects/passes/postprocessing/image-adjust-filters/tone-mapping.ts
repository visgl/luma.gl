// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

const source = /* wgsl */ `\
struct toneMappingUniforms {
  exposure: f32,
  maximumLuminance: f32,
};

@group(0) @binding(auto) var<uniform> toneMapping: toneMappingUniforms;

fn toneMapping_filterColor_ext(color: vec4f, texSize: vec2f, texCoords: vec2f) -> vec4f {
  let exposedColor = max(color.rgb * toneMapping.exposure, vec3f(0.0));
  let numerator = exposedColor * (2.51 * exposedColor + vec3f(0.03));
  let denominator = exposedColor * (2.43 * exposedColor + vec3f(0.59)) + vec3f(0.14);
  let maximumLuminance = max(toneMapping.maximumLuminance, 1.0);
  let sceneLuminance = max(exposedColor.r, max(exposedColor.g, exposedColor.b));
  let highlightWeight = smoothstep(0.72, 1.7, sceneLuminance);
  let extendedScale = mix(1.0, maximumLuminance, highlightWeight);
  let mappedColor = clamp(
    numerator / denominator * extendedScale,
    vec3f(0.0),
    vec3f(maximumLuminance)
  );
  return vec4f(mappedColor, color.a);
}
`;

const fs = /* glsl */ `\
layout(std140) uniform toneMappingUniforms {
  float exposure;
  float maximumLuminance;
} toneMapping;

vec4 toneMapping_filterColor_ext(vec4 color, vec2 texSize, vec2 texCoords) {
  vec3 exposedColor = max(color.rgb * toneMapping.exposure, vec3(0.0));
  vec3 numerator = exposedColor * (2.51 * exposedColor + vec3(0.03));
  vec3 denominator = exposedColor * (2.43 * exposedColor + vec3(0.59)) + vec3(0.14);
  float maximumLuminance = max(toneMapping.maximumLuminance, 1.0);
  float sceneLuminance = max(exposedColor.r, max(exposedColor.g, exposedColor.b));
  float highlightWeight = smoothstep(0.72, 1.7, sceneLuminance);
  float extendedScale = mix(1.0, maximumLuminance, highlightWeight);
  vec3 mappedColor = clamp(
    numerator / denominator * extendedScale,
    vec3(0.0),
    vec3(maximumLuminance)
  );
  return vec4(mappedColor, color.a);
}
`;

export type ToneMappingProps = {
  /** Linear exposure multiplier applied before the ACES filmic curve. */
  exposure?: number;
  /** Maximum output luminance; values above one preserve highlights on HDR displays. */
  maximumLuminance?: number;
};

export type ToneMappingUniforms = {
  exposure: number;
  maximumLuminance: number;
};

/** Maps high-dynamic-range scene colors into display range with an ACES filmic curve. */
export const toneMapping = {
  name: 'toneMapping',
  source,
  fs,

  props: {} as ToneMappingProps,
  uniforms: {} as ToneMappingUniforms,
  uniformTypes: {
    exposure: 'f32',
    maximumLuminance: 'f32'
  },
  defaultUniforms: {
    exposure: 1,
    maximumLuminance: 1
  },
  propTypes: {
    exposure: {format: 'f32', value: 1, min: 0, max: 10},
    maximumLuminance: {format: 'f32', value: 1, min: 1, max: 4}
  },

  passes: [{filter: true}]
} as const satisfies ShaderPass<ToneMappingProps, ToneMappingUniforms>;
