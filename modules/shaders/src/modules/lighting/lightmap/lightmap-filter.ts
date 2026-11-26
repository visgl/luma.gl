// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';

/** Internal accumulation/copy/dilation shader shared by the engine baker. */
export const lightmapFilter = {
  name: 'lightmapFilter',
  bindingLayout: [
    {name: 'lightmapFilter', group: 0},
    {name: 'currentTexture', group: 0},
    {name: 'previousTexture', group: 0},
    {name: 'chartTexture', group: 0}
  ],
  uniformTypes: {weight: 'f32', mode: 'i32'},
  defaultUniforms: {weight: 1, mode: 0},
  getUniforms: (props: {weight?: number; mode?: number}) => props,
  source: `
struct LightmapFilterUniforms {weight: f32, mode: i32};
@group(0) @binding(auto) var<uniform> lightmapFilter: LightmapFilterUniforms;
@group(0) @binding(auto) var currentTexture: texture_2d<f32>;
@group(0) @binding(auto) var previousTexture: texture_2d<f32>;
@group(0) @binding(auto) var chartTexture: texture_2d<f32>;
fn lightmapFilter_getColor(coordinates: vec2i) -> vec4f {
  let current = textureLoad(currentTexture, coordinates, 0);
  if (lightmapFilter.mode == 0) {
    let previous = textureLoad(previousTexture, coordinates, 0);
    return vec4f(mix(previous.rgb, current.rgb, lightmapFilter.weight), current.a);
  }
  if (lightmapFilter.mode == 2 || current.a > 0.0) {return current;}
  let chart = textureLoad(chartTexture, coordinates, 0).r;
  if (chart <= 0.0) {return current;}
  let size = vec2i(textureDimensions(currentTexture));
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let neighbor = coordinates + vec2i(x, y);
      if (all(neighbor >= vec2i(0)) && all(neighbor < size)) {
        let candidate = textureLoad(currentTexture, neighbor, 0);
        if (candidate.a == chart) {return candidate;}
      }
    }
  }
  return current;
}`,
  fs: `
layout(std140) uniform lightmapFilterUniforms {
 float weight;
 int mode;
} lightmapFilter;
uniform sampler2D currentTexture;
uniform sampler2D previousTexture;
uniform sampler2D chartTexture;
vec4 lightmapFilter_getColor(ivec2 coordinates) {
  vec4 current = texelFetch(currentTexture, coordinates, 0);
  if (lightmapFilter.mode == 0) {
    return vec4(mix(texelFetch(previousTexture, coordinates, 0).rgb, current.rgb, lightmapFilter.weight), current.a);
  }
  if (lightmapFilter.mode == 2 || current.a > 0.0) {return current;}
  float chart = texelFetch(chartTexture, coordinates, 0).r;
  ivec2 size = textureSize(currentTexture, 0);
  if (chart <= 0.0) return current;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      ivec2 neighbor = coordinates + ivec2(x,y);
      if (all(greaterThanEqual(neighbor, ivec2(0))) && all(lessThan(neighbor,size))) {
        vec4 candidate = texelFetch(currentTexture, neighbor, 0);
        if (candidate.a == chart) {return candidate;}
      }
    }
  }
  return current;
}`
} as const satisfies ShaderModule<{weight?: number; mode?: number}, {weight: number; mode: number}>;
