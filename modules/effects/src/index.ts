// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
export type {SepiaProps, SepiaUniforms} from './passes/postprocessing/image-adjust-filters/sepia';
export {sepia} from './passes/postprocessing/image-adjust-filters/sepia';
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
  TiltShiftProps,
  TiltShiftUniforms
} from './passes/postprocessing/image-blur-filters/tiltshift';
export {tiltShift} from './passes/postprocessing/image-blur-filters/tiltshift';
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
export type {BloomProps, BloomUniforms} from './passes/postprocessing/image-blur-filters/bloom';
export {bloom} from './passes/postprocessing/image-blur-filters/bloom';

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
export {fxaa} from './passes/postprocessing/fxaa/fxaa';

// experimental modules
export type {WarpProps, WarpUniforms} from './passes/postprocessing/image-warp-filters/warp';
export {warp as _warp} from './passes/postprocessing/image-warp-filters/warp';
