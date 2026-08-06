// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule, ShaderPlugin} from '@luma.gl/shadertools';
import {opticalLighting} from './optical-lighting';

/** Maximum number of local lights carried by the portable fixed-size uniform block. */
export const MAX_OPTICAL_POINT_LIGHTS = 16;

/** Local colored light emitted from a world-space position. */
export type OpticalPointLight = {
  /** Position in the same world-space coordinate system as the illuminated geometry. */
  position: [number, number, number];
  /** Linear RGB light color. */
  color: [number, number, number];
  /** Optional per-light intensity multiplier. */
  intensity?: number;
  /** World-space distance at which illumination falls smoothly to zero. */
  radius?: number;
};

/** Runtime properties for a bounded set of local optical lights. */
export type OpticalPointLightsProps = {
  /** Active local lights; additional lights beyond the fixed capacity are ignored. */
  lights?: readonly OpticalPointLight[];
  /** Multiplier applied to the complete set of lights. */
  intensity?: number;
};

/** One packed entry in the cross-backend optical-light uniform array. */
export type OpticalPointLightUniform = {
  position: [number, number, number];
  radius: number;
  color: [number, number, number];
  intensity: number;
};

/** Uniform values consumed by {@link opticalPointLights}. */
export type OpticalPointLightsUniforms = {
  lightCount: number;
  intensity: number;
  lights: readonly OpticalPointLightUniform[];
};

const OPTICAL_POINT_LIGHT_UNIFORM_TYPE = {
  position: 'vec3<f32>',
  radius: 'f32',
  color: 'vec3<f32>',
  intensity: 'f32'
} as const;

const OPTICAL_POINT_LIGHTS_WGSL = /* wgsl */ `\
struct OpticalPointLightUniform {
  position: vec3<f32>,
  radius: f32,
  color: vec3<f32>,
  intensity: f32,
};

struct opticalPointLightsUniforms {
  lightCount: i32,
  intensity: f32,
  lights: array<OpticalPointLightUniform, ${MAX_OPTICAL_POINT_LIGHTS}>,
};

@group(0) @binding(auto) var<uniform> opticalPointLights: opticalPointLightsUniforms;

fn opticalPointLights_getColor(
  normal: vec3<f32>,
  worldPosition: vec3<f32>,
  cameraPosition: vec3<f32>
) -> vec3<f32> {
  let viewDirection = normalize(cameraPosition - worldPosition);
  let normalFacingCamera = opticalLighting_faceNormal(normalize(normal), viewDirection);
  var accumulatedColor = vec3<f32>(0.0);

  for (var lightIndex = 0; lightIndex < ${MAX_OPTICAL_POINT_LIGHTS}; lightIndex++) {
    if (lightIndex >= opticalPointLights.lightCount) {
      break;
    }

    let light = opticalPointLights.lights[lightIndex];
    let lightOffset = light.position - worldPosition;
    let distanceSquared = dot(lightOffset, lightOffset);
    let radius = max(light.radius, 0.0001);
    let normalizedDistance = clamp(sqrt(distanceSquared) / radius, 0.0, 1.0);
    let attenuation = pow(1.0 - normalizedDistance * normalizedDistance, 2.0);
    let lightDirection = lightOffset * inverseSqrt(max(distanceSquared, 0.00001));
    let halfVector = normalize(lightDirection + viewDirection + vec3<f32>(0.00001));
    let diffuse = max(dot(normalFacingCamera, lightDirection), 0.0);
    let specular = pow(max(dot(normalFacingCamera, halfVector), 0.0), 28.0);
    let surfaceResponse = 0.08 + diffuse * 0.52 + specular * 0.4;
    accumulatedColor += light.color * light.intensity * attenuation * surfaceResponse;
  }

  return accumulatedColor * opticalPointLights.intensity;
}

fn opticalPointLights_getSpecularColor(
  normal: vec3<f32>,
  worldPosition: vec3<f32>,
  cameraPosition: vec3<f32>,
  roughness: f32
) -> vec3<f32> {
  let viewDirection = normalize(cameraPosition - worldPosition);
  let normalFacingCamera = opticalLighting_faceNormal(normalize(normal), viewDirection);
  let shininess = mix(118.0, 34.0, clamp(roughness, 0.0, 1.0));
  let fresnel = opticalLighting_getFresnel(
    clamp(dot(normalFacingCamera, viewDirection), 0.0, 1.0),
    0.04,
    5.0
  );
  var accumulatedColor = vec3<f32>(0.0);

  for (var lightIndex = 0; lightIndex < ${MAX_OPTICAL_POINT_LIGHTS}; lightIndex++) {
    if (lightIndex >= opticalPointLights.lightCount) {
      break;
    }

    let light = opticalPointLights.lights[lightIndex];
    let lightOffset = light.position - worldPosition;
    let distanceSquared = dot(lightOffset, lightOffset);
    let radius = max(light.radius, 0.0001);
    let normalizedDistance = clamp(sqrt(distanceSquared) / radius, 0.0, 1.0);
    let attenuation = pow(1.0 - normalizedDistance * normalizedDistance, 2.0);
    let lightDirection = lightOffset * inverseSqrt(max(distanceSquared, 0.00001));
    let reflectionDirection = reflect(-viewDirection, normalFacingCamera);
    let reflectionAlignment = max(dot(reflectionDirection, lightDirection), 0.0);
    let specular = pow(reflectionAlignment, shininess);
    let softSpecular = pow(reflectionAlignment, max(shininess * 0.34, 10.0)) * 0.045;
    accumulatedColor += light.color * light.intensity * attenuation *
      (specular * 1.45 + softSpecular) *
      (0.35 + fresnel * 1.65);
  }

  return accumulatedColor * opticalPointLights.intensity;
}
`;

