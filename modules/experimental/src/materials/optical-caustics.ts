// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule, ShaderPlugin} from '@luma.gl/shadertools';
import {opticalLighting} from './optical-lighting';

/** Maximum number of nearby focusing glass lenses in the portable uniform block. */
export const MAX_OPTICAL_CAUSTIC_LENSES = 8;

/** A colored glass lens that projects a compact rasterized caustic onto nearby surfaces. */
export type OpticalCausticLens = {
  /** World-space center of the focusing glass surface. */
  position: [number, number, number];
  /** Approximate world-space radius of the glass surface. */
  radius?: number;
  /** Linear RGB color of light entering the lens. */
  color: [number, number, number];
  /** Optional per-lens concentration multiplier. */
  intensity?: number;
};

/** Runtime properties for a bounded collection of local focusing lenses. */
export type OpticalCausticsProps = {
  /** Active glass lenses; entries beyond the fixed capacity are ignored. */
  lenses?: readonly OpticalCausticLens[];
  /** Multiplier applied to the complete set of projected caustics. */
  intensity?: number;
  /** Concentration of the focused center and surrounding caustic ring. */
  focus?: number;
};

/** One packed entry in the cross-backend caustic-lens uniform array. */
export type OpticalCausticLensUniform = {
  position: [number, number, number];
  radius: number;
  color: [number, number, number];
  intensity: number;
};

/** Uniform values consumed by {@link opticalCaustics}. */
export type OpticalCausticsUniforms = {
  lensCount: number;
  intensity: number;
  focus: number;
  lenses: readonly OpticalCausticLensUniform[];
};

const OPTICAL_CAUSTIC_LENS_UNIFORM_TYPE = {
  position: 'vec3<f32>',
  radius: 'f32',
  color: 'vec3<f32>',
  intensity: 'f32'
} as const;

const OPTICAL_CAUSTICS_WGSL = /* wgsl */ `\
struct OpticalCausticLensUniform {
  position: vec3<f32>,
  radius: f32,
  color: vec3<f32>,
  intensity: f32,
};

struct opticalCausticsUniforms {
  lensCount: i32,
  intensity: f32,
  focus: f32,
  lenses: array<OpticalCausticLensUniform, ${MAX_OPTICAL_CAUSTIC_LENSES}>,
};

@group(0) @binding(auto) var<uniform> opticalCaustics: opticalCausticsUniforms;

fn opticalCaustics_getColor(
  normal: vec3<f32>,
  worldPosition: vec3<f32>,
  cameraPosition: vec3<f32>
) -> vec3<f32> {
  let viewDirection = normalize(cameraPosition - worldPosition);
  let normalFacingCamera = opticalLighting_faceNormal(normalize(normal), viewDirection);
  var accumulatedColor = vec3<f32>(0.0);

  for (var lensIndex = 0; lensIndex < ${MAX_OPTICAL_CAUSTIC_LENSES}; lensIndex++) {
    if (lensIndex >= opticalCaustics.lensCount) {
      break;
    }

    let lens = opticalCaustics.lenses[lensIndex];
    let lensOffset = worldPosition - lens.position;
    let distanceSquared = dot(lensOffset, lensOffset);
    let radius = max(lens.radius, 0.0001);
    let distance = sqrt(distanceSquared);
    let normalizedDistance = clamp(distance / (radius * 4.2), 0.0, 1.0);
    let attenuation = pow(1.0 - normalizedDistance, 2.0);
    let projectedDistance = max(-lensOffset.y, 0.0);
    let spread = radius * (0.82 + projectedDistance * 0.38);
    let radialDistance = length(lensOffset.xz) / max(spread, 0.0001);
    let concentration = max(opticalCaustics.focus, 0.0);
    let focusedCore = exp(-radialDistance * radialDistance * (2.4 + concentration * 3.0));
    let focusedRing = exp(-pow(radialDistance - 0.58, 2.0) *
      (11.0 + concentration * 15.0));
    let angularDetail = 0.78 + 0.22 * cos(
      atan2(lensOffset.z, lensOffset.x) * 3.0 + distance * 7.0
    );
    let lensDirection = -lensOffset * inverseSqrt(max(distanceSquared, 0.00001));
    let surfaceResponse = 0.18 +
      max(dot(normalFacingCamera, lensDirection), 0.0) * 0.82;
    let causticPattern = focusedCore * 0.58 + focusedRing * angularDetail * 0.42;
    accumulatedColor += lens.color * lens.intensity * attenuation *
      causticPattern * surfaceResponse;
  }

  return accumulatedColor * opticalCaustics.intensity;
}
`;

