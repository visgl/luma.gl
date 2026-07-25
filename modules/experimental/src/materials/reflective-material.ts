// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule, ShaderPlugin} from '@luma.gl/shadertools';
import {opticalLighting} from './optical-lighting';

/** Runtime properties for the portable reflective-surface shader module. */
export type ReflectiveMaterialProps = {
  /** Surface roughness in the inclusive zero-to-one range. */
  roughness?: number;
  /** Intensity of environment reflections around the Fresnel rim. */
  reflectionStrength?: number;
  /** Intensity of the key and fill light specular highlights. */
  specularStrength?: number;
  /** Multiplier applied to the incoming material opacity. */
  opacityScale?: number;
};

/** Uniform values consumed by {@link reflectiveMaterial}. */
export type ReflectiveMaterialUniforms = Required<ReflectiveMaterialProps>;

const REFLECTIVE_MATERIAL_WGSL = /* wgsl */ `\
struct ReflectiveMaterialUniforms {
  roughness: f32,
  reflectionStrength: f32,
  specularStrength: f32,
  opacityScale: f32,
};

@group(0) @binding(auto) var<uniform> reflectiveMaterial: ReflectiveMaterialUniforms;

fn reflectiveMaterial_getColor(
  normal: vec3<f32>,
  worldPosition: vec3<f32>,
  baseColor: vec4<f32>,
  cameraPosition: vec3<f32>
) -> vec4<f32> {
  let viewDirection = normalize(cameraPosition - worldPosition);
  let normalFacingCamera = opticalLighting_faceNormal(normalize(normal), viewDirection);
  let viewAlignment = clamp(dot(normalFacingCamera, viewDirection), 0.0, 1.0);
  let fresnel = opticalLighting_getFresnel(viewAlignment, 0.08, 4.0);
  let keyLight = opticalLighting_getKeyLight();
  let fillLight = opticalLighting_getFillLight();
  let keyHalfVector = normalize(keyLight + viewDirection);
  let fillHalfVector = normalize(fillLight + viewDirection);
  let diffuse = 0.36 + 0.64 * max(dot(normalFacingCamera, keyLight), 0.0);
  let specularExponent = mix(96.0, 12.0, clamp(reflectiveMaterial.roughness, 0.0, 1.0));
  let keySpecular = pow(max(dot(normalFacingCamera, keyHalfVector), 0.0), specularExponent);
  let fillSpecular = pow(
    max(dot(normalFacingCamera, fillHalfVector), 0.0),
    specularExponent * 0.545
  );
  let reflectedColor = opticalLighting_sampleEnvironment(
    normalFacingCamera,
    vec3<f32>(0.08, 0.14, 0.25),
    vec3<f32>(0.52, 0.7, 0.95),
    0.0
  );
  let color = baseColor.rgb * diffuse +
    reflectedColor * fresnel * reflectiveMaterial.reflectionStrength +
    vec3<f32>(1.0, 0.94, 0.8) * keySpecular * reflectiveMaterial.specularStrength +
    vec3<f32>(0.4, 0.67, 1.0) * fillSpecular * reflectiveMaterial.specularStrength * 0.524;
  let opacity = clamp(
    baseColor.a * reflectiveMaterial.opacityScale *
      (0.85 + fresnel * 0.2 + (keySpecular + fillSpecular) * 0.35),
    0.0,
    0.72
  );
  return vec4<f32>(color, opacity);
}

#ifdef LUMA_OPTICAL_POINT_LIGHTS
fn reflectiveMaterial_getIlluminatedColor(
  normal: vec3<f32>,
  worldPosition: vec3<f32>,
  baseColor: vec4<f32>,
  cameraPosition: vec3<f32>
) -> vec4<f32> {
  let reflectedColor = reflectiveMaterial_getColor(
    normal,
    worldPosition,
    baseColor,
    cameraPosition
  );
  let pointLightColor = opticalPointLights_getColor(normal, worldPosition, cameraPosition);
  return vec4<f32>(
    reflectedColor.rgb + pointLightColor * reflectiveMaterial.specularStrength,
    reflectedColor.a
  );
}
#endif
`;

