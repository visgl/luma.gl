// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray9} from '@math.gl/core';
import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import {pbrMaterial} from '../pbr-material/pbr-material';

export type LightmapBakeUniforms = {
  uvSet: number;
  uvTransform: Readonly<NumberArray9>;
  chartId: number;
};

/** Texture-space rasterization controls. Chart IDs are positive integers exactly representable in the target format. */
export const lightmapBake = {
  name: 'lightmapBake',
  dependencies: [pbrMaterial],
  bindingLayout: [{name: 'lightmapBake', group: 0}],
  uniformTypes: {uvSet: 'i32', uvTransform: 'mat3x3<f32>', chartId: 'f32'},
  defaultUniforms: {uvSet: 1, uvTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1], chartId: 1},
  getUniforms: (props: Partial<LightmapBakeUniforms>) => props,
  source: `
struct LightmapBakeUniforms {uvSet: i32, uvTransform: mat3x3f, chartId: f32};
@group(0) @binding(auto) var<uniform> lightmapBake: LightmapBakeUniforms;

fn lightmap_getIrradiance(position: vec3f, normal: vec3f, directionalVisibility: f32, pointVisibility: vec4f, spotVisibility: vec4f) -> vec3f {
  if (lighting.enabled == 0) {return vec3f(0.0);}
  var irradiance = lighting.ambientColor;
  for (var index = 0; index < lighting.directionalLightCount; index++) {
    let light = lighting_getDirectionalLight(index);
    irradiance += light.color * max(dot(normal, -normalize(light.direction)), 0.0) * select(1.0, directionalVisibility, index == 0);
  }
  for (var index = 0; index < lighting.pointLightCount; index++) {
    let light = lighting_getPointLight(index);
    let offset = light.position - position;
    let visibility = select(1.0, pointVisibility[min(index, 3)], index < 4);
    irradiance += light.color * max(dot(normal, normalize(offset)), 0.0) * visibility / max(getPointLightAttenuation(light, length(offset)), 0.0001);
  }
  for (var index = 0; index < lighting.spotLightCount; index++) {
    let light = lighting_getSpotLight(index);
    irradiance += light.color * max(dot(normal, normalize(light.position - position)), 0.0) * select(1.0, spotVisibility[min(index, 3)], index < 4) / max(getSpotLightAttenuation(light, position), 0.0001);
  }
  return irradiance;
}
`,
  vs: `layout(std140) uniform lightmapBakeUniforms {
 int uvSet;
 mat3 uvTransform;
 float chartId;
} lightmapBake;`,
  fs: `layout(std140) uniform lightmapBakeUniforms {
 int uvSet;
 mat3 uvTransform;
 float chartId;
} lightmapBake;

vec3 lightmap_getIrradiance(vec3 position, vec3 normal, float directionalVisibility, vec4 pointVisibility, vec4 spotVisibility) {
  if (lighting.enabled == 0) {return vec3(0.0);}
  vec3 irradiance = lighting.ambientColor;
  for (int index = 0; index < lighting.directionalLightCount; index++) {
    DirectionalLight light = lighting_getDirectionalLight(index);
    irradiance += light.color * max(dot(normal, -normalize(light.direction)), 0.0) * (index == 0 ? directionalVisibility : 1.0);
  }
  for (int index = 0; index < lighting.pointLightCount; index++) {
    PointLight light = lighting_getPointLight(index);
    vec3 offset = light.position - position;
    irradiance += light.color * max(dot(normal, normalize(offset)), 0.0) * (index < 4 ? pointVisibility[index] : 1.0) / max(getPointLightAttenuation(light, length(offset)), 0.0001);
  }
  for (int index = 0; index < lighting.spotLightCount; index++) {
    SpotLight light = lighting_getSpotLight(index);
    irradiance += light.color * max(dot(normal, normalize(light.position - position)), 0.0) * (index < 4 ? spotVisibility[index] : 1.0) / max(getSpotLightAttenuation(light, position), 0.0001);
  }
  return irradiance;
}
`
} as const satisfies ShaderModule<Partial<LightmapBakeUniforms>, LightmapBakeUniforms>;
