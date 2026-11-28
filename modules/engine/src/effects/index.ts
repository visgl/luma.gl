// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// POST PROCESSING / SHADER PASS MODULES

// glfx image adjustment shader modules
export type {
  BrightnessContrastProps,
  BrightnessContrastUniforms
} from './passes/postprocessing/image-adjust-filters/brightnesscontrast';
export {brightnessContrast} from './passes/postprocessing/image-adjust-filters/brightnesscontrast';
export type {
  DenoiseProps,
  DenoiseUniforms
} from './passes/postprocessing/image-adjust-filters/denoise';
export {denoise} from './passes/postprocessing/image-adjust-filters/denoise';
export type {
  HueSaturationProps,
  HueSaturationUniforms
} from './passes/postprocessing/image-adjust-filters/huesaturation';
export {hueSaturation} from './passes/postprocessing/image-adjust-filters/huesaturation';
export type {NoiseProps, NoiseUniforms} from './passes/postprocessing/image-adjust-filters/noise';
export {noise} from './passes/postprocessing/image-adjust-filters/noise';
export {persistenceEffect} from './passes/postprocessing/image-adjust-filters/persistence';
export type {SepiaProps, SepiaUniforms} from './passes/postprocessing/image-adjust-filters/sepia';
export {sepia} from './passes/postprocessing/image-adjust-filters/sepia';
export type {
  ToneMappingProps,
  ToneMappingUniforms
} from './passes/postprocessing/image-adjust-filters/tone-mapping';
export {
  toneMapping,
  toneMappingEffect
} from './passes/postprocessing/image-adjust-filters/tone-mapping';
export type {
  VibranceProps,
  VibranceUniforms
} from './passes/postprocessing/image-adjust-filters/vibrance';
export {vibrance} from './passes/postprocessing/image-adjust-filters/vibrance';
export type {
  VignetteProps,
  VignetteUniforms
} from './passes/postprocessing/image-adjust-filters/vignette';
export {vignette} from './passes/postprocessing/image-adjust-filters/vignette';

// glfx  BLUR shader modules
export type {
  GaussianBlurProps,
  GaussianBlurUniforms
} from './passes/postprocessing/image-blur-filters/gaussianblur';
export {gaussianBlur} from './passes/postprocessing/image-blur-filters/gaussianblur';
export type {
  TiltShiftProps,
  TiltShiftUniforms
} from './passes/postprocessing/image-blur-filters/tiltshift';
export {tiltShift} from './passes/postprocessing/image-blur-filters/tiltshift';
export type {
  BloomProps,
  BloomUniforms
} from './passes/postprocessing/image-blur-filters/bloom';
export {bloom} from './passes/postprocessing/image-blur-filters/bloom';
export type {
  BloomLensEffectsOptions,
  BloomCompositeShaderPassOptions
} from './passes/postprocessing/image-blur-filters/bloom-composite-shader-pass';
export {
  bloomLow,
  hdrBloom,
  multiscaleBloomEffect
} from './passes/postprocessing/image-blur-filters/bloom-composite-shader-pass';
export type {
  DofProps,
  DofUniforms
} from './passes/screen-space/dof';
export {
  dof,
  bokehDof,
  bokehDofEffect,
  depthOfField,
  dofCompositeShaderPass
} from './passes/screen-space/dof';
export type {
  TriangleBlurProps,
  TriangleBlurUniforms
} from './passes/postprocessing/image-blur-filters/triangleblur';
export {triangleBlur} from './passes/postprocessing/image-blur-filters/triangleblur';
export type {
  ZoomBlurProps,
  ZoomBlurUniforms
} from './passes/postprocessing/image-blur-filters/zoomblur';
export {zoomBlur} from './passes/postprocessing/image-blur-filters/zoomblur';

// glfx FUN shader modules
export type {
  ColorHalftoneProps,
  ColorHalftoneUniforms
} from './passes/postprocessing/image-fun-filters/colorhalftone';
export {colorHalftone} from './passes/postprocessing/image-fun-filters/colorhalftone';
export type {
  DotScreenProps,
  DotScreenUniforms
} from './passes/postprocessing/image-fun-filters/dotscreen';
export {dotScreen} from './passes/postprocessing/image-fun-filters/dotscreen';
export type {
  EdgeWorkProps,
  EdgeWorkUniforms
} from './passes/postprocessing/image-fun-filters/edgework';
export {edgeWork} from './passes/postprocessing/image-fun-filters/edgework';
export type {
  HexagonalPixelateProps,
  HexagonalPixelateUniforms
} from './passes/postprocessing/image-fun-filters/hexagonalpixelate';
export {hexagonalPixelate} from './passes/postprocessing/image-fun-filters/hexagonalpixelate';
export type {InkProps, InkUniforms} from './passes/postprocessing/image-fun-filters/ink';
export {ink} from './passes/postprocessing/image-fun-filters/ink';
export type {
  MagnifyProps,
  MagnifyUniforms
} from './passes/postprocessing/image-fun-filters/magnify';
export {magnify} from './passes/postprocessing/image-fun-filters/magnify';

// glfx  WARP shader modules
export type {
  BulgePinchProps,
  BulgePinchUniforms
} from './passes/postprocessing/image-warp-filters/bulgepinch';
export {bulgePinch} from './passes/postprocessing/image-warp-filters/bulgepinch';
export type {SwirlProps, SwirlUniforms} from './passes/postprocessing/image-warp-filters/swirl';
export {swirl} from './passes/postprocessing/image-warp-filters/swirl';

// Postprocessing modules
// export type {FXAAProps, FXAAUniforms} from './passes/postprocessing/fxaa/fxaa';
export {fxaa, fxaaEffect} from './passes/postprocessing/fxaa/fxaa';

