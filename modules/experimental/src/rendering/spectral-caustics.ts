// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {NumberArray3} from '@math.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';

/** W3C D65 XYZ-to-linear-sRGB matrix in row-major order. */
export const D65_XYZ_TO_LINEAR_SRGB_MATRIX = [
  3.2409699419045226, -1.537383177570094, -0.4986107602930034, -0.9692436362808796,
  1.8759675015077202, 0.04155505740717559, 0.05563007969699366, -0.20397695888897652,
  1.0569715142428786
] as const;

/** Planar receiver uniforms consumed by {@link spectralCaustics}. */
export type SpectralCausticsUniforms = {
  /** World-space center of the planar receiver. */
  receiverOrigin: Readonly<NumberArray3>;
  /** Unit-length world-space receiver axis mapped to texture U. */
  receiverTangent: Readonly<NumberArray3>;
  /** Unit-length world-space receiver axis mapped to texture V. */
  receiverBitangent: Readonly<NumberArray3>;
  /** World-space span of the receiver along receiverTangent. */
  receiverWidth: number;
  /** World-space span of the receiver along receiverBitangent. */
  receiverHeight: number;
};

/** Texture binding consumed by {@link spectralCaustics}. */
export type SpectralCausticsBindings = {
  /** Additively accumulated D65 XYZ caustic radiance. */
  spectralCausticsMap?: Texture;
};

/** Runtime properties for sampling a traced spectral-caustic map on a planar receiver. */
export type SpectralCausticsProps = Partial<SpectralCausticsUniforms> & {
  /** Additively accumulated D65 XYZ caustic radiance. */
  causticMap?: Texture;
};

/**
 * Converts D65 XYZ radiance to linear sRGB using the W3C matrix.
 *
 * Only negative final RGB channels are clamped. Values above one intentionally remain HDR.
 */
export function convertD65XYZToLinearSRGB(xyz: Readonly<NumberArray3>): [number, number, number] {
  const red =
    D65_XYZ_TO_LINEAR_SRGB_MATRIX[0] * xyz[0] +
    D65_XYZ_TO_LINEAR_SRGB_MATRIX[1] * xyz[1] +
    D65_XYZ_TO_LINEAR_SRGB_MATRIX[2] * xyz[2];
  const green =
    D65_XYZ_TO_LINEAR_SRGB_MATRIX[3] * xyz[0] +
    D65_XYZ_TO_LINEAR_SRGB_MATRIX[4] * xyz[1] +
    D65_XYZ_TO_LINEAR_SRGB_MATRIX[5] * xyz[2];
  const blue =
    D65_XYZ_TO_LINEAR_SRGB_MATRIX[6] * xyz[0] +
    D65_XYZ_TO_LINEAR_SRGB_MATRIX[7] * xyz[1] +
    D65_XYZ_TO_LINEAR_SRGB_MATRIX[8] * xyz[2];

  return [Math.max(red, 0), Math.max(green, 0), Math.max(blue, 0)];
}

const SHADER_STAGE_FRAGMENT = 0x2;

const SPECTRAL_CAUSTICS_WGSL = /* wgsl */ `\
struct spectralCausticsUniforms {
  receiverOrigin: vec3<f32>,
  receiverWidth: f32,
  receiverTangent: vec3<f32>,
  receiverHeight: f32,
  receiverBitangent: vec3<f32>,
};

@group(0) @binding(auto) var<uniform> spectralCaustics: spectralCausticsUniforms;
@group(0) @binding(auto) var spectralCausticsMap: texture_2d<f32>;
@group(0) @binding(auto) var spectralCausticsMapSampler: sampler;

// W3C D65 XYZ-to-linear-sRGB matrix. WGSL matrix constructors list columns.
const SPECTRAL_CAUSTICS_D65_XYZ_TO_LINEAR_SRGB: mat3x3<f32> = mat3x3<f32>(
  vec3<f32>(3.2409699419045226, -0.9692436362808796, 0.05563007969699366),
  vec3<f32>(-1.537383177570094, 1.8759675015077202, -0.20397695888897652),
  vec3<f32>(-0.4986107602930034, 0.04155505740717559, 1.0569715142428786)
);

fn spectralCaustics_getReceiverUV(worldPosition: vec3<f32>) -> vec2<f32> {
  let receiverOffset = worldPosition - spectralCaustics.receiverOrigin;
  return vec2<f32>(
    dot(receiverOffset, spectralCaustics.receiverTangent) /
      max(spectralCaustics.receiverWidth, 0.000001) + 0.5,
    dot(receiverOffset, spectralCaustics.receiverBitangent) /
      max(spectralCaustics.receiverHeight, 0.000001) + 0.5
  );
}

fn spectralCaustics_getXYZ(worldPosition: vec3<f32>) -> vec3<f32> {
  let receiverUv = spectralCaustics_getReceiverUV(worldPosition);
  if (any(receiverUv < vec2<f32>(0.0)) || any(receiverUv > vec2<f32>(1.0))) {
    return vec3<f32>(0.0);
  }
  return textureSampleLevel(
    spectralCausticsMap,
    spectralCausticsMapSampler,
    receiverUv,
    0.0
  ).xyz;
}

fn spectralCaustics_getLinearSRGB(worldPosition: vec3<f32>) -> vec3<f32> {
  let xyz = spectralCaustics_getXYZ(worldPosition);
  let linearSRGB = SPECTRAL_CAUSTICS_D65_XYZ_TO_LINEAR_SRGB * xyz;
  return max(linearSRGB, vec3<f32>(0.0));
}
`;

function getSpectralCausticsUniforms(
  props: SpectralCausticsProps = {},
  previousUniforms?: SpectralCausticsUniforms
): Partial<SpectralCausticsUniforms & SpectralCausticsBindings> {
  return {
    receiverOrigin: props.receiverOrigin ?? previousUniforms?.receiverOrigin ?? [0, 0, 0],
    receiverTangent: props.receiverTangent ?? previousUniforms?.receiverTangent ?? [1, 0, 0],
    receiverBitangent: props.receiverBitangent ?? previousUniforms?.receiverBitangent ?? [0, 0, 1],
    receiverWidth: props.receiverWidth ?? previousUniforms?.receiverWidth ?? 1,
    receiverHeight: props.receiverHeight ?? previousUniforms?.receiverHeight ?? 1,
    ...(props.causticMap ? {spectralCausticsMap: props.causticMap} : {})
  };
}

/** Samples an HDR D65 XYZ caustic map and converts it once at the receiver shading boundary. */
export const spectralCaustics = {
  name: 'spectralCaustics',
  source: SPECTRAL_CAUSTICS_WGSL,
  bindingLayout: [
    {name: 'spectralCausticsMap', group: 0, visibility: SHADER_STAGE_FRAGMENT},
    {name: 'spectralCausticsMapSampler', group: 0, visibility: SHADER_STAGE_FRAGMENT}
  ],
  uniformTypes: {
    receiverOrigin: 'vec3<f32>',
    receiverWidth: 'f32',
    receiverTangent: 'vec3<f32>',
    receiverHeight: 'f32',
    receiverBitangent: 'vec3<f32>'
  },
  defaultUniforms: {
    receiverOrigin: [0, 0, 0],
    receiverTangent: [1, 0, 0],
    receiverBitangent: [0, 0, 1],
    receiverWidth: 1,
    receiverHeight: 1
  },
  getUniforms: getSpectralCausticsUniforms
} as const satisfies ShaderModule<
  SpectralCausticsProps,
  SpectralCausticsUniforms,
  SpectralCausticsBindings
>;
