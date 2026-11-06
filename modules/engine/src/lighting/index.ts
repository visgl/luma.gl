// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  createPrefilteredEnvironment,
  PrefilteredEnvironmentGenerator,
  PrefilteredEnvironment
} from './prefiltered-environment';
export type {
  PrefilteredEnvironmentOptions,
  PrefilteredEnvironmentTextures
} from './prefiltered-environment';
export {createAreaLightLTCTextures} from './ltc-textures';

export {
  createPBRMaterial,
  createPBRMaterialFactory,
  getPBRMaterialMapUniforms
} from './pbr-material';
export type {CreatePBRMaterialOptions, PBRMaterial, PBRMaterialResources} from './pbr-material';
export {getPBREnvironmentBindings, getPBREnvironmentUniforms} from './pbr-environment';
export type {PBRLightingEnvironment, PBRLightingEnvironmentOptions} from './pbr-environment';

export {
  createPBRModel,
  getPBRGeometryDefines,
  getPBRTextureDefines,
  getPBRModelWGSL,
  PBR_MODEL_WGSL_SHADER
} from './pbr-model';
export type {CreatePBRModelOptions, PBRModelShaderHooks} from './pbr-model';