// experimental modules
export type {WarpProps, WarpUniforms} from './passes/postprocessing/image-warp-filters/warp';
export {warp as _warp} from './passes/postprocessing/image-warp-filters/warp';

// Screen-space effects
export type {ClusteredVolumetricLightingCompositeShaderPassOptions} from './passes/screen-space/clustered-volumetric-lighting';
export {
  clusteredVolumetricComposite,
  clusteredVolumetricDepthHistoryCopy,
  clusteredVolumetricTemporal,
  clusteredVolumetricTrace
} from './passes/screen-space/clustered-volumetric-lighting';
export type {CameraReprojectionTAAUniforms} from './passes/screen-space/camera-reprojection-temporal-antialiasing';
export {
  cameraReprojectionTaaDepthHistoryCopy,
  cameraReprojectionTaaResolve,
  cameraReprojectionTaa
} from './passes/screen-space/camera-reprojection-temporal-antialiasing';
export type {DepthAwareBlurProps} from './passes/screen-space/depth-aware-blur';
export {
  depthAwareBlur,
  depthAwareBlurCompositeShaderPass,
  depthAwareBlurEffect
} from './passes/screen-space/depth-aware-blur';
export type {HDRAutoExposureCompositeShaderPassOptions} from './passes/screen-space/hdr-auto-exposure';
export {
  hdrAutoExposureAdapt,
  hdrAutoExposureApply,
  hdrLuminanceExtract,
  hdrLuminanceReduce
} from './passes/screen-space/hdr-auto-exposure';
export {motionBlur} from './passes/screen-space/motion-blur';
export type {GTAOCompositeShaderPassOptions} from './passes/screen-space/gtao';
export {
  gtaoAmbientComposite,
  gtaoComposite,
  gtaoDepthHistoryCopy,
  gtaoEvaluate,
  gtaoTemporal
} from './passes/screen-space/gtao';
export type {OutlineCompositeShaderPassOptions} from './passes/screen-space/outlines';

export type {SSGICompositeShaderPassOptions} from './passes/screen-space/screen-space-global-illumination';
export {
  ssgiComposite,
  ssgiDepthHistoryCopy,
  ssgiSpatial,
  ssgiTemporal,
  ssgiTrace
} from './passes/screen-space/screen-space-global-illumination';
export type {
  SSRCompositeShaderPassOptions,
  SSRQuality
} from './passes/screen-space/screen-space-reflections';
export {
  SSR_QUALITY_PRESETS,
  ssrComposite,
  ssrDepthHistoryCopy,
  ssrSpatial,
  ssrTemporal,
  ssrTrace
} from './passes/screen-space/screen-space-reflections';
export type {SSAOCompositeShaderPassOptions} from './passes/screen-space/ssao';
export {ssao, ssaoEffect} from './passes/screen-space/ssao';
export {taa} from './passes/screen-space/temporal-antialiasing';

export {
  ssrCameraTemporal,
  ssrNormalHistoryCopy,
  ssrCameraDepthHistoryCopy
} from './passes/screen-space/ssr-camera-temporal';
export type {SSRCameraTemporalUniforms} from './passes/screen-space/ssr-camera-temporal';
export {heightFog, heightFogPass} from './passes/screen-space/height-fog';
export type {HeightFogPassProps, HeightFogPassUniforms} from './passes/screen-space/height-fog';
export type {VolumetricFogCompositeShaderPassOptions} from './passes/screen-space/volumetric-fog';
export {
  selectionOutline,
  selectionOutlineEffect,
  type SelectionOutlineProps,
  type SelectionOutlineUniforms
} from './passes/screen-space/selection-outline';

// Fullscreen definitions for the glfx filter catalog.
export {
  brightnessContrastEffect,
  denoiseEffect,
  hueSaturationEffect,
  noiseEffect,
  persistence,
  sepiaEffect,
  vibranceEffect,
  vignetteEffect,
  bloomEffect,
  gaussianBlurEffect,
  tiltShiftEffect,
  triangleBlurEffect,
  zoomBlurEffect,
  colorHalftoneEffect,
  dotScreenEffect,
  edgeWorkEffect,
  hexagonalPixelateEffect,
  inkEffect,
  magnifyEffect,
  bulgePinchEffect,
  swirlEffect
} from './glfx-effects';

// Configurable fullscreen effects.
export {outlines} from './passes/screen-space/outlines';
export {gtao} from './passes/screen-space/gtao';
export {ssr} from './passes/screen-space/screen-space-reflections';
export {ssgi} from './passes/screen-space/screen-space-global-illumination';
export {hdrAutoExposure} from './passes/screen-space/hdr-auto-exposure';
export {clusteredVolumetricLighting} from './passes/screen-space/clustered-volumetric-lighting';
export {volumetricFog} from './passes/screen-space/volumetric-fog';
export {contactShadows} from '../lighting/contact-shadow-composite';

export type {TemporalFrameJitter, TemporalJitter} from './passes/screen-space/temporal-frame';
export * from './temporal-upscale/index';

export {
  GPUEffectOperation,
  appendEffects,
  createEffectRenderOperation,
  effectOperationLowering
} from './graph/gpu-effect-operation';
export type {
  EffectRenderOperationProps,
  GPUEffectEntries,
  GPUEffectOperationProps
} from './graph/gpu-effect-operation';

export {addGraphTAA} from './graph/gpu-effect-operation';
export type {GraphTAAProps} from './graph/gpu-effect-operation';
export {importTemporalGraphHistory} from './graph/temporal-graph-history';
export type {TemporalGraphHistory} from './graph/temporal-graph-history';
export type {TemporalFrame} from './passes/screen-space/temporal-frame';