const REFLECTIVE_MATERIAL_GLSL = /* glsl */ `\
layout(std140) uniform reflectiveMaterialUniforms {
  float roughness;
  float reflectionStrength;
  float specularStrength;
  float opacityScale;
} reflectiveMaterial;

vec4 reflectiveMaterial_getColor(
  vec3 normal,
  vec3 worldPosition,
  vec4 baseColor,
  vec3 cameraPosition
) {
  vec3 viewDirection = normalize(cameraPosition - worldPosition);
  vec3 normalFacingCamera = opticalLighting_faceNormal(normalize(normal), viewDirection);
  float viewAlignment = clamp(dot(normalFacingCamera, viewDirection), 0.0, 1.0);
  float fresnel = opticalLighting_getFresnel(viewAlignment, 0.08, 4.0);
  vec3 keyLight = opticalLighting_getKeyLight();
  vec3 fillLight = opticalLighting_getFillLight();
  vec3 keyHalfVector = normalize(keyLight + viewDirection);
  vec3 fillHalfVector = normalize(fillLight + viewDirection);
  float diffuse = 0.36 + 0.64 * max(dot(normalFacingCamera, keyLight), 0.0);
  float specularExponent = mix(96.0, 12.0, clamp(reflectiveMaterial.roughness, 0.0, 1.0));
  float keySpecular = pow(max(dot(normalFacingCamera, keyHalfVector), 0.0), specularExponent);
  float fillSpecular = pow(
    max(dot(normalFacingCamera, fillHalfVector), 0.0),
    specularExponent * 0.545
  );
  vec3 reflectedColor = opticalLighting_sampleEnvironment(
    normalFacingCamera,
    vec3(0.08, 0.14, 0.25),
    vec3(0.52, 0.7, 0.95),
    0.0
  );
  vec3 color = baseColor.rgb * diffuse +
    reflectedColor * fresnel * reflectiveMaterial.reflectionStrength +
    vec3(1.0, 0.94, 0.8) * keySpecular * reflectiveMaterial.specularStrength +
    vec3(0.4, 0.67, 1.0) * fillSpecular * reflectiveMaterial.specularStrength * 0.524;
  float opacity = clamp(
    baseColor.a * reflectiveMaterial.opacityScale *
      (0.85 + fresnel * 0.2 + (keySpecular + fillSpecular) * 0.35),
    0.0,
    0.72
  );
  return vec4(color, opacity);
}

#ifdef LUMA_OPTICAL_POINT_LIGHTS
vec3 opticalPointLights_getColor(vec3 normal, vec3 worldPosition, vec3 cameraPosition);

vec4 reflectiveMaterial_getIlluminatedColor(
  vec3 normal,
  vec3 worldPosition,
  vec4 baseColor,
  vec3 cameraPosition
) {
  vec4 reflectedColor = reflectiveMaterial_getColor(
    normal,
    worldPosition,
    baseColor,
    cameraPosition
  );
  vec3 pointLightColor = opticalPointLights_getColor(normal, worldPosition, cameraPosition);
  return vec4(
    reflectedColor.rgb + pointLightColor * reflectiveMaterial.specularStrength,
    reflectedColor.a
  );
}
#endif
`;

function getReflectiveMaterialUniforms(
  props: Partial<ReflectiveMaterialProps> = {},
  previousUniforms?: ReflectiveMaterialUniforms
): ReflectiveMaterialUniforms {
  return {
    roughness: props.roughness ?? previousUniforms?.roughness ?? 0.62,
    reflectionStrength: props.reflectionStrength ?? previousUniforms?.reflectionStrength ?? 0.32,
    specularStrength: props.specularStrength ?? previousUniforms?.specularStrength ?? 0.42,
    opacityScale: props.opacityScale ?? previousUniforms?.opacityScale ?? 1
  };
}

/** Portable glossy surface shading with Fresnel edges and key/fill specular highlights. */
export const reflectiveMaterial = {
  name: 'reflectiveMaterial',
  source: REFLECTIVE_MATERIAL_WGSL,
  fs: REFLECTIVE_MATERIAL_GLSL,
  dependencies: [opticalLighting],
  uniformTypes: {
    roughness: 'f32',
    reflectionStrength: 'f32',
    specularStrength: 'f32',
    opacityScale: 'f32'
  },
  defaultUniforms: {
    roughness: 0.62,
    reflectionStrength: 0.32,
    specularStrength: 0.42,
    opacityScale: 1
  },
  getUniforms: getReflectiveMaterialUniforms
} as const satisfies ShaderModule<ReflectiveMaterialProps, ReflectiveMaterialUniforms, {}>;

/** Installs portable reflective surface shading and shared optical-lighting helpers. */
export const reflectiveMaterialPlugin = {
  name: 'reflectiveMaterial',
  modules: [reflectiveMaterial as ShaderModule]
} as const satisfies ShaderPlugin;
