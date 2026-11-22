// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import {clouds} from '../clouds/clouds';

export type GlobeCloudUniforms = {planetRadius: number};
export type GlobeCloudProps = Partial<GlobeCloudUniforms>;

/** Spherical cloud shell using the existing cloud density, noise and sunlight model.
 * Camera and rays are globe-centered, with the planet's surface at unit radius.
 * The shared clouds uniforms retain metre/second units; sunDirection is globe-centered XYZ.
 */
export const globeClouds = {
  name: 'globeClouds',
  dependencies: [clouds],
  uniformTypes: {planetRadius: 'f32'},
  defaultUniforms: {planetRadius: 6370972},
  fs: /* glsl */ `
layout(std140) uniform globeCloudsUniforms { float planetRadius; } globeClouds;
vec2 globeClouds_intersectSphere(vec3 camera, vec3 direction, float radius) {
  float projected = dot(camera, direction);
  float discriminant = projected * projected - dot(camera, camera) + radius * radius;
  if (discriminant < 0.0) return vec2(-1.0);
  float root = sqrt(discriminant);
  return vec2(-projected - root, -projected + root);
}
float globeClouds_getDensity(vec3 position) {
  float height = ((length(position) - 1.0) * globeClouds.planetRadius - clouds.altitude) / max(clouds.thickness, 1.0);
  // Rotate a 3D field rather than wrapping longitude UVs: no seams or pinched poles.
  vec2 angle = clouds.velocity * clouds.time / globeClouds.planetRadius;
  vec3 rotated = vec3(cos(angle.x) * position.x + sin(angle.x) * position.y,
    -sin(angle.x) * position.x + cos(angle.x) * position.y, position.z);
  rotated = vec3(rotated.x, cos(angle.y) * rotated.y + sin(angle.y) * rotated.z,
    -sin(angle.y) * rotated.y + cos(angle.y) * rotated.z);
  return clouds_getDensityAt(rotated * globeClouds.planetRadius / max(clouds.scale, 1.0), height);
}
vec4 globeClouds_getColor(vec3 camera, vec3 direction) {
  if (clouds.cover <= 0.0 || clouds.density <= 0.0) return vec4(0.0);
  float bottom = 1.0 + clouds.altitude / globeClouds.planetRadius;
  float top = bottom + max(clouds.thickness, 1.0) / globeClouds.planetRadius;
  vec2 outer = globeClouds_intersectSphere(camera, direction, top);
  if (outer.y <= 0.0) return vec4(0.0);
  float start = max(outer.x, 0.0);
  float end = outer.y;
  vec2 inner = globeClouds_intersectSphere(camera, direction, bottom);
  if (length(camera) < bottom) start = max(start, inner.y);
  else if (inner.x >= start) end = min(end, inner.x);
  vec2 ground = globeClouds_intersectSphere(camera, direction, 1.0);
  if (ground.x >= 0.0) end = min(end, ground.x);
  if (end <= start) return vec4(0.0);
  float stepLength = (end - start) / 32.0;
  float jitter = valueNoise_hash(direction.xy * 4096.0);
  vec3 sunlightDirection = normalize(clouds.sunDirection);
  float silver = pow(max(dot(direction, sunlightDirection), 0.0), 12.0);
  vec3 radiance = vec3(0.0);
  float transmittance = 1.0;
  for (int sampleIndex = 0; sampleIndex < 32; sampleIndex++) {
    vec3 position = camera + direction * (start + (float(sampleIndex) + jitter) * stepLength);
    float density = globeClouds_getDensity(position);
    float sunDensity = globeClouds_getDensity(position + sunlightDirection * clouds.thickness * 0.28 / globeClouds.planetRadius);
    float daylight = smoothstep(-0.08, 0.18, dot(normalize(position), sunlightDirection));
    float alpha = 1.0 - exp(-density * clouds.density * stepLength * globeClouds.planetRadius);
    radiance += transmittance * alpha * clouds_getLighting(density * 0.25, sunDensity * 0.25, daylight, silver);
    transmittance *= 1.0 - alpha;
    if (transmittance < 0.01) break;
  }
  return vec4(radiance, 1.0 - transmittance);
}
`,
  source: /* wgsl */ `
struct globeCloudsUniforms { planetRadius: f32 };
@group(3) @binding(auto) var<uniform> globeClouds: globeCloudsUniforms;
fn globeClouds_intersectSphere(camera: vec3f, direction: vec3f, radius: f32) -> vec2f {
  let projected = dot(camera, direction);
  let discriminant = projected * projected - dot(camera, camera) + radius * radius;
  if (discriminant < 0.0) { return vec2f(-1.0); }
  let root = sqrt(discriminant);
  return vec2f(-projected - root, -projected + root);
}
fn globeClouds_getDensity(position: vec3f) -> f32 {
  let height = ((length(position) - 1.0) * globeClouds.planetRadius - clouds.altitude) / max(clouds.thickness, 1.0);
  let angle = clouds.velocity * clouds.time / globeClouds.planetRadius;
  var rotated = vec3f(cos(angle.x) * position.x + sin(angle.x) * position.y,
    -sin(angle.x) * position.x + cos(angle.x) * position.y, position.z);
  rotated = vec3f(rotated.x, cos(angle.y) * rotated.y + sin(angle.y) * rotated.z,
    -sin(angle.y) * rotated.y + cos(angle.y) * rotated.z);
  return clouds_getDensityAt(rotated * globeClouds.planetRadius / max(clouds.scale, 1.0), height);
}
fn globeClouds_getColor(camera: vec3f, direction: vec3f) -> vec4f {
  if (clouds.cover <= 0.0 || clouds.density <= 0.0) { return vec4f(0.0); }
  let bottom = 1.0 + clouds.altitude / globeClouds.planetRadius;
  let top = bottom + max(clouds.thickness, 1.0) / globeClouds.planetRadius;
  let outer = globeClouds_intersectSphere(camera, direction, top);
  if (outer.y <= 0.0) { return vec4f(0.0); }
  var start = max(outer.x, 0.0);
  var end = outer.y;
  let inner = globeClouds_intersectSphere(camera, direction, bottom);
  if (length(camera) < bottom) { start = max(start, inner.y); }
  else if (inner.x >= start) { end = min(end, inner.x); }
  let ground = globeClouds_intersectSphere(camera, direction, 1.0);
  if (ground.x >= 0.0) { end = min(end, ground.x); }
  if (end <= start) { return vec4f(0.0); }
  let stepLength = (end - start) / 32.0;
  let jitter = valueNoise_hash(direction.xy * 4096.0);
  let sunlightDirection = normalize(clouds.sunDirection);
  let silver = pow(max(dot(direction, sunlightDirection), 0.0), 12.0);
  var radiance = vec3f(0.0);
  var transmittance = 1.0;
  for (var sampleIndex = 0; sampleIndex < 32; sampleIndex++) {
    let position = camera + direction * (start + (f32(sampleIndex) + jitter) * stepLength);
    let density = globeClouds_getDensity(position);
    let sunDensity = globeClouds_getDensity(position + sunlightDirection * clouds.thickness * 0.28 / globeClouds.planetRadius);
    let daylight = smoothstep(-0.08, 0.18, dot(normalize(position), sunlightDirection));
    let alpha = 1.0 - exp(-density * clouds.density * stepLength * globeClouds.planetRadius);
    radiance += transmittance * alpha * clouds_getLighting(density * 0.25, sunDensity * 0.25, daylight, silver);
    transmittance *= 1.0 - alpha;
    if (transmittance < 0.01) { break; }
  }
  return vec4f(radiance, 1.0 - transmittance);
}
`
} as const satisfies ShaderModule<GlobeCloudProps, GlobeCloudUniforms>;
