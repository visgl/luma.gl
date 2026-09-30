// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';

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
  float startHeight = (cameraPosition.z - heightFog.baseHeight) * max(heightFog.heightFalloff, 0.0);
  float endHeight = (position.z - heightFog.baseHeight) * max(heightFog.heightFalloff, 0.0);
  float lowerHeight = min(startHeight, endHeight);
  float upperHeight = max(startHeight, endHeight);
  float averageDensity = 1.0;
  if (upperHeight > 0.0) {
    float heightSpan = upperHeight - lowerHeight;
    if (heightSpan < 0.001) {
      averageDensity = exp(-max((startHeight + endHeight) * 0.5, 0.0));
    } else if (lowerHeight >= 0.0) {
      averageDensity = (exp(-lowerHeight) - exp(-upperHeight)) / heightSpan;
    } else {
      averageDensity = (-lowerHeight + 1.0 - exp(-upperHeight)) / heightSpan;
    }
  }
  return exp(-max(heightFog.density, 0.0) * distance(position, cameraPosition) * averageDensity);
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
  let startHeight = (cameraPosition.z - heightFog.baseHeight) * max(heightFog.heightFalloff, 0.0);
  let endHeight = (position.z - heightFog.baseHeight) * max(heightFog.heightFalloff, 0.0);
  let lowerHeight = min(startHeight, endHeight);
  let upperHeight = max(startHeight, endHeight);
  var averageDensity = 1.0;
  if (upperHeight > 0.0) {
    let heightSpan = upperHeight - lowerHeight;
    if (heightSpan < 0.001) {
      averageDensity = exp(-max((startHeight + endHeight) * 0.5, 0.0));
    } else if (lowerHeight >= 0.0) {
      averageDensity = (exp(-lowerHeight) - exp(-upperHeight)) / heightSpan;
    } else {
      averageDensity = (-lowerHeight + 1.0 - exp(-upperHeight)) / heightSpan;
    }
  }
  return exp(-max(heightFog.density, 0.0) * distance(position, cameraPosition) * averageDensity);
}
fn heightFog_getColor(color: vec4<f32>, position: vec3<f32>, cameraPosition: vec3<f32>) -> vec4<f32> {
  return vec4<f32>(mix(heightFog.color, color.rgb, heightFog_getTransmittance(position, cameraPosition)), color.a);
}
`
} as const satisfies ShaderModule<HeightFogProps, HeightFogUniforms>;