const OPTICAL_CAUSTICS_GLSL = /* glsl */ `\
struct OpticalCausticLensUniform {
  vec3 position;
  float radius;
  vec3 color;
  float intensity;
};

layout(std140) uniform opticalCausticsUniforms {
  int lensCount;
  float intensity;
  float focus;
  OpticalCausticLensUniform lenses[${MAX_OPTICAL_CAUSTIC_LENSES}];
} opticalCaustics;

vec3 opticalCaustics_getColor(
  vec3 normal,
  vec3 worldPosition,
  vec3 cameraPosition
) {
  vec3 viewDirection = normalize(cameraPosition - worldPosition);
  vec3 normalFacingCamera = opticalLighting_faceNormal(normalize(normal), viewDirection);
  vec3 accumulatedColor = vec3(0.0);

  for (int lensIndex = 0; lensIndex < ${MAX_OPTICAL_CAUSTIC_LENSES}; lensIndex++) {
    if (lensIndex >= opticalCaustics.lensCount) {
      break;
    }

    OpticalCausticLensUniform lens = opticalCaustics.lenses[lensIndex];
    vec3 lensOffset = worldPosition - lens.position;
    float distanceSquared = dot(lensOffset, lensOffset);
    float radius = max(lens.radius, 0.0001);
    float distance = sqrt(distanceSquared);
    float normalizedDistance = clamp(distance / (radius * 4.2), 0.0, 1.0);
    float attenuation = pow(1.0 - normalizedDistance, 2.0);
    float projectedDistance = max(-lensOffset.y, 0.0);
    float spread = radius * (0.82 + projectedDistance * 0.38);
    float radialDistance = length(lensOffset.xz) / max(spread, 0.0001);
    float concentration = max(opticalCaustics.focus, 0.0);
    float focusedCore = exp(-radialDistance * radialDistance * (2.4 + concentration * 3.0));
    float focusedRing = exp(-pow(radialDistance - 0.58, 2.0) *
      (11.0 + concentration * 15.0));
    float angularDetail = 0.78 + 0.22 * cos(
      atan(lensOffset.z, lensOffset.x) * 3.0 + distance * 7.0
    );
    vec3 lensDirection = -lensOffset * inversesqrt(max(distanceSquared, 0.00001));
    float surfaceResponse = 0.18 +
      max(dot(normalFacingCamera, lensDirection), 0.0) * 0.82;
    float causticPattern = focusedCore * 0.58 + focusedRing * angularDetail * 0.42;
    accumulatedColor += lens.color * lens.intensity * attenuation *
      causticPattern * surfaceResponse;
  }

  return accumulatedColor * opticalCaustics.intensity;
}
`;

function getOpticalCausticsUniforms(
  props: Partial<OpticalCausticsProps> = {},
  previousUniforms?: OpticalCausticsUniforms
): OpticalCausticsUniforms {
  const suppliedLenses = props.lenses;

  return {
    lensCount: suppliedLenses
      ? Math.min(suppliedLenses.length, MAX_OPTICAL_CAUSTIC_LENSES)
      : (previousUniforms?.lensCount ?? 0),
    intensity: props.intensity ?? previousUniforms?.intensity ?? 1,
    focus: props.focus ?? previousUniforms?.focus ?? 1,
    lenses: suppliedLenses
      ? makeOpticalCausticLensUniforms(suppliedLenses)
      : (previousUniforms?.lenses ?? makeOpticalCausticLensUniforms([]))
  };
}

function makeOpticalCausticLensUniforms(
  lenses: readonly OpticalCausticLens[]
): OpticalCausticLensUniform[] {
  return Array.from({length: MAX_OPTICAL_CAUSTIC_LENSES}, (_, lensIndex) => {
    const lens = lenses[lensIndex];

    return lens
      ? {
          position: lens.position,
          radius: lens.radius ?? 1,
          color: lens.color,
          intensity: lens.intensity ?? 1
        }
      : {
          position: [0, 0, 0],
          radius: 1,
          color: [0, 0, 0],
          intensity: 0
        };
  });
}

/** Portable raster approximation of focused light projected through nearby glass. */
export const opticalCaustics = {
  name: 'opticalCaustics',
  source: OPTICAL_CAUSTICS_WGSL,
  fs: OPTICAL_CAUSTICS_GLSL,
  dependencies: [opticalLighting],
  uniformTypes: {
    lensCount: 'i32',
    intensity: 'f32',
    focus: 'f32',
    lenses: [OPTICAL_CAUSTIC_LENS_UNIFORM_TYPE, MAX_OPTICAL_CAUSTIC_LENSES]
  },
  defaultUniforms: getOpticalCausticsUniforms(),
  getUniforms: getOpticalCausticsUniforms
} as const satisfies ShaderModule<OpticalCausticsProps, OpticalCausticsUniforms, {}>;

/** Explicitly installs bounded focusing lenses for nearby reflective receiver surfaces. */
export const opticalCausticsPlugin = {
  name: 'opticalCaustics',
  modules: [opticalCaustics as ShaderModule]
} as const satisfies ShaderPlugin;