const OPTICAL_POINT_LIGHTS_GLSL = /* glsl */ `\
struct OpticalPointLightUniform {
  vec3 position;
  float radius;
  vec3 color;
  float intensity;
};

layout(std140) uniform opticalPointLightsUniforms {
  int lightCount;
  float intensity;
  OpticalPointLightUniform lights[${MAX_OPTICAL_POINT_LIGHTS}];
} opticalPointLights;

vec3 opticalPointLights_getColor(
  vec3 normal,
  vec3 worldPosition,
  vec3 cameraPosition
) {
  vec3 viewDirection = normalize(cameraPosition - worldPosition);
  vec3 normalFacingCamera = opticalLighting_faceNormal(normalize(normal), viewDirection);
  vec3 accumulatedColor = vec3(0.0);

  for (int lightIndex = 0; lightIndex < ${MAX_OPTICAL_POINT_LIGHTS}; lightIndex++) {
    if (lightIndex >= opticalPointLights.lightCount) {
      break;
    }

    OpticalPointLightUniform light = opticalPointLights.lights[lightIndex];
    vec3 lightOffset = light.position - worldPosition;
    float distanceSquared = dot(lightOffset, lightOffset);
    float radius = max(light.radius, 0.0001);
    float normalizedDistance = clamp(sqrt(distanceSquared) / radius, 0.0, 1.0);
    float attenuation = pow(1.0 - normalizedDistance * normalizedDistance, 2.0);
    vec3 lightDirection = lightOffset * inversesqrt(max(distanceSquared, 0.00001));
    vec3 halfVector = normalize(lightDirection + viewDirection + vec3(0.00001));
    float diffuse = max(dot(normalFacingCamera, lightDirection), 0.0);
    float specular = pow(max(dot(normalFacingCamera, halfVector), 0.0), 28.0);
    float surfaceResponse = 0.08 + diffuse * 0.52 + specular * 0.4;
    accumulatedColor += light.color * light.intensity * attenuation * surfaceResponse;
  }

  return accumulatedColor * opticalPointLights.intensity;
}

vec3 opticalPointLights_getSpecularColor(
  vec3 normal,
  vec3 worldPosition,
  vec3 cameraPosition,
  float roughness
) {
  vec3 viewDirection = normalize(cameraPosition - worldPosition);
  vec3 normalFacingCamera = opticalLighting_faceNormal(normalize(normal), viewDirection);
  float shininess = mix(118.0, 34.0, clamp(roughness, 0.0, 1.0));
  float fresnel = opticalLighting_getFresnel(
    clamp(dot(normalFacingCamera, viewDirection), 0.0, 1.0),
    0.04,
    5.0
  );
  vec3 accumulatedColor = vec3(0.0);

  for (int lightIndex = 0; lightIndex < ${MAX_OPTICAL_POINT_LIGHTS}; lightIndex++) {
    if (lightIndex >= opticalPointLights.lightCount) {
      break;
    }

    OpticalPointLightUniform light = opticalPointLights.lights[lightIndex];
    vec3 lightOffset = light.position - worldPosition;
    float distanceSquared = dot(lightOffset, lightOffset);
    float radius = max(light.radius, 0.0001);
    float normalizedDistance = clamp(sqrt(distanceSquared) / radius, 0.0, 1.0);
    float attenuation = pow(1.0 - normalizedDistance * normalizedDistance, 2.0);
    vec3 lightDirection = lightOffset * inversesqrt(max(distanceSquared, 0.00001));
    vec3 reflectionDirection = reflect(-viewDirection, normalFacingCamera);
    float reflectionAlignment = max(dot(reflectionDirection, lightDirection), 0.0);
    float specular = pow(reflectionAlignment, shininess);
    float softSpecular = pow(reflectionAlignment, max(shininess * 0.34, 10.0)) * 0.045;
    accumulatedColor += light.color * light.intensity * attenuation *
      (specular * 1.45 + softSpecular) *
      (0.35 + fresnel * 1.65);
  }

  return accumulatedColor * opticalPointLights.intensity;
}
`;

