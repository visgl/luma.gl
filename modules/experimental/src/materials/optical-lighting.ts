// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shadertools';

const OPTICAL_LIGHTING_WGSL = /* wgsl */ `\
fn opticalLighting_faceNormal(normal: vec3<f32>, viewDirection: vec3<f32>) -> vec3<f32> {
  return select(-normal, normal, dot(normal, viewDirection) >= 0.0);
}

fn opticalLighting_getFresnel(
  viewAlignment: f32,
  baseReflectance: f32,
  exponent: f32
) -> f32 {
  return baseReflectance + (1.0 - baseReflectance) *
    pow(1.0 - clamp(viewAlignment, 0.0, 1.0), exponent);
}

fn opticalLighting_getMicrofacetSpecular(
  normal: vec3<f32>,
  viewDirection: vec3<f32>,
  lightDirection: vec3<f32>,
  roughness: f32
) -> f32 {
  let halfDirection = normalize(viewDirection + lightDirection);
  let normalAlignment = max(dot(normal, viewDirection), 0.001);
  let lightAlignment = max(dot(normal, lightDirection), 0.0);
  let halfAlignment = max(dot(normal, halfDirection), 0.0);
  let alpha = max(roughness * roughness, 0.045);
  let alphaSquared = alpha * alpha;
  let distributionDenominator = halfAlignment * halfAlignment * (alphaSquared - 1.0) + 1.0;
  let distribution = alphaSquared /
    max(3.14159265 * distributionDenominator * distributionDenominator, 0.001);
  let visibilityFactor = pow(roughness + 1.0, 2.0) * 0.125;
  let viewVisibility = normalAlignment /
    (normalAlignment * (1.0 - visibilityFactor) + visibilityFactor);
  let lightVisibility = lightAlignment /
    (lightAlignment * (1.0 - visibilityFactor) + visibilityFactor);
  return distribution * viewVisibility * lightVisibility * lightAlignment /
    max(4.0 * normalAlignment * lightAlignment, 0.001);
}

fn opticalLighting_getKeyLight() -> vec3<f32> {
  return normalize(vec3<f32>(-0.45, 0.82, 0.34));
}

fn opticalLighting_getFillLight() -> vec3<f32> {
  return normalize(vec3<f32>(0.62, 0.35, -0.7));
}

fn opticalLighting_sampleEnvironment(
  reflectionDirection: vec3<f32>,
  shadowColor: vec3<f32>,
  highlightColor: vec3<f32>,
  horizonStrength: f32
) -> vec3<f32> {
  let horizon = pow(1.0 - abs(reflectionDirection.y), 4.0);
  return mix(
    shadowColor,
    highlightColor,
    clamp(reflectionDirection.y * 0.5 + 0.5 + horizon * horizonStrength, 0.0, 1.0)
  );
}
`;

const OPTICAL_LIGHTING_GLSL = /* glsl */ `\
vec3 opticalLighting_faceNormal(vec3 normal, vec3 viewDirection) {
  return dot(normal, viewDirection) >= 0.0 ? normal : -normal;
}

float opticalLighting_getFresnel(float viewAlignment, float baseReflectance, float exponent) {
  return baseReflectance + (1.0 - baseReflectance) *
    pow(1.0 - clamp(viewAlignment, 0.0, 1.0), exponent);
}

float opticalLighting_getMicrofacetSpecular(
  vec3 normal,
  vec3 viewDirection,
  vec3 lightDirection,
  float roughness
) {
  vec3 halfDirection = normalize(viewDirection + lightDirection);
  float normalAlignment = max(dot(normal, viewDirection), 0.001);
  float lightAlignment = max(dot(normal, lightDirection), 0.0);
  float halfAlignment = max(dot(normal, halfDirection), 0.0);
  float alpha = max(roughness * roughness, 0.045);
  float alphaSquared = alpha * alpha;
  float distributionDenominator = halfAlignment * halfAlignment * (alphaSquared - 1.0) + 1.0;
  float distribution = alphaSquared /
    max(3.14159265 * distributionDenominator * distributionDenominator, 0.001);
  float visibilityFactor = pow(roughness + 1.0, 2.0) * 0.125;
  float viewVisibility = normalAlignment /
    (normalAlignment * (1.0 - visibilityFactor) + visibilityFactor);
  float lightVisibility = lightAlignment /
    (lightAlignment * (1.0 - visibilityFactor) + visibilityFactor);
  return distribution * viewVisibility * lightVisibility * lightAlignment /
    max(4.0 * normalAlignment * lightAlignment, 0.001);
}

vec3 opticalLighting_getKeyLight() {
  return normalize(vec3(-0.45, 0.82, 0.34));
}

vec3 opticalLighting_getFillLight() {
  return normalize(vec3(0.62, 0.35, -0.7));
}

vec3 opticalLighting_sampleEnvironment(
  vec3 reflectionDirection,
  vec3 shadowColor,
  vec3 highlightColor,
  float horizonStrength
) {
  float horizon = pow(1.0 - abs(reflectionDirection.y), 4.0);
  return mix(
    shadowColor,
    highlightColor,
    clamp(reflectionDirection.y * 0.5 + 0.5 + horizon * horizonStrength, 0.0, 1.0)
  );
}
`;

/** Shared portable Fresnel, normal-facing, lighting, and environment-reflection helpers. */
export const opticalLighting = {
  name: 'opticalLighting',
  source: OPTICAL_LIGHTING_WGSL,
  fs: OPTICAL_LIGHTING_GLSL
} as const satisfies ShaderModule;
