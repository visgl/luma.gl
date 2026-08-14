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
export {DeferredSceneRenderer, supportsDeferredScene} from './engine/deferred-scene-renderer';
export type {
  RayTracingScenePrimitive,
  RayTracingSceneRenderOptions
} from './engine/ray-tracing-scene-renderer';
export {RayTracingSceneRenderer} from './engine/ray-tracing-scene-renderer';
export type {PreparePBREnvironmentOptions} from './engine/pbr-environment';
export {
  PBREnvironmentGenerator,
  PreparedPBREnvironment,
  preparePBREnvironment
} from './engine/pbr-environment';

export {type TextureFormatPacked, RGBADecoder} from './textures/rgba-decoder';

export {TEXTURE_FORMAT_PIXEL_DECODERS} from './textures/packed-pixels';

export type {HTMLTextureProps} from './textures/html-texture';
export {HTMLTexture} from './textures/html-texture';

export {opticalLighting} from './materials/optical-lighting';
export type {
  OpticalCausticLens,
  OpticalCausticLensUniform,
  OpticalCausticsProps,
  OpticalCausticsUniforms
} from './materials/optical-caustics';
export {
  MAX_OPTICAL_CAUSTIC_LENSES,
  opticalCaustics,
  opticalCausticsPlugin
} from './materials/optical-caustics';
export type {
  OpticalPointLight,
  OpticalPointLightUniform,
  OpticalPointLightsProps,
  OpticalPointLightsUniforms
} from './materials/optical-point-lights';
export {
  MAX_OPTICAL_POINT_LIGHTS,
  opticalPointLights,
  opticalPointLightsPlugin
} from './materials/optical-point-lights';
export type {
  EmissiveMaterialProps,
  EmissiveMaterialUniforms
} from './materials/emissive-material';
export {emissiveMaterial, emissiveMaterialPlugin} from './materials/emissive-material';
export type {
  GlassMaterialBindings,
  GlassMaterialProps,
  GlassMaterialUniforms
} from './materials/glass-material';
export {glassMaterial, glassMaterialPlugin} from './materials/glass-material';
export type {
  GlassTransmissionBindings,
  GlassTransmissionProps,
  GlassTransmissionUniforms
} from './materials/glass-transmission';
export {glassTransmission, glassTransmissionPlugin} from './materials/glass-transmission';
export type {
  ReflectiveMaterialProps,
  ReflectiveMaterialUniforms
} from './materials/reflective-material';
export {reflectiveMaterial, reflectiveMaterialPlugin} from './materials/reflective-material';

export type {
  ABufferShaderModuleBindings,
  ABufferShaderModuleProps,
  ABufferShaderModuleUniforms
} from './oit/a-buffer';
export {aBuffer, aBufferPlugin} from './oit/a-buffer';
export type {
  ABufferResolveProps,
  ABufferResolveShaderPassPipelineOptions
} from './oit/a-buffer-resolve-shader-pass-pipeline';
export {createABufferResolveShaderPassPipeline} from './oit/a-buffer-resolve-shader-pass-pipeline';
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
export type {WBOITResolveBindings} from './oit/wboit-resolve-shader-pass-pipeline';
export {
  createWBOITResolveShaderPassPipeline,
  wboitResolve
} from './oit/wboit-resolve-shader-pass-pipeline';
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
export {createContactShadowShaderPassPipeline} from './shadows/contact-shadow';

export type {
  GBufferExtraColorAttachment,
  GBufferProps,
  GBufferShaderPassBindings
} from './rendering/g-buffer';
export {GBuffer} from './rendering/g-buffer';
export type {
  BloomPointSpreadFunction,
  BloomPointSpreadFunctionOptions,
  BloomSpectralPointSpreadFunction,
  GPUConvolutionBloomEncodeOptions,
  GPUConvolutionBloomLensOptions,
  GPUConvolutionBloomProps,
  GPUConvolutionBloomStats,
  GPUConvolutionBloomSupport
} from './rendering/fft-bloom';
export {
  getGPUConvolutionBloomSupport,
  GPUConvolutionBloom,
  makeBloomPointSpreadFunction,
  makeBloomSpectralPointSpreadFunction,
  makeGPUConvolutionBloomStats
} from './rendering/fft-bloom';
export type {DeferredAmbientLightingProps} from './rendering/deferred-ambient-lighting';
export {
  createDeferredAmbientLightingShaderPassPipeline,
  deferredAmbientLighting
} from './rendering/deferred-ambient-lighting';
export type {DeferredLightingProps, DeferredPointLight} from './rendering/deferred-lighting';
export {
  createDeferredLightingShaderPassPipeline,
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
  createClusteredDeferredLightingShaderPassPipeline,
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
  MLSMPMFluidFixedPointBounds,
  MLSMPMFluidForce,
  MLSMPMFluidSimulationProps,
  MLSMPMFluidSimulationStats,
  MLSMPMFluidSimulationStepOptions,
  MLSMPMFluidSimulationSupport,
  MLSMPMFluidStabilityOptions,
  MLSMPMParticle
} from './rendering/mls-mpm-fluid-simulation';
export {
  DEFAULT_MLS_MPM_FLUID_GRID_SIZE,
  DEFAULT_MLS_MPM_FLUID_PARTICLE_COUNT,
  getMLSMPMFluidFixedPointBounds,
  getMLSMPMFluidStableDeltaTime,
  getMLSMPMFluidSimulationSupport,
  MAX_MLS_MPM_FLUID_PARTICLE_COUNT,
  MAX_MLS_MPM_FLUID_SUBSTEPS_PER_ENCODE,
  MLS_MPM_FLUID_STAGE_ORDER,
  MLSMPMFluidSimulation
} from './rendering/mls-mpm-fluid-simulation';
export type {
  VolumetricFireEmitter,
  VolumetricFireSimulationBindings,
  VolumetricFireSimulationProps,
  VolumetricFireSimulationStepOptions
} from './rendering/volumetric-fire-simulation';
export {
  DEFAULT_VOLUMETRIC_FIRE_DIMENSIONS,
  DEFAULT_VOLUMETRIC_FIRE_PRESSURE_ITERATIONS,
  makeVolumetricFireSimulationUniformData,
  MAX_VOLUMETRIC_FIRE_EMITTERS,
  VolumetricFireSimulation
} from './rendering/volumetric-fire-simulation';

export type {ComparisonSplitterProps} from './controls/comparison-splitter';
export {ComparisonSplitter} from './controls/comparison-splitter';
export type {OrbitControlsProps, OrbitPosition} from './controls/orbit-controls';
export {OrbitControls} from './controls/orbit-controls';
export type {
  FlatControllerPick,
  FlatControllerProps,
  FlatViewState
} from './controls/flat-controller';
export {FlatController} from './controls/flat-controller';

export * from './webxr/index';

export * from './gpu-primitives/index';

export * from './simulation/index';
