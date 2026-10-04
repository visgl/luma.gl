// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';

export type AtmosphereUniforms = {
  enabled: number;
  /** Direction toward the sun in a local east/north/up frame; must be nonzero. */
  sunDirection: [number, number, number];
  sunIntensity: number;
  /** Aerosol and molecular scattering multipliers. */
  haze: number;
  rayleigh: number;
  /** Planet radius in metres. Positions use a local tangent frame, with z = altitude. */
  planetRadius: number;
  exposure: number;
  /** Diffuse ground boundary beneath the horizon, in linear RGB. */
  groundColor: [number, number, number];
};
export type AtmosphereProps = Partial<AtmosphereUniforms>;
const DEFAULT_UNIFORMS: AtmosphereUniforms = {
  enabled: 1,
  sunDirection: [0, 0.8, 0.6],
  sunIntensity: 20,
  haze: 1,
  rayleigh: 1,
  planetRadius: 6371000,
  exposure: 1,
  groundColor: [0.18, 0.17, 0.14]
};

/** Single-scattering Rayleigh/Mie sky and aerial perspective. Distances are metres.
 * Includes a spherical planet's solar occlusion, without multiple scattering or ozone.
 */
export const atmosphere = {
  name: 'atmosphere',
  uniformTypes: {
    enabled: 'f32',
    sunDirection: 'vec3<f32>',
    sunIntensity: 'f32',
    haze: 'f32',
    rayleigh: 'f32',
    planetRadius: 'f32',
    exposure: 'f32',
    groundColor: 'vec3<f32>'
  },
  defaultUniforms: DEFAULT_UNIFORMS,
  getUniforms(props = {}, previousUniforms = DEFAULT_UNIFORMS) {
    return {...DEFAULT_UNIFORMS, ...previousUniforms, ...props};
  },
  fs: /* glsl */ `
layout(std140) uniform atmosphereUniforms {
  float enabled;
  vec3 sunDirection;
  float sunIntensity;
  float haze;
  float rayleigh;
  float planetRadius;
  float exposure;
  vec3 groundColor;
} atmosphere;
struct AtmosphereSample {
  vec3 radiance;
  vec3 transmittance;
};

vec2 atmosphere_intersectSphere(vec3 origin, vec3 direction, float radius) {
  float projected = dot(origin, direction);
  float discriminant = projected * projected - (dot(origin.xy, origin.xy) + (origin.z - radius) * (origin.z + radius));
  if (discriminant < 0.0) return vec2(-1.0);
  float root = sqrt(discriminant);
  return vec2(-projected - root, -projected + root);
}
vec2 atmosphere_getDensity(vec3 position) {
  float height = max(length(position) - atmosphere.planetRadius, 0.0);
  return exp(-vec2(height / 8000.0, height / 1200.0));
}
AtmosphereSample atmosphere_getScattering(vec3 camera, vec3 direction, float distanceLimit) {
  AtmosphereSample result;
  result.radiance = vec3(0.0);
  result.transmittance = vec3(1.0);
  if (atmosphere.enabled < 0.5 || distanceLimit <= 0.0) return result;
  vec3 origin = vec3(camera.xy, atmosphere.planetRadius + max(camera.z, 1.0));
  vec2 shell = atmosphere_intersectSphere(origin, direction, atmosphere.planetRadius + 100000.0);
  float start = max(shell.x, 0.0);
  float end = min(shell.y, distanceLimit);
  vec2 ground = atmosphere_intersectSphere(origin, direction, atmosphere.planetRadius);
  if (ground.x > 0.0) end = min(end, ground.x);
  if (end <= start) return result;
  vec3 sunlight = normalize(atmosphere.sunDirection);
  vec3 rayleigh = vec3(0.0000058, 0.0000135, 0.0000331) * max(atmosphere.rayleigh, 0.0);
  vec3 mie = vec3(0.000021) * max(atmosphere.haze, 0.0);
  float cosine = dot(direction, sunlight);
  float rayleighPhase = 0.0596831 * (1.0 + cosine * cosine);
  float asymmetry = 0.76;
  float miePhase = (1.0 - asymmetry * asymmetry) / (12.566371 * pow(max(1.0 + asymmetry * asymmetry - 2.0 * asymmetry * cosine, 0.001), 1.5));
  float stepLength = (end - start) / 12.0;
  vec2 opticalDepth = vec2(0.0);
  vec3 radiance = vec3(0.0);
  for (int sampleIndex = 0; sampleIndex < 12; sampleIndex++) {
    vec3 position = origin + direction * (start + (float(sampleIndex) + 0.5) * stepLength);
    vec2 density = atmosphere_getDensity(position);
    vec2 centerDepth = opticalDepth + density * stepLength * 0.5;
    opticalDepth += density * stepLength;
    vec2 solarGround = atmosphere_intersectSphere(position, sunlight, atmosphere.planetRadius);
    if (solarGround.x > 0.0) continue;
    float solarDistance = max(atmosphere_intersectSphere(position, sunlight, atmosphere.planetRadius + 100000.0).y, 0.0);
    float solarStep = solarDistance / 4.0;
    vec2 solarDepth = vec2(0.0);
    for (int solarIndex = 0; solarIndex < 4; solarIndex++) {
      solarDepth += atmosphere_getDensity(position + sunlight * ((float(solarIndex) + 0.5) * solarStep)) * solarStep;
    }
    vec3 attenuation = exp(-rayleigh * (centerDepth.x + solarDepth.x) - mie * (centerDepth.y + solarDepth.y));
    radiance += attenuation * (rayleigh * density.x * rayleighPhase + mie * density.y * miePhase) * stepLength;
  }
  result.radiance = radiance * max(atmosphere.sunIntensity, 0.0);
  result.transmittance = exp(-rayleigh * opticalDepth.x - mie * opticalDepth.y);
  return result;
}
vec3 atmosphere_getSkyColor(vec3 camera, vec3 direction) {
  if (atmosphere.enabled < 0.5) return vec3(0.0);
  AtmosphereSample scatteringSample = atmosphere_getScattering(camera, normalize(direction), 1000000.0);
  vec3 origin = vec3(camera.xy, atmosphere.planetRadius + max(camera.z, 1.0));
  vec3 sunlight = normalize(atmosphere.sunDirection);
  float groundDistance = atmosphere_intersectSphere(origin, normalize(direction), atmosphere.planetRadius).x;
  if (groundDistance > 0.0 && sunlight.z > 0.0) {
    // Approximate direct irradiance at the ground boundary, attenuated on its way to the eye.
    float elevation = max(sunlight.z, 0.02);
    vec3 extinction = vec3(0.0000058, 0.0000135, 0.0000331) * max(atmosphere.rayleigh, 0.0) * 8000.0
      + vec3(0.000021) * max(atmosphere.haze, 0.0) * 1200.0;
    scatteringSample.radiance += atmosphere.groundColor * atmosphere.sunIntensity * sunlight.z / 3.141593
      * exp(-extinction / elevation) * scatteringSample.transmittance;
  }
  return vec3(1.0) - exp(-scatteringSample.radiance * atmosphere.exposure);
}
vec4 atmosphere_getColor(vec4 color, vec3 position, vec3 camera) {
  vec3 difference = position - camera;
  float distance = length(difference);
  if (distance < 0.001 || atmosphere.enabled < 0.5) return color;
  AtmosphereSample scatteringSample = atmosphere_getScattering(camera, difference / distance, distance);
  vec3 scattering = vec3(1.0) - exp(-scatteringSample.radiance * atmosphere.exposure);
  return vec4(color.rgb * scatteringSample.transmittance + scattering, color.a);
}
`,
  source: /* wgsl */ `
struct atmosphereUniforms {
  enabled: f32,
  sunDirection: vec3f,
  sunIntensity: f32,
  haze: f32,
  rayleigh: f32,
  planetRadius: f32,
  exposure: f32,
  groundColor: vec3f,
};
@group(3) @binding(auto) var<uniform> atmosphere: atmosphereUniforms;
struct AtmosphereSample { radiance: vec3f,
  transmittance: vec3f };

fn atmosphere_intersectSphere(origin: vec3f,
  direction: vec3f,
  radius: f32) -> vec2f {
  var projected: f32 = dot(origin, direction);
  var discriminant: f32 = projected * projected - (dot(origin.xy, origin.xy) + (origin.z - radius) * (origin.z + radius));
  if (discriminant < 0.0) { return vec2f(-1.0); }
  var root: f32 = sqrt(discriminant);
  return vec2f(-projected - root, -projected + root);
}
fn atmosphere_getDensity(position: vec3f) -> vec2f {
  var height: f32 = max(length(position) - atmosphere.planetRadius, 0.0);
  return exp(-vec2f(height / 8000.0, height / 1200.0));
}
fn atmosphere_getScattering(camera: vec3f,
  direction: vec3f,
  distanceLimit: f32) -> AtmosphereSample {
  var result: AtmosphereSample;
  result.radiance = vec3f(0.0);
  result.transmittance = vec3f(1.0);
  if (atmosphere.enabled < 0.5 || distanceLimit <= 0.0) { return result; }
  var origin: vec3f = vec3f(camera.xy, atmosphere.planetRadius + max(camera.z, 1.0));
  var shell: vec2f = atmosphere_intersectSphere(origin, direction, atmosphere.planetRadius + 100000.0);
  var start: f32 = max(shell.x, 0.0);
  var end: f32 = min(shell.y, distanceLimit);
  var ground: vec2f = atmosphere_intersectSphere(origin, direction, atmosphere.planetRadius);
  if (ground.x > 0.0) { end = min(end, ground.x); }
  if (end <= start) { return result; }
  var sunlight: vec3f = normalize(atmosphere.sunDirection);
  var rayleigh: vec3f = vec3f(0.0000058, 0.0000135, 0.0000331) * max(atmosphere.rayleigh, 0.0);
  var mie: vec3f = vec3f(0.000021) * max(atmosphere.haze, 0.0);
  var cosine: f32 = dot(direction, sunlight);
  var rayleighPhase: f32 = 0.0596831 * (1.0 + cosine * cosine);
  var asymmetry: f32 = 0.76;
  var miePhase: f32 = (1.0 - asymmetry * asymmetry) / (12.566371 * pow(max(1.0 + asymmetry * asymmetry - 2.0 * asymmetry * cosine, 0.001), 1.5));
  var stepLength: f32 = (end - start) / 12.0;
  var opticalDepth: vec2f = vec2f(0.0);
  var radiance: vec3f = vec3f(0.0);
  for (var sampleIndex: i32 = 0; sampleIndex < 12; sampleIndex++) {
    var position: vec3f = origin + direction * (start + (f32(sampleIndex) + 0.5) * stepLength);
    var density: vec2f = atmosphere_getDensity(position);
    var centerDepth: vec2f = opticalDepth + density * stepLength * 0.5;
    opticalDepth += density * stepLength;
    var solarGround: vec2f = atmosphere_intersectSphere(position, sunlight, atmosphere.planetRadius);
    if (solarGround.x > 0.0) { continue; }
    var solarDistance: f32 = max(atmosphere_intersectSphere(position, sunlight, atmosphere.planetRadius + 100000.0).y, 0.0);
    var solarStep: f32 = solarDistance / 4.0;
    var solarDepth: vec2f = vec2f(0.0);
    for (var solarIndex: i32 = 0; solarIndex < 4; solarIndex++) {
      solarDepth += atmosphere_getDensity(position + sunlight * ((f32(solarIndex) + 0.5) * solarStep)) * solarStep;
    }
    var attenuation: vec3f = exp(-rayleigh * (centerDepth.x + solarDepth.x) - mie * (centerDepth.y + solarDepth.y));
    radiance += attenuation * (rayleigh * density.x * rayleighPhase + mie * density.y * miePhase) * stepLength;
  }
  result.radiance = radiance * max(atmosphere.sunIntensity, 0.0);
  result.transmittance = exp(-rayleigh * opticalDepth.x - mie * opticalDepth.y);
  return result;
}
fn atmosphere_getSkyColor(camera: vec3f,
  direction: vec3f) -> vec3f {
  if (atmosphere.enabled < 0.5) { return vec3f(0.0); }
  var scatteringSample: AtmosphereSample = atmosphere_getScattering(camera, normalize(direction), 1000000.0);
  let origin = vec3f(camera.xy, atmosphere.planetRadius + max(camera.z, 1.0));
  let sunlight = normalize(atmosphere.sunDirection);
  let groundDistance = atmosphere_intersectSphere(origin, normalize(direction), atmosphere.planetRadius).x;
  if (groundDistance > 0.0 && sunlight.z > 0.0) {
    // Approximate direct irradiance at the ground boundary, attenuated on its way to the eye.
    let elevation = max(sunlight.z, 0.02);
    let extinction = vec3f(0.0000058, 0.0000135, 0.0000331) * max(atmosphere.rayleigh, 0.0) * 8000.0
      + vec3f(0.000021) * max(atmosphere.haze, 0.0) * 1200.0;
    scatteringSample.radiance += atmosphere.groundColor * atmosphere.sunIntensity * sunlight.z / 3.141593
      * exp(-extinction / elevation) * scatteringSample.transmittance;
  }
  return vec3f(1.0) - exp(-scatteringSample.radiance * atmosphere.exposure);
}
fn atmosphere_getColor(color: vec4f,
  position: vec3f,
  camera: vec3f) -> vec4f {
  var difference: vec3f = position - camera;
  var distance: f32 = length(difference);
  if (distance < 0.001 || atmosphere.enabled < 0.5) { return color; }
  var scatteringSample: AtmosphereSample = atmosphere_getScattering(camera, difference / distance, distance);
  var scattering: vec3f = vec3f(1.0) - exp(-scatteringSample.radiance * atmosphere.exposure);
  return vec4f(color.rgb * scatteringSample.transmittance + scattering, color.a);
}
`
} as const satisfies ShaderModule<AtmosphereProps, AtmosphereUniforms>;
