// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type {
  CreatePBRMaterialOptions,
  PBRMaterial,
  PBRMaterialResources
} from './engine/pbr-material';
export {
  createPBRMaterial,
  createPBRMaterialFactory,
  getPBRMaterialMapUniforms
} from './engine/pbr-material';
export type {CreatePBRModelOptions} from './engine/pbr-model';
export {createPBRModel, getPBRGeometryDefines, getPBRTextureDefines} from './engine/pbr-model';
export type {
  PreparedScene,
  RayTracingGraphStageStatistics,
  RayTracingGraphStatistics,
  SceneAlphaMode,
  SceneCamera,
  SceneEnvironment,
  SceneMaterial,
  SceneRenderOptions,
  SceneRenderStatistics,
  SceneSurface
} from './engine/scene-renderer';
export {getSceneAlphaMode, SceneRenderer} from './engine/scene-renderer';
export {SelectionOutline, type SelectionOutlineOptions} from './rendering/selection-outline';
export {DeferredSceneRenderer, supportsDeferredScene} from './engine/deferred-scene-renderer';
export type {
  RayTracingImageRegion,
  RayTracingScenePickResult,
  RayTracingSceneChannels,
  RayTracingScenePrimitive,
  RayTracingSceneRenderOptions
} from './engine/ray-tracing-scene-renderer';
export {RayTracingSceneRenderer} from './engine/ray-tracing-scene-renderer';
export {
  getRayTracingSceneCapabilities,
  type RayTracingSceneCapabilities,
  type RayTracingDebugView
} from './engine/ray-tracing-scene-capabilities';
export type {PreparePBREnvironmentOptions} from './engine/pbr-environment';
export {
  PBREnvironmentGenerator,
  PreparedPBREnvironment,
  preparePBREnvironment
} from './engine/pbr-environment';
export type {
  ABufferShaderModuleBindings,
  ABufferShaderModuleProps,
  ABufferShaderModuleUniforms
} from './oit/a-buffer';
export {aBuffer, aBufferPlugin} from './oit/a-buffer';
export type {
  ABufferResolveProps,
  ABufferResolveCompositeShaderPassOptions
} from './oit/a-buffer-resolve-composite-shader-pass';
export {createABufferResolveCompositeShaderPass} from './oit/a-buffer-resolve-composite-shader-pass';
export type {
  ABufferCaptureContext,
  ABufferRenderOptions,
  ABufferRendererProps,
  ABufferSlicePlan,
  ABufferSupport
} from './oit/a-buffer-renderer';
export {
  ABufferRenderer,
  getABufferSlicePlan,
  getABufferSupport
} from './oit/a-buffer-renderer';
export type {WBOITPass, WBOITShaderModuleProps, WBOITShaderModuleUniforms} from './oit/wboit';
export {wboit, wboitPlugin} from './oit/wboit';
export type {WBOITResolveBindings} from './oit/wboit-resolve-composite-shader-pass';
export {
  createWBOITResolveCompositeShaderPass,
  wboitResolve
} from './oit/wboit-resolve-composite-shader-pass';
export type {
  WBOITCapture,
  WBOITCaptureContext,
  WBOITCaptureOptions,
  WBOITRenderOptions,
  WBOITRendererProps,
  WBOITSupport
} from './oit/wboit-renderer';
export {getWBOITSupport, WBOITRenderer} from './oit/wboit-renderer';
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
} from './shadows/shadow-map-renderer';
export {ShadowMapRenderer} from './shadows/shadow-map-renderer';
export {shadow} from './shadows/shadow';
export type {ContactShadowProps} from './shadows/contact-shadow';
export {createContactShadowCompositeShaderPass} from './shadows/contact-shadow';
export type {
  GBufferExtraColorAttachment,
  GBufferProps,
  GBufferShaderPassBindings
} from './rendering/g-buffer';
export {GBuffer} from './rendering/g-buffer';
export type {DeferredAmbientLightingProps} from './rendering/deferred-ambient-lighting';
export {
  createDeferredAmbientLightingCompositeShaderPass,
  deferredAmbientLighting
} from './rendering/deferred-ambient-lighting';
export type {DeferredLightingProps, DeferredPointLight} from './rendering/deferred-lighting';
export {
  createDeferredLightingCompositeShaderPass,
  deferredLighting,
  makeDeferredPointLightBufferData,
  MAX_DEFERRED_POINT_LIGHTS
} from './rendering/deferred-lighting';
export type {
  ClusteredDeferredLightingProps,
  ClusteredLightGridBindings,
  ClusteredLightGridEncodeOptions,
  ClusteredLightGridProps,
  ClusteredLightGridShaderPassUniforms
} from './rendering/clustered-lighting';
export {
  ClusteredLightGrid,
  clusteredDeferredLighting,
  createClusteredDeferredLightingCompositeShaderPass,
  DEFAULT_CLUSTER_DIMENSIONS,
  DEFAULT_MAX_LIGHTS_PER_CLUSTER,
  MAX_CLUSTERED_POINT_LIGHTS
} from './rendering/clustered-lighting';
export type {
  SpectralCausticsBindings,
  SpectralCausticsProps,
  SpectralCausticsUniforms
} from './rendering/spectral-caustics';
export {
  convertD65XYZToLinearSRGB,
  D65_XYZ_TO_LINEAR_SRGB_MATRIX,
  spectralCaustics
} from './rendering/spectral-caustics';
export type {
  SpectralCausticsCaptureFace,
  SpectralCausticsDrawContext,
  SpectralCausticsPrepareContext,
  SpectralCausticsRendererEncodeOptions,
  SpectralCausticsRendererProps,
  SpectralCausticsSupport
} from './rendering/spectral-caustics-renderer';
export {
  getSpectralCausticsSupport,
  SpectralCausticsRenderer
} from './rendering/spectral-caustics-renderer';
export type {
  StructuredVolumeBounds,
  StructuredVolumeBufferBinding,
  StructuredVolumeDimensions,
  StructuredVolumeGlyphStyle,
  StructuredVolumeRendererPrepareOptions,
  StructuredVolumeRendererProps,
  StructuredVolumeScalarSource,
  StructuredVolumeScalarStyle,
  StructuredVolumeSources,
  StructuredVolumeSupport,
  StructuredVolumeVectorSource,
  StructuredVolumeVectorStyle
} from './rendering/structured-volume-renderer';
export {
  getStructuredVolumeSupport,
  makeStructuredVolumeUniformData,
  StructuredVolumeRenderer
} from './rendering/structured-volume-renderer';
export {DepthTextureCopy} from './rendering/depth-texture-copy';
export {
  getRayTracingQualityPreset,
  type RayTracingQualityPreset,
  type RayTracingQualitySettings
} from './engine/ray-tracing-quality-presets';
export {
  exportRayTracingImage,
  iterateRayTracingImageTiles
} from './engine/ray-tracing-image-export';
export type {
  RayTracingImageExportOptions,
  RayTracingImageTile,
  RayTracingImageTileRegion
} from './engine/ray-tracing-image-export';
