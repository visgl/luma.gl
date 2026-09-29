// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const RIVER_WATER_WGSL = /* wgsl */ `\
struct riverWaterMaterialUniforms {
  enabled: i32,
  flowDirection: vec2<f32>,
};

@group(3) @binding(auto) var<uniform> riverWaterMaterial : riverWaterMaterialUniforms;

fn riverWater_getFlowCoordinates(coordinates: vec2<f32>) -> vec2<f32> {
  let flowDirection = normalize(riverWaterMaterial.flowDirection);
  let crossDirection = vec2<f32>(-flowDirection.y, flowDirection.x);
  return vec2<f32>(dot(coordinates, crossDirection), dot(coordinates, flowDirection));
}

fn riverWater_waveGradient(
  coordinates: vec2<f32>,
  direction: vec2<f32>,
  frequency: f32,
  amplitude: f32,
  speed: f32,
  phaseOffset: f32
) -> vec2<f32> {
  let phase = dot(coordinates, direction) * frequency + waterMaterial.time * speed + phaseOffset;
  return direction * (cos(phase) * frequency * amplitude);
}

fn riverWater_getNormal(
  position_worldspace: vec3<f32>,
  position_objectspace: vec3<f32>,
  normal_worldspace: vec3<f32>,
  uv: vec2<f32>
) -> vec3<f32> {
  let coordinates = riverWater_getFlowCoordinates(
    water_getCoordinates(position_worldspace, position_objectspace, uv)
  );
  let warp = vec2<f32>(
    sin(coordinates.y * 0.31 + waterMaterial.time * 0.72),
    sin(coordinates.y * 0.27 + waterMaterial.time * 0.58)
  ) * 0.42;
  let p = coordinates + warp;
  let gradient =
    riverWater_waveGradient(p, normalize(vec2<f32>(0.08, 1.0)), 0.19, 0.42, 1.25, 0.0) +
    riverWater_waveGradient(p, normalize(vec2<f32>(-0.16, 1.0)), 0.37, 0.24, 0.95, 1.7) +
    riverWater_waveGradient(p, normalize(vec2<f32>(0.24, 1.0)), 0.78, 0.11, 1.7, 3.2) +
    riverWater_waveGradient(p, normalize(vec2<f32>(-0.33, 1.0)), 1.42, 0.045, 0.76, 0.8) +
    riverWater_waveGradient(p, normalize(vec2<f32>(0.42, 1.0)), 2.36, 0.019, 2.2, 2.1);
  let tangent = water_getTangent(normalize(normal_worldspace));
  let bitangent = normalize(cross(normalize(normal_worldspace), tangent));
  return normalize(normal_worldspace + waterMaterial.normalStrength * 3.2 *
    (gradient.x * tangent + gradient.y * bitangent));
}

fn riverWater_getColorMapped(
  cameraPosition: vec3<f32>,
  position_worldspace: vec3<f32>,
  position_objectspace: vec3<f32>,
  normal_worldspace: vec3<f32>,
  uv: vec2<f32>
) -> vec4<f32> {
  let waterNormal = riverWater_getNormal(
    position_worldspace, position_objectspace, normal_worldspace, uv
  );
  let viewDirection = normalize(cameraPosition - position_worldspace);
  let fresnel = pow(1.0 - max(dot(viewDirection, waterNormal), 0.0), 3.2);
  let coordinates = riverWater_getFlowCoordinates(
    water_getCoordinates(position_worldspace, position_objectspace, uv)
  );
  let flow = coordinates * 0.19 + vec2<f32>(0.0, waterMaterial.time * 1.35);
  let shimmerPattern = sin(flow.x * 2.1 + sin(flow.y * 0.73)) *
    sin(flow.y * 1.45 - flow.x * 0.38);
  let shimmer = smoothstep(0.61, 0.96, shimmerPattern) * (0.16 + 0.5 * fresnel);
  let deepColor = waterMaterial.baseColor * vec3<f32>(0.52, 0.74, 0.9);
  let reflectedColor = mix(waterMaterial.fresnelColor, vec3<f32>(0.22, 0.48, 0.57), 0.32);
  let surfaceColor = mix(deepColor, reflectedColor, clamp(fresnel * 0.78, 0.0, 0.78));
  var color = surfaceColor * (0.32 + 0.68 * lighting.ambientColor);

  for (var i: i32 = 0; i < lighting.directionalLightCount; i++) {
    let directionalLight = lighting_getDirectionalLight(i);
    let lightDirection = normalize(-directionalLight.direction);
    let halfwayDirection = normalize(lightDirection + viewDirection);
    let diffuse = max(dot(waterNormal, lightDirection), 0.0);
    let specular = pow(max(dot(waterNormal, halfwayDirection), 0.0), 64.0);
    let brokenSpecular = specular * (0.25 + 0.75 * fresnel);
    color += surfaceColor * directionalLight.color * diffuse * 0.38;
    color += vec3<f32>(0.72, 0.88, 0.94) * directionalLight.color * brokenSpecular * 2.1;
  }

  color += vec3<f32>(0.38, 0.68, 0.78) * shimmer;
  color = mix(color, reflectedColor, clamp(fresnel * 0.3, 0.0, 0.3));
  return vec4<f32>(color, waterMaterial.opacity);
}
`;

export const RIVER_WATER_GLSL = /* glsl */ `\
layout(std140) uniform riverWaterMaterialUniforms {
  uniform int enabled;
  uniform vec2 flowDirection;
} riverWaterMaterial;

