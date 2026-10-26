// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import {valueNoise} from '../../math/value-noise/value-noise';

export type CloudUniforms = {
  /** Fractional cloud cover, from clear (0) to overcast (1). */
  cover: number;
  /** Bottom and thickness of the cloud slab, in metres above the coordinate origin. */
  altitude: number;
  thickness: number;
  /** Horizontal size of cloud formations, in metres. */
  scale: number;
  /** Extinction coefficient, in inverse metres. */
  density: number;
  /** Elapsed seconds; callers own animation. */
  time: number;
  /** East/north drift velocity in metres per second. */
  velocity: [number, number];
  /** Direction toward the sun in east/north/up coordinates; nonzero. */
  sunDirection: [number, number, number];
  /** Linear sunlight tint. */
  sunColor: [number, number, number];
};
export type CloudProps = Partial<CloudUniforms>;

const DEFAULT_UNIFORMS: CloudUniforms = {
  cover: 0.45,
  altitude: 1000,
  thickness: 1200,
  scale: 1400,
  density: 0.005,
  time: 0,
  velocity: [14, 4],
  sunDirection: [0, 0.8, 0.6],
  sunColor: [1, 0.95, 0.85]
};

/** Sixty-four-sample cloud slab with approximate sunlight scattering. Returns premultiplied RGBA.
 * Positions/directions use a local east/north/up frame, with lengths in metres.
 * Receivers can sample clouds_getTransmittance to attenuate direct sunlight.
 */
