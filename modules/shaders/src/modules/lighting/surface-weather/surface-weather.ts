// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import {valueNoise} from '../../math/value-noise/value-noise';

export type SurfaceWeatherState = {wetness: number; snow: number};
export type SurfaceWeatherUniforms = SurfaceWeatherState & {
  puddles: number;
  /** World-anchored patch size in metres. */
  scale: number;
  snowColor: [number, number, number];
  skyColor: [number, number, number];
};
export type SurfaceWeatherProps = Partial<SurfaceWeatherUniforms>;
export type SurfaceWeatherRates = {
  /** Per-second rates; precipitation fills the remaining capacity. */
  rainfall: number;
  snowfall: number;
  evaporation: number;
  snowmelt: number;
};

/** Exact integration of bounded accumulation/decay for a constant-rate interval.
 * Caller owns the state, clock, rates and any spatial exposure map. Pausing requires no GPU state.
 */
export function integrateSurfaceWeather(
  state: Readonly<SurfaceWeatherState>,
  rates: Readonly<SurfaceWeatherRates>,
  elapsedSeconds: number
): SurfaceWeatherState {
  function integrate(value: number, incoming: number, outgoing: number): number {
    const total = Math.max(incoming, 0) + Math.max(outgoing, 0);
    const bounded = Math.min(1, Math.max(0, value));
    if (total === 0 || elapsedSeconds <= 0) return bounded;
    const target = Math.max(incoming, 0) / total;
    return target + (bounded - target) * Math.exp(-total * Math.max(elapsedSeconds, 0));
  }
  return {
    wetness: integrate(state.wetness, rates.rainfall, rates.evaporation),
    snow: integrate(state.snow, rates.snowfall, rates.snowmelt)
  };
}
const DEFAULT_UNIFORMS: SurfaceWeatherUniforms = {
  wetness: 0,
  snow: 0,
  puddles: 0.8,
  scale: 20,
  snowColor: [0.9, 0.94, 0.98],
  skyColor: [0.48, 0.6, 0.72]
};

/** Material helpers for persistent wetness, puddles and upward-facing snow.
 * Every helper accepts a caller-provided exposure mask, so water and sheltered surfaces can opt out.
 */