function getOpticalPointLightsUniforms(
  props: Partial<OpticalPointLightsProps> = {},
  previousUniforms?: OpticalPointLightsUniforms
): OpticalPointLightsUniforms {
  const suppliedLights = props.lights;

  return {
    lightCount: suppliedLights
      ? Math.min(suppliedLights.length, MAX_OPTICAL_POINT_LIGHTS)
      : (previousUniforms?.lightCount ?? 0),
    intensity: props.intensity ?? previousUniforms?.intensity ?? 1,
    lights: suppliedLights
      ? makeOpticalPointLightUniforms(suppliedLights)
      : (previousUniforms?.lights ?? makeOpticalPointLightUniforms([]))
  };
}

function makeOpticalPointLightUniforms(
  lights: readonly OpticalPointLight[]
): OpticalPointLightUniform[] {
  return Array.from({length: MAX_OPTICAL_POINT_LIGHTS}, (_, lightIndex) => {
    const light = lights[lightIndex];

    return light
      ? {
          position: light.position,
          radius: light.radius ?? 1,
          color: light.color,
          intensity: light.intensity ?? 1
        }
      : {
          position: [0, 0, 0],
          radius: 1,
          color: [0, 0, 0],
          intensity: 0
        };
  });
}

/** Portable bounded point lights for glass and reflective optical materials. */
export const opticalPointLights = {
  name: 'opticalPointLights',
  source: OPTICAL_POINT_LIGHTS_WGSL,
  fs: OPTICAL_POINT_LIGHTS_GLSL,
  defines: {
    LUMA_OPTICAL_POINT_LIGHTS: true
  },
  dependencies: [opticalLighting],
  uniformTypes: {
    lightCount: 'i32',
    intensity: 'f32',
    lights: [OPTICAL_POINT_LIGHT_UNIFORM_TYPE, MAX_OPTICAL_POINT_LIGHTS]
  },
  defaultUniforms: getOpticalPointLightsUniforms(),
  getUniforms: getOpticalPointLightsUniforms
} as const satisfies ShaderModule<OpticalPointLightsProps, OpticalPointLightsUniforms, {}>;

/** Explicitly installs bounded point lights and enables illuminated material helpers. */
export const opticalPointLightsPlugin = {
  name: 'opticalPointLights',
  modules: [opticalPointLights as ShaderModule]
} as const satisfies ShaderPlugin;
