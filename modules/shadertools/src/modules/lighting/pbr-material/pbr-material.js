// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { lighting } from '../lights/lighting';
import { vs, fs } from './pbr-material-glsl';
import { source } from './pbr-material-wgsl';
import { pbrProjection } from './pbr-projection';
/**
 * An implementation of PBR (Physically-Based Rendering).
 * Physically Based Shading of a microfacet surface defined by a glTF material.
 */
export const pbrMaterial = {
    props: {},
    uniforms: {},
    name: 'pbrMaterial',
    dependencies: [lighting, pbrProjection],
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
        HAS_CLEARCOATMAP: false,
        HAS_SHEENCOLORMAP: false,
        HAS_IRIDESCENCEMAP: false,
        HAS_ANISOTROPYMAP: false,
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
        // IBL
        IBLenabled: 'i32',
        scaleIBLAmbient: 'vec2<f32>', // #ifdef USE_IBL
        // debugging flags used for shader output of intermediate PBR variables
        // #ifdef PBR_DEBUG
        scaleDiffBaseMR: 'vec4<f32>',
        scaleFGDSpec: 'vec4<f32>',
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
        sheenColorFactor: 'vec3<f32>',
        sheenRoughnessFactor: 'f32',
        sheenColorMapEnabled: 'i32',
        iridescenceFactor: 'f32',
        iridescenceIor: 'f32',
        iridescenceThicknessRange: 'vec2<f32>',
        iridescenceMapEnabled: 'i32',
        anisotropyStrength: 'f32',
        anisotropyRotation: 'f32',
        anisotropyDirection: 'vec2<f32>',
        anisotropyMapEnabled: 'i32',
        emissiveStrength: 'f32'
    }
};
