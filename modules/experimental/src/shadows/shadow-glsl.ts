// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** WebGL2 sampling uses raw depth arrays and explicit comparisons; cube arrays are face arrays. */
export const SHADOW_GLSL = /* glsl */ `
precision highp sampler2DArray;
struct DirectionalShadowLightUniform {
  vec3 direction;
  float strength;
  float normalBias;
  float sourceAngularRadius;
  float cascadeBlendFraction;
  float farFadeFraction;
  float shadowDistance;
};
struct SpotShadowLightUniform {
  vec3 position;
  float range;
  vec3 direction;
  float outerConeCos;
  float sourceRadius;
  float normalBias;
  float strength;
  float nearPlane;
};
struct PointShadowLightUniform {
  vec3 position;
  float range;
  float sourceRadius;
  float normalBias;
  float strength;
  float nearPlane;
};
layout(std140) uniform shadowUniforms {
  int directionalLightCount;
  int spotLightCount;
  int pointLightCount;
  int cascadeCount;
  int blockerSampleCount;
  int filterSampleCount;
  vec4 cascadeSplits;
  mat4 directionalViewProjectionMatrices[4];
  mat4 spotViewProjectionMatrices[4];
  mat4 pointViewProjectionMatrices[24];
  DirectionalShadowLightUniform directionalLights[1];
  SpotShadowLightUniform spotLights[4];
  PointShadowLightUniform pointLights[4];
} shadow;
uniform sampler2DArray directionalShadowTexture;
uniform sampler2DArray spotShadowTexture;
uniform sampler2DArray pointShadowTexture;
const float SHADOW_PI = 3.141592653589793;
float shadow_hash(vec3 position) {
  return fract(sin(dot(position, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
}
vec2 shadow_diskSample(int index, int count, float rotation) {
  float fraction = (float(index) + 0.5) / max(float(count), 1.0);
  float angle = float(index) * 2.39996323 + rotation;
  return sqrt(fraction) * vec2(cos(angle), sin(angle));
}
vec3 shadow_project(mat4 matrix, vec3 worldPosition) {
  vec4 clip = matrix * vec4(worldPosition, 1.0);
  vec3 projected = clip.xyz / max(abs(clip.w), 0.00001);
  // Shared matrices retain [0,1] depth; WebGL texture rows start at the bottom.
  return vec3(projected.xy * 0.5 + 0.5, projected.z);
}
bool shadow_validProjection(vec3 projected) {
  return all(greaterThanEqual(projected, vec3(0.0))) && all(lessThanEqual(projected, vec3(1.0)));
}
// Bilinear interpolation of four depth comparisons matches a hardware 2x2 PCF lookup.
float shadow_compare(sampler2DArray shadowMap, vec2 coordinate, int layer, float reference) {
  ivec2 dimensions = textureSize(shadowMap, 0).xy;
  vec2 position = coordinate * vec2(dimensions) - 0.5;
  ivec2 base = ivec2(floor(position));
  vec2 fraction = fract(position);
  ivec2 maximum = dimensions - 1;
  float lowerLeft = step(reference, texelFetch(shadowMap, ivec3(clamp(base, ivec2(0), maximum), layer), 0).r);
  float lowerRight = step(reference, texelFetch(shadowMap, ivec3(clamp(base + ivec2(1,0), ivec2(0), maximum), layer), 0).r);
  float upperLeft = step(reference, texelFetch(shadowMap, ivec3(clamp(base + ivec2(0,1), ivec2(0), maximum), layer), 0).r);
  float upperRight = step(reference, texelFetch(shadowMap, ivec3(clamp(base + ivec2(1,1), ivec2(0), maximum), layer), 0).r);
  return mix(mix(lowerLeft, lowerRight, fraction.x), mix(upperLeft, upperRight, fraction.x), fraction.y);
}
float shadow_arrayPCSS(sampler2DArray shadowMap, int layer, vec3 projected, float searchRadius, float rotation, float penumbraScale) {
  if (!shadow_validProjection(projected)) return 1.0;
  float texel = 1.0 / float(textureSize(shadowMap, 0).x);
  searchRadius = max(texel, searchRadius);
  float blockerDepth = 0.0;
  float blockerCount = 0.0;
  for (int index = 0; index < 24; index++) {
    if (index >= shadow.blockerSampleCount) break;
    vec2 coordinate = clamp(projected.xy + shadow_diskSample(index, shadow.blockerSampleCount, rotation) * searchRadius, vec2(0.0), vec2(1.0));
    float depth = textureLod(shadowMap, vec3(coordinate, float(layer)), 0.0).r;
    if (depth < projected.z) { blockerDepth += depth; blockerCount += 1.0; }
  }
  if (blockerCount == 0.0) return 1.0;
  float averageBlocker = blockerDepth / blockerCount;
  float penumbra = clamp((projected.z - averageBlocker) / max(abs(averageBlocker), 0.001), 0.0, 1.0);
  float radius = max(texel, searchRadius * (1.0 + penumbra * penumbraScale));
  float visibility = 0.0;
  for (int index = 0; index < 48; index++) {
    if (index >= shadow.filterSampleCount) break;
    vec2 coordinate = clamp(projected.xy + shadow_diskSample(index, shadow.filterSampleCount, rotation) * radius, vec2(0.0), vec2(1.0));
    visibility += shadow_compare(shadowMap, coordinate, layer, projected.z);
  }
  return visibility / max(float(shadow.filterSampleCount), 1.0);
}
int shadow_directionalCascadeIndex(float viewDepth) {
  int cascadeIndex = 0;
  for (int index = 0; index < 4; index++) {
    if (index >= shadow.cascadeCount) break;
    cascadeIndex = index;
    if (viewDepth <= shadow.cascadeSplits[index]) break;
  }
  return cascadeIndex;
}
int shadow_getDirectionalCascadeIndex(float viewDepth) {
  return shadow.directionalLightCount == 0 ? -1 : shadow_directionalCascadeIndex(viewDepth);
}
float shadow_directionalPCSS(int cascadeIndex, vec3 worldPosition, float viewDepth) {
  DirectionalShadowLightUniform light = shadow.directionalLights[0];
  return shadow_arrayPCSS(directionalShadowTexture, cascadeIndex,
    shadow_project(shadow.directionalViewProjectionMatrices[cascadeIndex], worldPosition),
    light.sourceAngularRadius * viewDepth / max(light.shadowDistance, 0.001),
    shadow_hash(worldPosition) * 2.0 * SHADOW_PI, 18.0);
}
float shadow_getDirectionalFactor(vec3 worldPosition, vec3 worldNormal, float viewDepth) {
  if (shadow.directionalLightCount == 0 || viewDepth <= 0.0) return 1.0;
  DirectionalShadowLightUniform light = shadow.directionalLights[0];
  if (viewDepth >= light.shadowDistance) return 1.0;
  vec3 position = worldPosition + normalize(worldNormal) * light.normalBias;
  int cascadeIndex = shadow_directionalCascadeIndex(viewDepth);
  float visibility = shadow_directionalPCSS(cascadeIndex, position, viewDepth);
  if (cascadeIndex + 1 < shadow.cascadeCount) {
    float cascadeStart = cascadeIndex > 0 ? shadow.cascadeSplits[cascadeIndex - 1] : 0.0;
    float cascadeEnd = shadow.cascadeSplits[cascadeIndex];
    float blendWidth = max((cascadeEnd - cascadeStart) * light.cascadeBlendFraction, 0.0001);
    float blend = smoothstep(cascadeEnd - blendWidth, cascadeEnd, viewDepth);
    if (blend > 0.0) visibility = mix(visibility, shadow_directionalPCSS(cascadeIndex + 1, position, viewDepth), blend);
  }
  float fadeWidth = max(light.shadowDistance * light.farFadeFraction, 0.0001);
  visibility = mix(visibility, 1.0, smoothstep(light.shadowDistance - fadeWidth, light.shadowDistance, viewDepth));
  return mix(1.0, visibility, light.strength);
}
float shadow_getSpotFactor(int lightIndex, vec3 worldPosition, vec3 worldNormal) {
  if (lightIndex < 0 || lightIndex >= shadow.spotLightCount) return 1.0;
  SpotShadowLightUniform light = shadow.spotLights[lightIndex];
  vec3 fromLight = worldPosition - light.position;
  float distanceToLight = length(fromLight);
  if (distanceToLight >= light.range || dot(normalize(fromLight), normalize(light.direction)) < light.outerConeCos) return 1.0;
  vec3 position = worldPosition + normalize(worldNormal) * light.normalBias;
  float visibility = shadow_arrayPCSS(spotShadowTexture, lightIndex,
    shadow_project(shadow.spotViewProjectionMatrices[lightIndex], position),
    light.sourceRadius / max(distanceToLight, 0.001) * 0.5,
    shadow_hash(worldPosition) * 2.0 * SHADOW_PI, 16.0);
  return mix(1.0, visibility, light.strength);
}
float shadow_pointReferenceDepth(float majorDistance, float nearPlane, float farPlane) {
  return farPlane / (farPlane - nearPlane) - (farPlane * nearPlane) / ((farPlane - nearPlane) * majorDistance);
}
vec3 shadow_pointCoordinate(int lightIndex, vec3 direction) {
  vec3 magnitude = abs(direction);
  int face = magnitude.x >= magnitude.y && magnitude.x >= magnitude.z ? (direction.x >= 0.0 ? 0 : 1)
    : magnitude.y >= magnitude.z ? (direction.y >= 0.0 ? 2 : 3) : (direction.z >= 0.0 ? 4 : 5);
  PointShadowLightUniform light = shadow.pointLights[lightIndex];
  vec3 projected = shadow_project(shadow.pointViewProjectionMatrices[lightIndex * 6 + face], light.position + direction * light.range * 0.5);
  return vec3(projected.xy, float(lightIndex * 6 + face));
}
float shadow_getPointFactor(int lightIndex, vec3 worldPosition, vec3 worldNormal) {
  if (lightIndex < 0 || lightIndex >= shadow.pointLightCount) return 1.0;
  PointShadowLightUniform light = shadow.pointLights[lightIndex];
  vec3 fromLight = worldPosition + normalize(worldNormal) * light.normalBias - light.position;
  float distanceToLight = length(fromLight);
  if (distanceToLight >= light.range || distanceToLight <= light.nearPlane) return 1.0;
  vec3 direction = normalize(fromLight);
  float referenceDepth = shadow_pointReferenceDepth(max(max(abs(fromLight.x), abs(fromLight.y)), abs(fromLight.z)), light.nearPlane, light.range);
  vec3 reference = abs(direction.y) > 0.99 ? vec3(0,0,1) : vec3(0,1,0);
  vec3 tangent = normalize(cross(direction, reference));
  vec3 bitangent = normalize(cross(direction, tangent));
  float searchRadius = light.sourceRadius / max(distanceToLight, 0.001);
  float rotation = shadow_hash(worldPosition) * 2.0 * SHADOW_PI;
  float blockerDepth = 0.0;
  float blockerCount = 0.0;
  for (int index = 0; index < 24; index++) {
    if (index >= shadow.blockerSampleCount) break;
    vec2 disk = shadow_diskSample(index, shadow.blockerSampleCount, rotation) * searchRadius;
    vec3 coordinate = shadow_pointCoordinate(lightIndex, normalize(direction + tangent * disk.x + bitangent * disk.y));
    float depth = textureLod(pointShadowTexture, coordinate, 0.0).r;
    if (depth < referenceDepth) { blockerDepth += depth; blockerCount += 1.0; }
  }
  if (blockerCount == 0.0) return 1.0;
  float averageBlocker = blockerDepth / blockerCount;
  float penumbra = clamp((referenceDepth - averageBlocker) / max(abs(averageBlocker), 0.001), 0.0, 1.0);
  float radius = searchRadius * (1.0 + penumbra * 12.0);
  float visibility = 0.0;
  for (int index = 0; index < 48; index++) {
    if (index >= shadow.filterSampleCount) break;
    vec2 disk = shadow_diskSample(index, shadow.filterSampleCount, rotation) * radius;
    vec3 coordinate = shadow_pointCoordinate(lightIndex, normalize(direction + tangent * disk.x + bitangent * disk.y));
    visibility += shadow_compare(pointShadowTexture, coordinate.xy, int(coordinate.z), referenceDepth);
  }
  return mix(1.0, visibility / max(float(shadow.filterSampleCount), 1.0), light.strength);
}
`;
