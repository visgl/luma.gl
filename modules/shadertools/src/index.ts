// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// shadertools exports

/**
 * Marks GLSL shaders for syntax highlighting: glsl`...`
 * Install https://marketplace.visualstudio.com/items?itemName=boyswan.glsl-literal
 */
export type {PlatformInfo} from './lib/shader-assembly/platform-info';

// ShaderModules

export type {ShaderModule} from './lib/shader-module/shader-module';
export type {ShaderPass} from './lib/shader-module/shader-pass';

export {initializeShaderModule, initializeShaderModules} from './lib/shader-module/shader-module';
export {getShaderModuleUniforms} from './lib/shader-module/shader-module';
export {getShaderModuleDependencies} from './lib/shader-module/shader-module-dependencies';
export {checkShaderModuleDeprecations} from './lib/shader-module/shader-module';

export {getShaderModuleSource} from './lib/shader-assembly/assemble-shaders';

export {resolveModules as _resolveModules} from './lib/shader-module/shader-module-dependencies';
export {getDependencyGraph as _getDependencyGraph} from './lib/shader-module/shader-module-dependencies';

// ShaderAssembler
export {ShaderAssembler} from './lib/shader-assembler';
export type {ShaderHook} from './lib/shader-assembly/shader-hooks';
export type {ShaderInjection} from './lib/shader-assembly/shader-injections';

// SHADER HELPERS

// Shader source introspection
export {getShaderInfo} from './lib/glsl-utils/get-shader-info';
export {
  getQualifierDetails,
  getPassthroughFS,
  typeToChannelSuffix,
  typeToChannelCount,
  convertToVec4
} from './lib/glsl-utils/shader-utils';

// EXPERIMENTAL - Do not use in production applications
export type {ShaderGenerationOptions} from './lib/shader-generator/generate-shader';
export {generateShaderForModule} from './lib/shader-generator/generate-shader';
export {capitalize} from './lib/shader-generator/utils/capitalize';

// TEST EXPORTS - Do not use in production applications
export {preprocess} from './lib/preprocessor/preprocessor';
export {assembleGLSLShaderPair} from './lib/shader-assembly/assemble-shaders';
export {combineInjects} from './lib/shader-assembly/shader-injections';

// EXPERIMENTAL WGSL
export {getShaderLayoutFromWGSL} from './lib/wgsl/get-shader-layout-wgsl';

// data utils
export {toHalfFloat, fromHalfFloat} from './modules/math/fp16/fp16-utils';
export {fp64ify, fp64LowPart, fp64ifyMatrix4} from './modules/math/fp64/fp64-utils';

// math libraries
export {random} from './modules/math/random/random';

export {fp32} from './modules/math/fp32/fp32';
// export {fp64, fp64arithmetic} from './modules/math/fp64/fp64';

// engine shader modules

// // projection
// export type {ProjectionUniforms} from './modules/engine/project/project';
// export {projection} from './modules/engine/project/project';
export type {PickingProps, PickingUniforms} from './modules/engine/picking/picking';
export {picking} from './modules/engine/picking/picking';

// // lighting
export type {LightingProps, LightingUniforms} from './modules/lighting/lights/lighting';
export {lighting} from './modules/lighting/lights/lighting';
export {dirlight} from './modules/lighting/no-material/dirlight';
export type {PhongMaterialUniforms as GouraudMaterialUniforms} from './modules/lighting/phong-material/phong-material';
export {gouraudMaterial} from './modules/lighting/gouraud-material/gouraud-material';
export type {PhongMaterialUniforms} from './modules/lighting/phong-material/phong-material';
export {phongMaterial} from './modules/lighting/phong-material/phong-material';
// export type {PBRMaterialSettings, PBRMaterialUniforms} from './modules/lighting/pbr-material/pbr';
export {pbrMaterial} from './modules/lighting/pbr-material/pbr-material';

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

// DEPRECATED - v8 legacy shader modules (non-uniform buffer)

// math libraries
export {fp64, fp64arithmetic} from './modules-webgl1/math/fp64/fp64';

// projection and lighting
export {geometry as geometry1} from './modules-webgl1/geometry/geometry';
export {project as project1} from './modules-webgl1/project/project';

export {lights as lights1} from './modules-webgl1/lighting/lights/lights';
export {dirlight as dirlight1} from './modules-webgl1/lighting/dirlight/dirlight';
export {
  gouraudLighting,
  phongLighting
} from './modules-webgl1/lighting/phong-lighting/phong-lighting';
export {pbr} from './modules-webgl1/lighting/pbr/pbr';
