// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';

export type PointGlowUniforms = {
  coreRadius: number;
  coreIntensity: number;
  haloIntensity: number;
  falloff: number;
};
export type PointGlowProps = Partial<PointGlowUniforms>;

const DEFAULT_UNIFORMS: PointGlowUniforms = {
  coreRadius: 0.12,
  coreIntensity: 1,
  haloIntensity: 0.6,
  falloff: 5
};

/** Linear radiance for a bounded point sprite. Blend additively or composite into an HDR target. */
export const pointGlow: ShaderModule<PointGlowProps, PointGlowUniforms> = {
  name: 'pointGlow',
  firstBindingSlot: 0,
  bindingLayout: [{name: 'pointGlow', group: 3}],
  uniformTypes: {
    coreRadius: 'f32',
    coreIntensity: 'f32',
    haloIntensity: 'f32',
    falloff: 'f32'
  },
  defaultUniforms: DEFAULT_UNIFORMS,
  getUniforms(props = {}, previousUniforms = DEFAULT_UNIFORMS) {
    const uniforms = {...DEFAULT_UNIFORMS, ...previousUniforms};
    if (props.coreRadius !== undefined)
      uniforms.coreRadius = Math.min(1, Math.max(0, props.coreRadius));
    if (props.coreIntensity !== undefined)
      uniforms.coreIntensity = Math.max(0, props.coreIntensity);
    if (props.haloIntensity !== undefined)
      uniforms.haloIntensity = Math.max(0, props.haloIntensity);
    if (props.falloff !== undefined) uniforms.falloff = Math.max(0.01, props.falloff);
    return uniforms;
  },
  fs: /* glsl */ `
layout(std140) uniform pointGlowUniforms {
  float coreRadius;
  float coreIntensity;
  float haloIntensity;
  float falloff;
} pointGlow;

// Coordinates span [-1, 1] across the sprite; tint is linear RGB.
vec3 pointGlow_getColor(vec2 coordinates, vec3 tint) {
  float radius = length(coordinates);
  float edgeWidth = max(fwidth(radius), 0.0001);
  float envelope = 1.0 - smoothstep(1.0 - edgeWidth, 1.0, radius);
  float core = 1.0 - smoothstep(pointGlow.coreRadius - edgeWidth * 0.5,
    pointGlow.coreRadius + edgeWidth * 0.5, radius);
  if (pointGlow.coreRadius <= 0.0) core = 0.0;
  float outer = exp(-pointGlow.falloff);
  float halo = max(0.0, (exp(-pointGlow.falloff * radius * radius) - outer) / (1.0 - outer));
  return (vec3(core * pointGlow.coreIntensity) + tint * halo * pointGlow.haloIntensity) * envelope;
}
`,
  source: /* wgsl */ `
struct pointGlowUniforms {
  coreRadius: f32,
  coreIntensity: f32,
  haloIntensity: f32,
  falloff: f32,
};
@group(3) @binding(auto) var<uniform> pointGlow: pointGlowUniforms;

fn pointGlow_getColor(coordinates: vec2<f32>, tint: vec3<f32>) -> vec3<f32> {
  let radius = length(coordinates);
  let edgeWidth = max(fwidth(radius), 0.0001);
  let envelope = 1.0 - smoothstep(1.0 - edgeWidth, 1.0, radius);
  var core = 1.0 - smoothstep(pointGlow.coreRadius - edgeWidth * 0.5,
    pointGlow.coreRadius + edgeWidth * 0.5, radius);
  if (pointGlow.coreRadius <= 0.0) { core = 0.0; }
  let outer = exp(-pointGlow.falloff);
  let halo = max(0.0, (exp(-pointGlow.falloff * radius * radius) - outer) / (1.0 - outer));
  return (vec3<f32>(core * pointGlow.coreIntensity) + tint * halo * pointGlow.haloIntensity) * envelope;
}
`
};
