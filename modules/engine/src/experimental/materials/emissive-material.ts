// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule, ShaderPlugin} from '@luma.gl/shadertools';
import {opticalLighting} from './optical-lighting';

/** Runtime properties for luminous surfaces rendered into an HDR scene. */
export type EmissiveMaterialProps = {
  /** Multiplier applied to the incoming surface color. */
  intensity?: number;
  /** Additional emission around silhouettes facing away from the camera. */
  rimStrength?: number;
};

/** Uniform values consumed by {@link emissiveMaterial}. */
export type EmissiveMaterialUniforms = Required<EmissiveMaterialProps>;

const EMISSIVE_MATERIAL_WGSL = /* wgsl */ `\
struct emissiveMaterialUniforms {
  intensity: f32,
  rimStrength: f32,
};

@group(0) @binding(auto) var<uniform> emissiveMaterial: emissiveMaterialUniforms;

fn emissiveMaterial_getColor(
  normal: vec3<f32>,
  worldPosition: vec3<f32>,
  baseColor: vec4<f32>,
  cameraPosition: vec3<f32>
) -> vec4<f32> {
  let viewDirection = normalize(cameraPosition - worldPosition);
  let normalFacingCamera = opticalLighting_faceNormal(normalize(normal), viewDirection);
  let viewAlignment = clamp(dot(normalFacingCamera, viewDirection), 0.0, 1.0);
  let rim = pow(1.0 - viewAlignment, 2.0);
  let emission = emissiveMaterial.intensity * (1.0 + emissiveMaterial.rimStrength * rim);
  return vec4<f32>(baseColor.rgb * emission, baseColor.a);
}

fn emissiveMaterial_getTrailColor(
  normal: vec3<f32>,
  worldPosition: vec3<f32>,
  baseColor: vec4<f32>,
  cameraPosition: vec3<f32>,
  trailProgress: f32,
  trailStrength: f32
) -> vec4<f32> {
  let emission = emissiveMaterial_getColor(normal, worldPosition, baseColor, cameraPosition);
  let fade = pow(smoothstep(0.0, 1.0, trailProgress), 1.5);
  return vec4<f32>(emission.rgb * fade * trailStrength, emission.a * fade);
}
`;

const EMISSIVE_MATERIAL_GLSL = /* glsl */ `\
layout(std140) uniform emissiveMaterialUniforms {
  float intensity;
  float rimStrength;
} emissiveMaterial;

vec4 emissiveMaterial_getColor(
  vec3 normal,
  vec3 worldPosition,
  vec4 baseColor,
  vec3 cameraPosition
) {
  vec3 viewDirection = normalize(cameraPosition - worldPosition);
  vec3 normalFacingCamera = opticalLighting_faceNormal(normalize(normal), viewDirection);
  float viewAlignment = clamp(dot(normalFacingCamera, viewDirection), 0.0, 1.0);
  float rim = pow(1.0 - viewAlignment, 2.0);
  float emission = emissiveMaterial.intensity * (1.0 + emissiveMaterial.rimStrength * rim);
  return vec4(baseColor.rgb * emission, baseColor.a);
}

vec4 emissiveMaterial_getTrailColor(
  vec3 normal,
  vec3 worldPosition,
  vec4 baseColor,
  vec3 cameraPosition,
  float trailProgress,
  float trailStrength
) {
  vec4 emission = emissiveMaterial_getColor(normal, worldPosition, baseColor, cameraPosition);
  float fade = pow(smoothstep(0.0, 1.0, trailProgress), 1.5);
  return vec4(emission.rgb * fade * trailStrength, emission.a * fade);
}
`;

function getEmissiveMaterialUniforms(
  props: Partial<EmissiveMaterialProps> = {},
  previousUniforms?: EmissiveMaterialUniforms
): EmissiveMaterialUniforms {
  return {
    intensity: props.intensity ?? previousUniforms?.intensity ?? 1,
    rimStrength: props.rimStrength ?? previousUniforms?.rimStrength ?? 0.35
  };
}

/** Portable emissive surface shading with a controllable camera-facing rim. */
export const emissiveMaterial = {
  name: 'emissiveMaterial',
  source: EMISSIVE_MATERIAL_WGSL,
  fs: EMISSIVE_MATERIAL_GLSL,
  dependencies: [opticalLighting],
  uniformTypes: {
    intensity: 'f32',
    rimStrength: 'f32'
  },
  defaultUniforms: {
    intensity: 1,
    rimStrength: 0.35
  },
  getUniforms: getEmissiveMaterialUniforms
} as const satisfies ShaderModule<EmissiveMaterialProps, EmissiveMaterialUniforms, {}>;

/** Installs portable emissive shading and shared optical-lighting helpers. */
export const emissiveMaterialPlugin = {
  name: 'emissiveMaterial',
  modules: [emissiveMaterial as ShaderModule]
} as const satisfies ShaderPlugin;
