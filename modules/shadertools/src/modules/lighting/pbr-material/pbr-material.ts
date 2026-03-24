// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */

import type {Texture} from '@luma.gl/core';
import type {
  Matrix3,
  Vector2,
  Vector3,
  Vector4,
  NumberArray2,
  NumberArray3,
  NumberArray4,
  NumberArray9
} from '@math.gl/core';

import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lighting} from '../lights/lighting';
import {ibl} from '../ibl/ibl';

import {vs, fs} from './pbr-material-glsl';
import {source} from './pbr-material-wgsl';
import {pbrProjection} from './pbr-projection';

/** Non-uniform block bindings for pbr module */
export type PBRMaterialBindings = {
  // Samplers
  pbr_baseColorSampler?: Texture | null; // #ifdef HAS_BASECOLORMAP
  pbr_normalSampler?: Texture | null; // #ifdef HAS_NORMALMAP
  pbr_emissiveSampler?: Texture | null; // #ifdef HAS_EMISSIVEMAP
  pbr_metallicRoughnessSampler?: Texture | null; // #ifdef HAS_METALROUGHNESSMAP
  pbr_occlusionSampler?: Texture | null; // #ifdef HAS_OCCLUSIONMAP

  pbr_specularColorSampler?: Texture | null; // #ifdef HAS_SPECULARCOLORMAP
  pbr_specularIntensitySampler?: Texture | null; // #ifdef HAS_SPECULARINTENSITYMAP
  pbr_transmissionSampler?: Texture | null; // #ifdef HAS_TRANSMISSIONMAP
  pbr_thicknessSampler?: Texture | null; // #ifdef HAS_THICKNESSMAP

  pbr_clearcoatSampler?: Texture | null; // #ifdef HAS_CLEARCOATMAP
  pbr_clearcoatRoughnessSampler?: Texture | null; // #ifdef HAS_CLEARCOATROUGHNESSMAP
  pbr_clearcoatNormalSampler?: Texture | null; // #ifdef HAS_CLEARCOATNORMALMAP
  pbr_sheenColorSampler?: Texture | null; // #ifdef HAS_SHEENCOLORMAP
  pbr_sheenRoughnessSampler?: Texture | null; // #ifdef HAS_SHEENROUGHNESSMAP
  pbr_iridescenceSampler?: Texture | null; // #ifdef HAS_IRIDESCENCEMAP
  pbr_iridescenceThicknessSampler?: Texture | null; // #ifdef HAS_IRIDESCENCETHICKNESSMAP
  pbr_anisotropySampler?: Texture | null; // #ifdef HAS_ANISOTROPYMAP
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

  // glTF material extensions
  specularColorFactor?: Readonly<Vector3 | NumberArray3>;
  specularIntensityFactor?: number;
  specularColorMapEnabled?: boolean;
  specularIntensityMapEnabled?: boolean;

  ior?: number;

  transmissionFactor?: number;
  transmissionMapEnabled?: boolean;

  thicknessFactor?: number;
  attenuationDistance?: number;
  attenuationColor?: Readonly<Vector3 | NumberArray3>;

  clearcoatFactor?: number;
  clearcoatRoughnessFactor?: number;
  clearcoatMapEnabled?: boolean;
  clearcoatRoughnessMapEnabled?: boolean;

  sheenColorFactor?: Readonly<Vector3 | NumberArray3>;
  sheenRoughnessFactor?: number;
  sheenColorMapEnabled?: boolean;
  sheenRoughnessMapEnabled?: boolean;

  iridescenceFactor?: number;
  iridescenceIor?: number;
  iridescenceThicknessRange?: Readonly<Vector2 | NumberArray2>;
  iridescenceMapEnabled?: boolean;

  anisotropyStrength?: number;
  anisotropyRotation?: number;
  anisotropyDirection?: Readonly<Vector2 | NumberArray2>;
  anisotropyMapEnabled?: boolean;

  emissiveStrength?: number;

  baseColorUVSet?: number;
  baseColorUVTransform?: Readonly<NumberArray9 | Matrix3>;
  metallicRoughnessUVSet?: number;
  metallicRoughnessUVTransform?: Readonly<NumberArray9 | Matrix3>;
  normalUVSet?: number;
  normalUVTransform?: Readonly<NumberArray9 | Matrix3>;
  occlusionUVSet?: number;
  occlusionUVTransform?: Readonly<NumberArray9 | Matrix3>;
  emissiveUVSet?: number;
  emissiveUVTransform?: Readonly<NumberArray9 | Matrix3>;
  specularColorUVSet?: number;
  specularColorUVTransform?: Readonly<NumberArray9 | Matrix3>;
  specularIntensityUVSet?: number;
  specularIntensityUVTransform?: Readonly<NumberArray9 | Matrix3>;
  transmissionUVSet?: number;
  transmissionUVTransform?: Readonly<NumberArray9 | Matrix3>;
  thicknessUVSet?: number;
  thicknessUVTransform?: Readonly<NumberArray9 | Matrix3>;
  clearcoatUVSet?: number;
  clearcoatUVTransform?: Readonly<NumberArray9 | Matrix3>;
  clearcoatRoughnessUVSet?: number;
  clearcoatRoughnessUVTransform?: Readonly<NumberArray9 | Matrix3>;
  clearcoatNormalUVSet?: number;
  clearcoatNormalUVTransform?: Readonly<NumberArray9 | Matrix3>;
  sheenColorUVSet?: number;
  sheenColorUVTransform?: Readonly<NumberArray9 | Matrix3>;
  sheenRoughnessUVSet?: number;
  sheenRoughnessUVTransform?: Readonly<NumberArray9 | Matrix3>;
  iridescenceUVSet?: number;
  iridescenceUVTransform?: Readonly<NumberArray9 | Matrix3>;
  iridescenceThicknessUVSet?: number;
  iridescenceThicknessUVTransform?: Readonly<NumberArray9 | Matrix3>;
  anisotropyUVSet?: number;
  anisotropyUVTransform?: Readonly<NumberArray9 | Matrix3>;
};