export const surfaceWeather = {
  name: 'surfaceWeather',
  dependencies: [valueNoise],
  uniformTypes: {
    wetness: 'f32',
    snow: 'f32',
    puddles: 'f32',
    scale: 'f32',
    snowColor: 'vec3<f32>',
    skyColor: 'vec3<f32>'
  },
  defaultUniforms: DEFAULT_UNIFORMS,
  getUniforms(props = {}, previousUniforms = DEFAULT_UNIFORMS) {
    return {...DEFAULT_UNIFORMS, ...previousUniforms, ...props};
  },
  fs: /* glsl */ `
layout(std140) uniform surfaceWeatherUniforms {
  float wetness;
  float snow;
  float puddles;
  float scale;
  vec3 snowColor;
  vec3 skyColor;
} surfaceWeather;

float surfaceWeather_getSnow(vec3 position, vec3 normal, float exposure) {
  if (surfaceWeather.snow <= 0.0 || exposure <= 0.0) return 0.0;
  float slope = smoothstep(0.4, 0.85, normalize(normal).z);
  float variation = valueNoise_noise(position.xy / max(surfaceWeather.scale, 0.01));
  float coverage = smoothstep(variation * 0.65, variation * 0.65 + 0.35, surfaceWeather.snow);
  return coverage * slope * clamp(exposure, 0.0, 1.0);
}
float surfaceWeather_getWetness(vec3 position, vec3 normal, float exposure) {
  if (surfaceWeather.wetness <= 0.0 || exposure <= 0.0) return 0.0;
  return clamp(surfaceWeather.wetness, 0.0, 1.0) * clamp(exposure, 0.0, 1.0) * (1.0 - surfaceWeather_getSnow(position, normal, exposure));
}
float surfaceWeather_getPuddle(vec3 position, vec3 normal, float exposure) {
  if (surfaceWeather.wetness <= 0.0 || surfaceWeather.puddles <= 0.0 || exposure <= 0.0) return 0.0;
  float variation = valueNoise_noise(position.xy / max(surfaceWeather.scale, 0.01) + vec2(8.3, 2.7));
  return surfaceWeather_getWetness(position, normal, exposure) * clamp(surfaceWeather.puddles, 0.0, 1.0) *
    smoothstep(0.8, 0.98, normalize(normal).z) * smoothstep(0.38, 0.7, variation);
}
vec3 surfaceWeather_getAlbedo(vec3 albedo, vec3 position, vec3 normal, float exposure) {
  if ((surfaceWeather.wetness <= 0.0 && surfaceWeather.snow <= 0.0) || exposure <= 0.0) return albedo;
  float wetness = surfaceWeather_getWetness(position, normal, exposure);
  float snow = surfaceWeather_getSnow(position, normal, exposure);
  return mix(albedo * (1.0 - wetness * 0.38), surfaceWeather.snowColor, snow);
}
float surfaceWeather_getRoughness(float roughness, vec3 position, vec3 normal, float exposure) {
  if ((surfaceWeather.wetness <= 0.0 && surfaceWeather.snow <= 0.0) || exposure <= 0.0) return roughness;
  float wetness = surfaceWeather_getWetness(position, normal, exposure);
  float puddle = surfaceWeather_getPuddle(position, normal, exposure);
  float snow = surfaceWeather_getSnow(position, normal, exposure);
  return mix(mix(roughness, 0.16, max(puddle, wetness * 0.6)), 0.95, snow);
}
// Approximate dielectric highlights and sky tint; callers may use the albedo/roughness helpers with PBR instead.
vec3 surfaceWeather_getReflection(vec3 position, vec3 normal, vec3 camera, vec3 lightDirection, vec3 lightColor, float exposure) {
  if (surfaceWeather.wetness <= 0.0 || exposure <= 0.0) return vec3(0.0);
  vec3 surfaceNormal = normalize(normal);
  vec3 view = normalize(camera - position);
  vec3 halfway = normalize(view + normalize(lightDirection));
  float wetness = surfaceWeather_getWetness(position, normal, exposure);
  float puddle = surfaceWeather_getPuddle(position, normal, exposure);
  float facing = max(dot(surfaceNormal, view), 0.0);
  float fresnel = 0.02 + 0.98 * pow(1.0 - facing, 5.0);
  float highlight = pow(max(dot(surfaceNormal, halfway), 0.0), mix(36.0, 160.0, puddle)) * max(dot(surfaceNormal, normalize(lightDirection)), 0.0);
  return wetness * (surfaceWeather.skyColor * fresnel * (0.15 + puddle * 0.85) + lightColor * highlight * 0.6);
}
`,
  source: /* wgsl */ `
struct surfaceWeatherUniforms {
  wetness: f32,
  snow: f32,
  puddles: f32,
  scale: f32,
  snowColor: vec3f,
  skyColor: vec3f,
};
@group(3) @binding(auto) var<uniform> surfaceWeather: surfaceWeatherUniforms;

fn surfaceWeather_getSnow(position: vec3f,
  normal: vec3f,
  exposure: f32) -> f32 {
  if (surfaceWeather.snow <= 0.0 || exposure <= 0.0) { return 0.0; }
  var slope: f32 = smoothstep(0.4, 0.85, normalize(normal).z);
  var variation: f32 = valueNoise_noise(position.xy / max(surfaceWeather.scale, 0.01));
  var coverage: f32 = smoothstep(variation * 0.65, variation * 0.65 + 0.35, surfaceWeather.snow);
  return coverage * slope * clamp(exposure, 0.0, 1.0);
}
fn surfaceWeather_getWetness(position: vec3f,
  normal: vec3f,
  exposure: f32) -> f32 {
  if (surfaceWeather.wetness <= 0.0 || exposure <= 0.0) { return 0.0; }
  return clamp(surfaceWeather.wetness, 0.0, 1.0) * clamp(exposure, 0.0, 1.0) * (1.0 - surfaceWeather_getSnow(position, normal, exposure));
}
fn surfaceWeather_getPuddle(position: vec3f,
  normal: vec3f,
  exposure: f32) -> f32 {
  if (surfaceWeather.wetness <= 0.0 || surfaceWeather.puddles <= 0.0 || exposure <= 0.0) { return 0.0; }
  var variation: f32 = valueNoise_noise(position.xy / max(surfaceWeather.scale, 0.01) + vec2f(8.3, 2.7));
  return surfaceWeather_getWetness(position, normal, exposure) * clamp(surfaceWeather.puddles, 0.0, 1.0) *
    smoothstep(0.8, 0.98, normalize(normal).z) * smoothstep(0.38, 0.7, variation);
}
fn surfaceWeather_getAlbedo(albedo: vec3f,
  position: vec3f,
  normal: vec3f,
  exposure: f32) -> vec3f {
  if ((surfaceWeather.wetness <= 0.0 && surfaceWeather.snow <= 0.0) || exposure <= 0.0) { return albedo; }
  var wetness: f32 = surfaceWeather_getWetness(position, normal, exposure);
  var snow: f32 = surfaceWeather_getSnow(position, normal, exposure);
  return mix(albedo * (1.0 - wetness * 0.38), surfaceWeather.snowColor, snow);
}
fn surfaceWeather_getRoughness(roughness: f32,
  position: vec3f,
  normal: vec3f,
  exposure: f32) -> f32 {
  if ((surfaceWeather.wetness <= 0.0 && surfaceWeather.snow <= 0.0) || exposure <= 0.0) { return roughness; }
  var wetness: f32 = surfaceWeather_getWetness(position, normal, exposure);
  var puddle: f32 = surfaceWeather_getPuddle(position, normal, exposure);
  var snow: f32 = surfaceWeather_getSnow(position, normal, exposure);
  return mix(mix(roughness, 0.16, max(puddle, wetness * 0.6)), 0.95, snow);
}
// Approximate dielectric highlights and sky tint; callers may use the albedo/roughness helpers with PBR instead.
fn surfaceWeather_getReflection(position: vec3f,
  normal: vec3f,
  camera: vec3f,
  lightDirection: vec3f,
  lightColor: vec3f,
  exposure: f32) -> vec3f {
  if (surfaceWeather.wetness <= 0.0 || exposure <= 0.0) { return vec3f(0.0); }
  var surfaceNormal: vec3f = normalize(normal);
  var view: vec3f = normalize(camera - position);
  var halfway: vec3f = normalize(view + normalize(lightDirection));
  var wetness: f32 = surfaceWeather_getWetness(position, normal, exposure);
  var puddle: f32 = surfaceWeather_getPuddle(position, normal, exposure);
  var facing: f32 = max(dot(surfaceNormal, view), 0.0);
  var fresnel: f32 = 0.02 + 0.98 * pow(1.0 - facing, 5.0);
  var highlight: f32 = pow(max(dot(surfaceNormal, halfway), 0.0), mix(36.0, 160.0, puddle)) * max(dot(surfaceNormal, normalize(lightDirection)), 0.0);
  return wetness * (surfaceWeather.skyColor * fresnel * (0.15 + puddle * 0.85) + lightColor * highlight * 0.6);
}
`
} as const satisfies ShaderModule<SurfaceWeatherProps, SurfaceWeatherUniforms>;
