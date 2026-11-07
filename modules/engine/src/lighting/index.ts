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
  createPBRShadowModel,
  createPBRSurfaceModel,
  getPBRGeometryDefines,
  getPBRTextureDefines,
  getPBRModelWGSL,
  PBR_MODEL_WGSL_SHADER
} from './pbr-model';
export type {CreatePBRModelOptions, PBRModelShaderHooks} from './pbr-model';

export {
  ShadowMapRenderer,
  getDirectionalCascadeViews,
  getPointShadowViews,
  getPracticalCascadeSplits,
  getSpotShadowView
} from './shadow-map-renderer';
export type {
  DirectionalShadowLight,
  PointShadowFace,
  PointShadowLight,
  ShadowCamera,
  ShadowMapRendererProps,
  ShadowRenderOptions,
  ShadowRenderView,
  ShadowShaderProps,
  SpotShadowLight
} from './shadow-map-renderer';
export {SHADOW_QUALITY_SETTINGS} from './shadow-quality';
export type {ShadowQualitySettings} from './shadow-quality';

export {PBRSurfacePass} from './pbr-surface-pass';
export type {
  PBRSurfacePassProps,
  PBRSurfaceRenderOptions,
  PBRSurfaceRenderView
} from './pbr-surface-pass';

export {createContactShadowCompositeShaderPass} from './contact-shadow-composite';

export {ContactShadowPass} from './contact-shadow-pass';
export type {ContactShadowPassProps, ContactShadowRenderOptions} from './contact-shadow-pass';