export type PBRMaterialProps = PBRMaterialBindings & PBRMaterialUniforms;

/**
 * An implementation of PBR (Physically-Based Rendering).
 * Physically Based Shading of a microfacet surface defined by a glTF material.
 */
export const pbrMaterial = {
  props: {} as PBRMaterialProps,
  uniforms: {} as PBRMaterialUniforms,
  defaultUniforms: {
    unlit: false,

    baseColorMapEnabled: false,
    baseColorFactor: [1, 1, 1, 1],

    normalMapEnabled: false,
    normalScale: 1,

    emissiveMapEnabled: false,
    emissiveFactor: [0, 0, 0],

    metallicRoughnessValues: [1, 1],
    metallicRoughnessMapEnabled: false,

    occlusionMapEnabled: false,
    occlusionStrength: 1,

    alphaCutoffEnabled: false,
    alphaCutoff: 0.5,

    IBLenabled: false,
    scaleIBLAmbient: [1, 1],

    scaleDiffBaseMR: [0, 0, 0, 0],
    scaleFGDSpec: [0, 0, 0, 0],

    specularColorFactor: [1, 1, 1],
    specularIntensityFactor: 1,
    specularColorMapEnabled: false,
    specularIntensityMapEnabled: false,

    ior: 1.5,

    transmissionFactor: 0,
    transmissionMapEnabled: false,

    thicknessFactor: 0,
    attenuationDistance: 1e9,
    attenuationColor: [1, 1, 1],

    clearcoatFactor: 0,
    clearcoatRoughnessFactor: 0,
    clearcoatMapEnabled: false,
    clearcoatRoughnessMapEnabled: false,

    sheenColorFactor: [0, 0, 0],
    sheenRoughnessFactor: 0,
    sheenColorMapEnabled: false,
    sheenRoughnessMapEnabled: false,

    iridescenceFactor: 0,
    iridescenceIor: 1.3,
    iridescenceThicknessRange: [100, 400],
    iridescenceMapEnabled: false,

    anisotropyStrength: 0,
    anisotropyRotation: 0,
    anisotropyDirection: [1, 0],
    anisotropyMapEnabled: false,

    emissiveStrength: 1,

    baseColorUVSet: 0,
    baseColorUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    metallicRoughnessUVSet: 0,
    metallicRoughnessUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    normalUVSet: 0,
    normalUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    occlusionUVSet: 0,
    occlusionUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    emissiveUVSet: 0,
    emissiveUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    specularColorUVSet: 0,
    specularColorUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    specularIntensityUVSet: 0,
    specularIntensityUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    transmissionUVSet: 0,
    transmissionUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    thicknessUVSet: 0,
    thicknessUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    clearcoatUVSet: 0,
    clearcoatUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    clearcoatRoughnessUVSet: 0,
    clearcoatRoughnessUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    clearcoatNormalUVSet: 0,
    clearcoatNormalUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    sheenColorUVSet: 0,
    sheenColorUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    sheenRoughnessUVSet: 0,
    sheenRoughnessUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    iridescenceUVSet: 0,
    iridescenceUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    iridescenceThicknessUVSet: 0,
    iridescenceThicknessUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    anisotropyUVSet: 0,
    anisotropyUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
  } as Required<PBRMaterialUniforms>,

  name: 'pbrMaterial',
  firstBindingSlot: 0,
  bindingLayout: [
    {name: 'pbrMaterial', group: 3},
    {name: 'pbr_baseColorSampler', group: 3},
    {name: 'pbr_normalSampler', group: 3},
    {name: 'pbr_emissiveSampler', group: 3},
    {name: 'pbr_metallicRoughnessSampler', group: 3},
    {name: 'pbr_occlusionSampler', group: 3},
    {name: 'pbr_specularColorSampler', group: 3},
    {name: 'pbr_specularIntensitySampler', group: 3},
    {name: 'pbr_transmissionSampler', group: 3},
    {name: 'pbr_thicknessSampler', group: 3},
    {name: 'pbr_clearcoatSampler', group: 3},
    {name: 'pbr_clearcoatRoughnessSampler', group: 3},
    {name: 'pbr_clearcoatNormalSampler', group: 3},
    {name: 'pbr_sheenColorSampler', group: 3},
    {name: 'pbr_sheenRoughnessSampler', group: 3},
    {name: 'pbr_iridescenceSampler', group: 3},
    {name: 'pbr_iridescenceThicknessSampler', group: 3},
    {name: 'pbr_anisotropySampler', group: 3}
  ],
  dependencies: [lighting, ibl, pbrProjection],
  source,
  vs,
  fs,

  defines: {
    LIGHTING_FRAGMENT: true,
    HAS_NORMALMAP: false,
    HAS_EMISSIVEMAP: false,
    HAS_OCCLUSIONMAP: false,
    HAS_BASECOLORMAP: false,
    HAS_METALROUGHNESSMAP: false,
    HAS_SPECULARCOLORMAP: false,
    HAS_SPECULARINTENSITYMAP: false,
    HAS_TRANSMISSIONMAP: false,
    HAS_THICKNESSMAP: false,
    HAS_CLEARCOATMAP: false,
    HAS_CLEARCOATROUGHNESSMAP: false,
    HAS_CLEARCOATNORMALMAP: false,
    HAS_SHEENCOLORMAP: false,
    HAS_SHEENROUGHNESSMAP: false,
    HAS_IRIDESCENCEMAP: false,
    HAS_IRIDESCENCETHICKNESSMAP: false,
    HAS_ANISOTROPYMAP: false,
    USE_MATERIAL_EXTENSIONS: false,
    ALPHA_CUTOFF: false,
    USE_IBL: false,
    PBR_DEBUG: false
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

    specularColorFactor: 'vec3<f32>',
    specularIntensityFactor: 'f32',
    specularColorMapEnabled: 'i32',
    specularIntensityMapEnabled: 'i32',

    ior: 'f32',

    transmissionFactor: 'f32',
    transmissionMapEnabled: 'i32',

    thicknessFactor: 'f32',
    attenuationDistance: 'f32',
    attenuationColor: 'vec3<f32>',

    clearcoatFactor: 'f32',
    clearcoatRoughnessFactor: 'f32',
    clearcoatMapEnabled: 'i32',
    clearcoatRoughnessMapEnabled: 'i32',

    sheenColorFactor: 'vec3<f32>',
    sheenRoughnessFactor: 'f32',
    sheenColorMapEnabled: 'i32',
    sheenRoughnessMapEnabled: 'i32',

    iridescenceFactor: 'f32',
    iridescenceIor: 'f32',
    iridescenceThicknessRange: 'vec2<f32>',
    iridescenceMapEnabled: 'i32',

    anisotropyStrength: 'f32',
    anisotropyRotation: 'f32',
    anisotropyDirection: 'vec2<f32>',
    anisotropyMapEnabled: 'i32',

    emissiveStrength: 'f32',

    // IBL
    IBLenabled: 'i32',
    scaleIBLAmbient: 'vec2<f32>', // #ifdef USE_IBL

    // debugging flags used for shader output of intermediate PBR variables
    // #ifdef PBR_DEBUG
    scaleDiffBaseMR: 'vec4<f32>',
    scaleFGDSpec: 'vec4<f32>',

    baseColorUVSet: 'i32',
    baseColorUVTransform: 'mat3x3<f32>',
    metallicRoughnessUVSet: 'i32',
    metallicRoughnessUVTransform: 'mat3x3<f32>',
    normalUVSet: 'i32',
    normalUVTransform: 'mat3x3<f32>',
    occlusionUVSet: 'i32',
    occlusionUVTransform: 'mat3x3<f32>',
    emissiveUVSet: 'i32',
    emissiveUVTransform: 'mat3x3<f32>',
    specularColorUVSet: 'i32',
    specularColorUVTransform: 'mat3x3<f32>',
    specularIntensityUVSet: 'i32',
    specularIntensityUVTransform: 'mat3x3<f32>',
    transmissionUVSet: 'i32',
    transmissionUVTransform: 'mat3x3<f32>',
    thicknessUVSet: 'i32',
    thicknessUVTransform: 'mat3x3<f32>',
    clearcoatUVSet: 'i32',
    clearcoatUVTransform: 'mat3x3<f32>',
    clearcoatRoughnessUVSet: 'i32',
    clearcoatRoughnessUVTransform: 'mat3x3<f32>',
    clearcoatNormalUVSet: 'i32',
    clearcoatNormalUVTransform: 'mat3x3<f32>',
    sheenColorUVSet: 'i32',
    sheenColorUVTransform: 'mat3x3<f32>',
    sheenRoughnessUVSet: 'i32',
    sheenRoughnessUVTransform: 'mat3x3<f32>',
    iridescenceUVSet: 'i32',
    iridescenceUVTransform: 'mat3x3<f32>',
    iridescenceThicknessUVSet: 'i32',
    iridescenceThicknessUVTransform: 'mat3x3<f32>',
    anisotropyUVSet: 'i32',
    anisotropyUVTransform: 'mat3x3<f32>'
  }
} as const satisfies ShaderModule<PBRMaterialProps, PBRMaterialUniforms, PBRMaterialBindings>;
