// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */

import type {Texture} from '@luma.gl/core';
import type {
  Vector2,
  Vector3,
  Vector4,
  NumberArray2,
  NumberArray3,
  NumberArray4
} from '@math.gl/core';

import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lighting} from '../lights/lighting';

import {vs} from './pbr-vertex-glsl';
import {fs} from './pbr-fragment-glsl';
import {pbrProjection} from './pbr-projection';

/** Non-uniform block bindings for pbr module */
export type PBRMaterialBindings = {
  // Samplers
  pbr_baseColorSampler?: Texture | null; // #ifdef HAS_BASECOLORMAP
  pbr_normalSampler?: Texture | null; // #ifdef HAS_NORMALMAP
  pbr_emissiveSampler?: Texture | null; // #ifdef HAS_EMISSIVEMAP
  pbr_metallicRoughnessSampler?: Texture | null; // #ifdef HAS_METALROUGHNESSMAP
  pbr_occlusionSampler?: Texture | null; // #ifdef HAS_OCCLUSIONMAP

  // IBL Samplers
  pbr_diffuseEnvSampler?: Texture | null; // #ifdef USE_IBL (samplerCube)
  pbr_specularEnvSampler?: Texture | null; // #ifdef USE_IBL (samplerCube)
  pbr_BrdfLUT?: Texture | null; // #ifdef USE_IBL
};

export type PBRMaterialUniforms = {
  unlit?: boolean;

  // Base color map
  baseColorMapEnabled?: boolean;
  baseColorFactor?: Readonly<Vector4 | NumberArray4>;

  normalMapEnabled?: boolean;
  normalScale?: number; // #ifdef HAS_NORMALMAP

  emissiveMapEnabled?: boolean;
  emissiveFactor?: Readonly<Vector3 | NumberArray3>; // #ifdef HAS_EMISSIVEMAP

  metallicRoughnessValues?: Readonly<Vector2 | NumberArray2>;
  metallicRoughnessMapEnabled?: boolean;

  occlusionMapEnabled?: boolean;
  occlusionStrength?: number; // #ifdef HAS_OCCLUSIONMAP

  alphaCutoffEnabled?: boolean;
  alphaCutoff?: number; // #ifdef ALPHA_CUTOFF

  // IBL
  IBLenabled?: boolean;
  scaleIBLAmbient?: Readonly<Vector2 | NumberArray2>; // #ifdef USE_IBL

  // debugging flags used for shader output of intermediate PBR variables
  // #ifdef PBR_DEBUG
  scaleDiffBaseMR?: Readonly<Vector4 | NumberArray4>;
  scaleFGDSpec?: Readonly<Vector4 | NumberArray4>;
};

export type PBRMaterialProps = PBRMaterialBindings & PBRMaterialUniforms;

/**
 * An implementation of PBR (Physically-Based Rendering).
 * Physically Based Shading of a microfacet surface defined by a glTF material.
 */
export const pbrMaterial = {
  props: {} as PBRMaterialProps,
  uniforms: {} as PBRMaterialUniforms,

  name: 'pbrMaterial',
  dependencies: [lighting, pbrProjection],
  vs,
  fs,

  defines: {
    LIGHTING_FRAGMENT: 1
    // TODO defining these as 0 breaks shader
    // HAS_NORMALMAP: 0
    // HAS_EMISSIVEMAP: 0,
    // HAS_OCCLUSIONMAP: 0,
    // HAS_BASECOLORMAP: 0,
    // HAS_METALROUGHNESSMAP: 0,
    // ALPHA_CUTOFF: 0
    // USE_IBL: 0
    // PBR_DEBUG: 0
  },
  getUniforms: props => props,
  uniformTypes: {
    // Material is unlit
    unlit: 'i32',

    // Base color map
    baseColorMapEnabled: 'i32',
    baseColorFactor: 'vec4<f32>',

    normalMapEnabled: 'i32',
    normalScale: 'f32', // #ifdef HAS_NORMALMAP

    emissiveMapEnabled: 'i32',
    emissiveFactor: 'vec3<f32>', // #ifdef HAS_EMISSIVEMAP

    metallicRoughnessValues: 'vec2<f32>',
    metallicRoughnessMapEnabled: 'i32',

    occlusionMapEnabled: 'i32',
    occlusionStrength: 'f32', // #ifdef HAS_OCCLUSIONMAP

    alphaCutoffEnabled: 'i32',
    alphaCutoff: 'f32', // #ifdef ALPHA_CUTOFF

    // IBL
    IBLenabled: 'i32',
    scaleIBLAmbient: 'vec2<f32>', // #ifdef USE_IBL

    // debugging flags used for shader output of intermediate PBR variables
    // #ifdef PBR_DEBUG
    scaleDiffBaseMR: 'vec4<f32>',
    scaleFGDSpec: 'vec4<f32>'
  }
} as const satisfies ShaderModule<PBRMaterialProps, PBRMaterialUniforms, PBRMaterialBindings>;