export const clouds = {
  name: 'clouds',
  dependencies: [valueNoise],
  uniformTypes: {
    cover: 'f32',
    altitude: 'f32',
    thickness: 'f32',
    scale: 'f32',
    density: 'f32',
    time: 'f32',
    velocity: 'vec2<f32>',
    sunDirection: 'vec3<f32>',
    sunColor: 'vec3<f32>'
  },
  defaultUniforms: DEFAULT_UNIFORMS,
  getUniforms(props = {}, previousUniforms = DEFAULT_UNIFORMS) {
    return {...DEFAULT_UNIFORMS, ...previousUniforms, ...props};
  },
  fs: /* glsl */ `
layout(std140) uniform cloudsUniforms {
  float cover;
  float altitude;
  float thickness;
  float scale;
  float density;
  float time;
  vec2 velocity;
  vec3 sunDirection;
  vec3 sunColor;
} clouds;
// Shared normalized density field for planar slabs and spherical shells.
float clouds_getDensityAt(vec3 coordinate, float height) {
  float envelope = smoothstep(0.0, 0.2, height) * (1.0 - smoothstep(0.65, 1.0, height));
  coordinate += vec3(8.7, 3.2, clouds.time * 0.003);
  float broad = valueNoise_noise3(coordinate);
  float detail = valueNoise_noise3(coordinate * 2.07 + vec3(13.1, 7.3, 2.8));
  float fine = valueNoise_noise3(coordinate * 4.23 + vec3(5.4, 11.7, 8.1));
  float threshold = mix(0.78, 0.18, clamp(clouds.cover, 0.0, 1.0));
  return envelope * smoothstep(threshold, threshold + 0.16, broad * 0.72 + detail * 0.2 + fine * 0.08);
}

float clouds_getDensity(vec3 position) {
  float height = (position.z - clouds.altitude) / max(clouds.thickness, 1.0);
  return clouds_getDensityAt(vec3((position.xy - clouds.velocity * clouds.time) / max(clouds.scale, 1.0), height * 0.8), height);
}
vec3 clouds_getLighting(float density, float sunDensity, float daylight, float silver) {
  vec3 ambient = mix(vec3(0.035, 0.05, 0.085), vec3(0.28, 0.34, 0.42), daylight);
  float sunlight = exp(-(density + sunDensity) * 2.0);
  return ambient + clouds.sunColor * daylight * sunlight * (0.5 + silver * 0.3);
}

// Beer-Lambert extinction toward the sun through the same density used for sky rendering.
float clouds_getTransmittance(vec3 position) {
  if (clouds.cover <= 0.0 || clouds.density <= 0.0) return 1.0;
  vec3 direction = normalize(clouds.sunDirection);
  if (direction.z <= 0.02) return 1.0;
  float start = max((clouds.altitude - position.z) / direction.z, 0.0);
  float end = min((clouds.altitude + clouds.thickness - position.z) / direction.z, 40000.0);
  if (end <= start) return 1.0;
  float stepLength = (end - start) / 16.0;
  float opticalDepth = 0.0;
  for (int sampleIndex = 0; sampleIndex < 16; sampleIndex++) {
    opticalDepth += clouds_getDensity(position + direction * (start + (float(sampleIndex) + 0.5) * stepLength)) * stepLength;
  }
  return exp(-opticalDepth * max(clouds.density, 0.0));
}

vec4 clouds_getColor(vec3 camera, vec3 rayDirection) {
  if (clouds.cover <= 0.0 || clouds.density <= 0.0 || abs(rayDirection.z) < 0.0001) return vec4(0.0);
  float bottom = (clouds.altitude - camera.z) / rayDirection.z;
  float top = (clouds.altitude + max(clouds.thickness, 1.0) - camera.z) / rayDirection.z;
  float start = max(min(bottom, top), 0.0);
  float end = min(max(bottom, top), 20000.0);
  if (end <= start) return vec4(0.0);
  float jitter = valueNoise_hash(rayDirection.xy * 4096.0);
  float stepLength = (end - start) / 64.0;
  vec3 sunDirection = normalize(clouds.sunDirection);
  float daylight = smoothstep(-0.08, 0.18, sunDirection.z);
  float silver = pow(max(dot(rayDirection, sunDirection), 0.0), 12.0);
  vec3 radiance = vec3(0.0);
  float transmittance = 1.0;
  for (int sampleIndex = 0; sampleIndex < 64; sampleIndex++) {
    vec3 position = camera + rayDirection * (start + (float(sampleIndex) + jitter) * stepLength);
    float density = clouds_getDensity(position);
    float sunDensity = clouds_getDensity(position + sunDirection * clouds.thickness * 0.28);
    float alpha = 1.0 - exp(-density * max(clouds.density, 0.0) * stepLength);
    vec3 color = clouds_getLighting(density, sunDensity, daylight, silver);
    radiance += transmittance * alpha * color;
    transmittance *= 1.0 - alpha;
  }
  float distanceFade = 1.0 - smoothstep(10000.0, 20000.0, start);
  return vec4(radiance, 1.0 - transmittance) * distanceFade;
}
`,
  source: /* wgsl */ `
struct cloudsUniforms {
  cover: f32,
  altitude: f32,
  thickness: f32,
  scale: f32,
  density: f32,
  time: f32,
  velocity: vec2f,
  sunDirection: vec3f,
  sunColor: vec3f,
};
@group(3) @binding(auto) var<uniform> clouds: cloudsUniforms;
fn clouds_getDensityAt(inputCoordinate: vec3f, height: f32) -> f32 {
  let envelope = smoothstep(0.0, 0.2, height) * (1.0 - smoothstep(0.65, 1.0, height));
  var coordinate = inputCoordinate;
  coordinate += vec3f(8.7, 3.2, clouds.time * 0.003);
  let broad = valueNoise_noise3(coordinate);
  let detail = valueNoise_noise3(coordinate * 2.07 + vec3f(13.1, 7.3, 2.8));
  let fine = valueNoise_noise3(coordinate * 4.23 + vec3f(5.4, 11.7, 8.1));
  let threshold = mix(0.78, 0.18, clamp(clouds.cover, 0.0, 1.0));
  return envelope * smoothstep(threshold, threshold + 0.16, broad * 0.72 + detail * 0.2 + fine * 0.08);
}

fn clouds_getDensity(position: vec3f) -> f32 {
  let height = (position.z - clouds.altitude) / max(clouds.thickness, 1.0);
  return clouds_getDensityAt(vec3f((position.xy - clouds.velocity * clouds.time) / max(clouds.scale, 1.0), height * 0.8), height);
}
fn clouds_getLighting(density: f32, sunDensity: f32, daylight: f32, silver: f32) -> vec3f {
  let ambient = mix(vec3f(0.035, 0.05, 0.085), vec3f(0.28, 0.34, 0.42), daylight);
  let sunlight = exp(-(density + sunDensity) * 2.0);
  return ambient + clouds.sunColor * daylight * sunlight * (0.5 + silver * 0.3);
}

// Beer-Lambert extinction toward the sun through the same density used for sky rendering.
fn clouds_getTransmittance(position: vec3f) -> f32 {
  if (clouds.cover <= 0.0 || clouds.density <= 0.0) { return 1.0; }
  var direction: vec3f = normalize(clouds.sunDirection);
  if (direction.z <= 0.02) { return 1.0; }
  var start: f32 = max((clouds.altitude - position.z) / direction.z, 0.0);
  var end: f32 = min((clouds.altitude + clouds.thickness - position.z) / direction.z, 40000.0);
  if (end <= start) { return 1.0; }
  var stepLength: f32 = (end - start) / 16.0;
  var opticalDepth: f32 = 0.0;
  for (var sampleIndex: i32 = 0; sampleIndex < 16; sampleIndex++) {
    opticalDepth += clouds_getDensity(position + direction * (start + (f32(sampleIndex) + 0.5) * stepLength)) * stepLength;
  }
  return exp(-opticalDepth * max(clouds.density, 0.0));
}

fn clouds_getColor(camera: vec3f, rayDirection: vec3f) -> vec4f {
  if (clouds.cover <= 0.0 || clouds.density <= 0.0 || abs(rayDirection.z) < 0.0001) { return vec4f(0.0); }
  let bottom = (clouds.altitude - camera.z) / rayDirection.z;
  let top = (clouds.altitude + max(clouds.thickness, 1.0) - camera.z) / rayDirection.z;
  let start = max(min(bottom, top), 0.0);
  let end = min(max(bottom, top), 20000.0);
  if (end <= start) { return vec4f(0.0); }
  let jitter = valueNoise_hash(rayDirection.xy * 4096.0);
  let stepLength = (end - start) / 64.0;
  let sunDirection = normalize(clouds.sunDirection);
  let daylight = smoothstep(-0.08, 0.18, sunDirection.z);
  let silver = pow(max(dot(rayDirection, sunDirection), 0.0), 12.0);
  var radiance = vec3f(0.0);
  var transmittance = 1.0;
  for (var sampleIndex = 0; sampleIndex < 64; sampleIndex++) {
    let position = camera + rayDirection * (start + (f32(sampleIndex) + jitter) * stepLength);
    let density = clouds_getDensity(position);
    let sunDensity = clouds_getDensity(position + sunDirection * clouds.thickness * 0.28);
    let alpha = 1.0 - exp(-density * max(clouds.density, 0.0) * stepLength);
    let color = clouds_getLighting(density, sunDensity, daylight, silver);
    radiance += transmittance * alpha * color;
    transmittance *= 1.0 - alpha;
  }
  let distanceFade = 1.0 - smoothstep(10000.0, 20000.0, start);
  return vec4f(radiance, 1.0 - transmittance) * distanceFade;
}
`
} as const satisfies ShaderModule<CloudProps, CloudUniforms>;
