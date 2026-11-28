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
  shadowMapCapturePass,
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

export type {ContactShadowCompositeShaderPassOptions} from './contact-shadow-composite';
export {contactShadows} from './contact-shadow-composite';

export {ContactShadowPass, contactShadowVisibilityEffect} from './contact-shadow-pass';
export type {ContactShadowPassProps, ContactShadowRenderOptions} from './contact-shadow-pass';

export {
  ClusteredLightGrid,
  clusteredLightGridPipeline,
  CLUSTERED_POINT_LIGHT_LAYOUT,
  MAX_CLUSTERED_POINT_LIGHTS,
  DEFAULT_CLUSTER_DIMENSIONS,
  DEFAULT_MAX_LIGHTS_PER_CLUSTER
} from './clustered-light-grid';
export type {
  ClusteredLightGridProps,
  ClusteredLightGridEncodeOptions,
  ClusteredLightGridBindings,
  ClusteredLightGridUniforms,
  ClusteredLightGridShaderPassUniforms
} from './clustered-light-grid';
export {AmbientOcclusionPass, ambientOcclusionVisibilityEffect} from './ambient-occlusion-pass';
export type {
  AmbientOcclusionMode,
  AmbientOcclusionVisibilityOptions,
  AmbientOcclusionPassProps,
  AmbientOcclusionRenderOptions
} from './ambient-occlusion-pass';

export {createPBRLightmapModel} from './pbr-model';
export type {CreatePBRLightmapModelOptions} from './pbr-model';
export {LightmapBaker, LightmapBakeResult} from './lightmap-baker';
export type {
  LightmapBakerProps,
  LightmapBakeOptions,
  LightmapBakeView,
  LightmapTextures
} from './lightmap-baker';
export {
  readLightmapData,
  createLightmapFromData,
  encodeLightmapData,
  decodeLightmapData
} from './lightmap-data';
export type {LightmapData} from './lightmap-data';
export {sampleLightmapEnvironment} from './lightmap-environment';
export type {LightmapEnvironment, LightmapEnvironmentSample} from './lightmap-environment';

export {ReflectionProbe} from './reflection-probe';
export type {
  ReflectionProbeProps,
  ReflectionProbeUpdate,
  ReflectionProbeView
} from './reflection-probe';
export {
  createLightmapAtlas,
  validateLightmapAtlas,
  getLightmapAtlasDebugData
} from './lightmap-atlas';
export type {
  LightmapAtlas,
  LightmapAtlasInput,
  LightmapAtlasOptions,
  LightmapAtlasChart
} from './lightmap-atlas';

export {CORTAOPass} from './cortao/cortao-pass';
export type {CORTAOPassProps, CORTAORenderOptions} from './cortao/cortao-pass';
export type {CORTAOCamera} from './cortao/cortao-parameters';
export type {CORTAORayCount} from './cortao/cortao-occluder-lookup-table';
