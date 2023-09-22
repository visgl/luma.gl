// luma.gl, MIT license
/* eslint-disable camelcase */

import type {NumberArray, Texture} from '@luma.gl/core';
import type {Vector2, Vector3, Vector4} from '@math.gl/core';

import {lighting} from '../lights/lighting-uniforms';

import {vs} from './pbr-vertex.glsl';
import {fs} from './pbr-fragment.glsl';


export type PBRMaterialSettings = PBRMaterialBindings & {
  unlit: boolean;

  // Base color map
  baseColorMapEnabled: boolean;
  baseColorFactor: Readonly<Vector4 | NumberArray>;

  normalMapEnabled: boolean;  
  normalScale: number; // #ifdef HAS_NORMALMAP

  emissiveMapEnabled: boolean;
  emissiveFactor: Readonly<Vector3 | NumberArray>; // #ifdef HAS_EMISSIVEMAP

  metallicRoughnessValues: Readonly<Vector2 | NumberArray>;
  metallicRoughnessMapEnabled: boolean;

  occlusionMapEnabled: boolean;
  occlusionStrength: number; // #ifdef HAS_OCCLUSIONMAP

  alphaCutoffEnabled: boolean;
  alphaCutoff: number; // #ifdef ALPHA_CUTOFF

  // IBL
  IBLenabled: boolean;
  scaleIBLAmbient: Readonly<Vector2 | NumberArray>; // #ifdef USE_IBL

  // debugging flags used for shader output of intermediate PBR variables
  // #ifdef PBR_DEBUG
  scaleDiffBaseMR: Readonly<Vector4 | NumberArray>;
  scaleFGDSpec: Readonly<Vector4 | NumberArray>;
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
}

export type PBRMaterialUniforms = {
  pbr_uUnlit: boolean;

  // Base color map
  u_baseColorMapEnabled: boolean;
  u_BaseColorFactor: Readonly<Vector4 | NumberArray>;

  u_NormalMapEnabled: boolean;  
  u_NormalScale: number; // #ifdef HAS_NORMALMAP

  u_EmissiveMapEnabled: boolean;
  u_EmissiveFactor: Readonly<Vector3 | NumberArray>; // #ifdef HAS_EMISSIVEMAP

  u_MetallicRoughnessValues: Readonly<Vector2 | NumberArray>;
  u_MetallicRoughnessMapEnabled: boolean;

  u_OcclusionMapEnabled: boolean;
  u_OcclusionStrength: number; // #ifdef HAS_OCCLUSIONMAP

  u_AlphaCutoffEnabled: boolean;
  u_AlphaCutoff: number; // #ifdef ALPHA_CUTOFF

  // IBL
  u_IBLenabled: boolean;
  u_ScaleIBLAmbient: Readonly<Vector2 | NumberArray>; // #ifdef USE_IBL

  // debugging flags used for shader output of intermediate PBR variables
  // #ifdef PBR_DEBUG
  u_ScaleDiffBaseMR: Readonly<Vector4 | NumberArray>;
  u_ScaleFGDSpec: Readonly<Vector4 | NumberArray>;
}

/**
 * An implementation of PBR (Physically-Based Rendering).
 * Physically Based Shading of a microfacet surface defined by a glTF material.
 */
export const pbrMaterial = {
  name: 'pbr',
  vs,
  fs,
  defines: {
    LIGHTING_FRAGMENT: 1
  },
  dependencies: [lighting]
};