vec2 riverWater_getFlowCoordinates(vec2 coordinates) {
  vec2 flowDirection = normalize(riverWaterMaterial.flowDirection);
  vec2 crossDirection = vec2(-flowDirection.y, flowDirection.x);
  return vec2(dot(coordinates, crossDirection), dot(coordinates, flowDirection));
}

vec2 riverWater_waveGradient(
  vec2 coordinates, vec2 direction, float frequency, float amplitude, float speed, float phaseOffset
) {
  float phase = dot(coordinates, direction) * frequency + waterMaterial.time * speed + phaseOffset;
  return direction * (cos(phase) * frequency * amplitude);
}

vec3 riverWater_getNormal(
  vec3 position_worldspace,
  vec3 position_objectspace,
  vec3 normal_worldspace,
  vec2 uv
) {
  vec2 coordinates = riverWater_getFlowCoordinates(
    water_getCoordinates(position_worldspace, position_objectspace, uv)
  );
  vec2 warp = vec2(
    sin(coordinates.y * 0.31 + waterMaterial.time * 0.72),
    sin(coordinates.y * 0.27 + waterMaterial.time * 0.58)
  ) * 0.42;
  vec2 p = coordinates + warp;
  vec2 gradient =
    riverWater_waveGradient(p, normalize(vec2(0.08, 1.0)), 0.19, 0.42, 1.25, 0.0) +
    riverWater_waveGradient(p, normalize(vec2(-0.16, 1.0)), 0.37, 0.24, 0.95, 1.7) +
    riverWater_waveGradient(p, normalize(vec2(0.24, 1.0)), 0.78, 0.11, 1.7, 3.2) +
    riverWater_waveGradient(p, normalize(vec2(-0.33, 1.0)), 1.42, 0.045, 0.76, 0.8) +
    riverWater_waveGradient(p, normalize(vec2(0.42, 1.0)), 2.36, 0.019, 2.2, 2.1);
  vec3 tangent = water_getTangent(normalize(normal_worldspace));
  vec3 bitangent = normalize(cross(normalize(normal_worldspace), tangent));
  return normalize(normal_worldspace + waterMaterial.normalStrength * 3.2 *
    (gradient.x * tangent + gradient.y * bitangent));
}

vec4 riverWater_getColorMapped(
  vec3 cameraPosition,
  vec3 position_worldspace,
  vec3 position_objectspace,
  vec3 normal_worldspace,
  vec2 uv
) {
  vec3 waterNormal = riverWater_getNormal(
    position_worldspace, position_objectspace, normal_worldspace, uv
  );
  vec3 viewDirection = normalize(cameraPosition - position_worldspace);
  float fresnel = pow(1.0 - max(dot(viewDirection, waterNormal), 0.0), 3.2);
  vec2 coordinates = riverWater_getFlowCoordinates(
    water_getCoordinates(position_worldspace, position_objectspace, uv)
  );
  vec2 flow = coordinates * 0.19 + vec2(0.0, waterMaterial.time * 1.35);
  float shimmerPattern = sin(flow.x * 2.1 + sin(flow.y * 0.73)) *
    sin(flow.y * 1.45 - flow.x * 0.38);
  float shimmer = smoothstep(0.61, 0.96, shimmerPattern) * (0.16 + 0.5 * fresnel);
  vec3 deepColor = waterMaterial.baseColor * vec3(0.52, 0.74, 0.9);
  vec3 reflectedColor = mix(waterMaterial.fresnelColor, vec3(0.22, 0.48, 0.57), 0.32);
  vec3 surfaceColor = mix(deepColor, reflectedColor, clamp(fresnel * 0.78, 0.0, 0.78));
  vec3 color = surfaceColor * (0.32 + 0.68 * lighting.ambientColor);

  for (int i = 0; i < lighting.directionalLightCount; i++) {
    DirectionalLight directionalLight = lighting_getDirectionalLight(i);
    vec3 lightDirection = normalize(-directionalLight.direction);
    vec3 halfwayDirection = normalize(lightDirection + viewDirection);
    float diffuse = max(dot(waterNormal, lightDirection), 0.0);
    float specular = pow(max(dot(waterNormal, halfwayDirection), 0.0), 64.0);
    float brokenSpecular = specular * (0.25 + 0.75 * fresnel);
    color += surfaceColor * directionalLight.color * diffuse * 0.38;
    color += vec3(0.72, 0.88, 0.94) * directionalLight.color * brokenSpecular * 2.1;
  }

  color += vec3(0.38, 0.68, 0.78) * shimmer;
  color = mix(color, reflectedColor, clamp(fresnel * 0.3, 0.0, 0.3));
  return vec4(color, waterMaterial.opacity);
}
`;
