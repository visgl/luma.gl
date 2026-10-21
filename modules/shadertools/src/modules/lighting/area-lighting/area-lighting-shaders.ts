// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const areaLightingGLSL = /* glsl */ `
struct AreaLightUniform {
  vec3 color;
  vec3 position;
  vec3 halfAxisX;
  vec3 halfAxisY;
  vec3 normal;
  int disk;
};
layout(std140) uniform areaLightingUniforms {
  int lightCount;
  AreaLightUniform lights[4];
} areaLighting;

PointLight areaLighting_getSample(int lightIndex, int sampleIndex, vec3 receiver) {
  AreaLightUniform light = areaLighting.lights[lightIndex];
  vec2 coordinate = (vec2(float(sampleIndex % 4), float(sampleIndex / 4)) + 0.5) / 4.0;
  float area = 4.0 * length(light.halfAxisX) * length(light.halfAxisY);
  if (light.disk != 0) {
    float radius = sqrt(coordinate.y);
    float angle = coordinate.x * 6.28318530718;
    coordinate = radius * vec2(cos(angle), sin(angle));
    area *= 0.785398163397;
  } else {
    coordinate = coordinate * 2.0 - 1.0;
  }
  vec3 position = light.position + coordinate.x * light.halfAxisX + coordinate.y * light.halfAxisY;
  vec3 displacement = receiver - position;
  float distanceSquared = max(dot(displacement, displacement), 0.000001);
  float emissionCosine = max(dot(light.normal, displacement * inversesqrt(distanceSquared)), 0.0);
  return PointLight(light.color * (area * emissionCosine / (16.0 * distanceSquared)), position, vec3(1.0, 0.0, 0.0));
}
`;

export const areaLightingWGSL = /* wgsl */ `
struct AreaLightUniform {
  color: vec3f,
  position: vec3f,
  halfAxisX: vec3f,
  halfAxisY: vec3f,
  normal: vec3f,
  disk: i32,
};
struct AreaLightingUniforms {
  lightCount: i32,
  lights: array<AreaLightUniform, 4>,
};
@group(2) @binding(auto) var<uniform> areaLighting: AreaLightingUniforms;

fn areaLighting_getSample(lightIndex: i32, sampleIndex: i32, receiver: vec3f) -> PointLight {
  let light = areaLighting.lights[lightIndex];
  var coordinate = (vec2f(f32(sampleIndex % 4), f32(sampleIndex / 4)) + 0.5) / 4.0;
  var area = 4.0 * length(light.halfAxisX) * length(light.halfAxisY);
  if (light.disk != 0) {
    let radius = sqrt(coordinate.y);
    let angle = coordinate.x * 6.28318530718;
    coordinate = radius * vec2f(cos(angle), sin(angle));
    area *= 0.785398163397;
  } else {
    coordinate = coordinate * 2.0 - 1.0;
  }
  let position = light.position + coordinate.x * light.halfAxisX + coordinate.y * light.halfAxisY;
  let displacement = receiver - position;
  let distanceSquared = max(dot(displacement, displacement), 0.000001);
  let emissionCosine = max(dot(light.normal, displacement * inverseSqrt(distanceSquared)), 0.0);
  return PointLight(light.color * (area * emissionCosine / (16.0 * distanceSquared)), position, vec3f(1.0, 0.0, 0.0));
}
`;
