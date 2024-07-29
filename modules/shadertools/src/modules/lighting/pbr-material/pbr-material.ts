// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */

import type {Texture} from '@luma.gl/core';
import type {Vector2, Vector3, Vector4} from '@math.gl/core';
import type {NumberArray2, NumberArray3, NumberArray4} from '../../../lib/utils/uniform-types';

import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lighting} from '../lights/lighting-uniforms';

import {vs} from './pbr-vertex-glsl';
import {fs} from './pbr-fragment-glsl';

export type PBRMaterialProps = PBRMaterialBindings & {
  unlit: boolean;

  // Base color map
  baseColorMapEnabled: boolean;
  baseColorFactor: Readonly<Vector4 | NumberArray4>;

  normalMapEnabled: boolean;
  normalScale: number; // #ifdef HAS_NORMALMAP

  emissiveMapEnabled: boolean;
  emissiveFactor: Readonly<Vector3 | NumberArray3>; // #ifdef HAS_EMISSIVEMAP

  metallicRoughnessValues: Readonly<Vector2 | NumberArray2>;
  metallicRoughnessMapEnabled: boolean;

  occlusionMapEnabled: boolean;
  occlusionStrength: number; // #ifdef HAS_OCCLUSIONMAP

  alphaCutoffEnabled: boolean;
  alphaCutoff: number; // #ifdef ALPHA_CUTOFF

  // IBL
  IBLenabled: boolean;
  scaleIBLAmbient: Readonly<Vector2 | NumberArray2>; // #ifdef USE_IBL

  // debugging flags used for shader output of intermediate PBR variables
  // #ifdef PBR_DEBUG
  scaleDiffBaseMR: Readonly<Vector4 | NumberArray4>;
  scaleFGDSpec: Readonly<Vector4 | NumberArray4>;
};

/** Non-uniform block bindings for pbr module */
type PBRMaterialBindings = {
  // Samplers
  baseColorSampler?: Texture | null; // #ifdef HAS_BASECOLORMAP
  normalSampler?: Texture | null; // #ifdef HAS_NORMALMAP
  emissiveSampler?: Texture | null; // #ifdef HAS_EMISSIVEMAP
  metallicRoughnessSampler?: Texture | null; // #ifdef HAS_METALROUGHNESSMAP
  occlusionSampler?: Texture | null; // #ifdef HAS_OCCLUSIONMAP

  // IBL Samplers
  diffuseEnvSampler: Texture | null; // #ifdef USE_IBL (samplerCube)
  specularEnvSampler: Texture | null; // #ifdef USE_IBL (samplerCube)
  brdfLUT?: Texture | null; // #ifdef USE_IBL
};

export type PBRMaterialUniforms = {
  unlit: boolean;

  // Base color map
  baseColorMapEnabled: boolean;
  baseColorFactor: Readonly<Vector4 | NumberArray4>;

  normalMapEnabled: boolean;
  normalScale: number; // #ifdef HAS_NORMALMAP

  emissiveMapEnabled: boolean;
  emissiveFactor: Readonly<Vector3 | NumberArray3>; // #ifdef HAS_EMISSIVEMAP

  metallicRoughnessValues: Readonly<Vector2 | NumberArray2>;
  metallicRoughnessMapEnabled: boolean;

  occlusionMapEnabled: boolean;
  occlusionStrength: number; // #ifdef HAS_OCCLUSIONMAP

  alphaCutoffEnabled: boolean;
  alphaCutoff: number; // #ifdef ALPHA_CUTOFF

  // IBL
  IBLenabled: boolean;
  scaleIBLAmbient: Readonly<Vector2 | NumberArray2>; // #ifdef USE_IBL

  // debugging flags used for shader output of intermediate PBR variables
  // #ifdef PBR_DEBUG
  scaleDiffBaseMR: Readonly<Vector4 | NumberArray4>;
  scaleFGDSpec: Readonly<Vector4 | NumberArray4>;
};

/**
 * An implementation of PBR (Physically-Based Rendering).
 * Physically Based Shading of a microfacet surface defined by a glTF material.
 */
export const pbrMaterial: ShaderModule<PBRMaterialProps, PBRMaterialUniforms> = {
  name: 'pbr',
  vs,
  fs,
  defines: {
    LIGHTING_FRAGMENT: 1,
    HAS_NORMALMAP: 0,
    HAS_EMISSIVEMAP: 0,
    HAS_OCCLUSIONMAP: 0,
    HAS_BASECOLORMAP: 0,
    HAS_METALROUGHNESSMAP: 0,
    ALPHA_CUTOFF: 0,
    USE_IBL: 0,
    PBR_DEBUG: 0
  },
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
  },
  dependencies: [lighting]
};
