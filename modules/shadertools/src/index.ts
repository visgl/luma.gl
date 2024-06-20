// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// shadertools exports

/**
 * Marks GLSL shaders for syntax highlighting: glsl`...`
 * Install https://marketplace.visualstudio.com/items?itemName=boyswan.glsl-literal
 */
export {glsl} from './lib/glsl-utils/highlight';

export type {PlatformInfo} from './lib/shader-assembly/platform-info';

export type {ShaderModule} from './lib/shader-module/shader-module';
export type {ShaderPass} from './lib/shader-module/shader-pass';
export type {ShaderHook} from './lib/shader-assembly/shader-hooks';
export type {ShaderInjection} from './lib/shader-assembly/shader-injections';
export {ShaderModuleInstance} from './lib/shader-module/shader-module-instance';

// ShaderAssembler
export {ShaderAssembler} from './lib/shader-assembler';

export {normalizeShaderModule} from './lib/shader-module/normalize-shader-module';

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
export {assembleShaderPairGLSL} from './lib/shader-assembly/assemble-shaders';
export {ShaderModuleInstance as _ShaderModuleInstance} from './lib/shader-module/shader-module-instance';
export {combineInjects} from './lib/shader-assembly/shader-injections';
export {resolveModules as _resolveModules} from './lib/shader-assembly/resolve-modules';
export {getDependencyGraph as _getDependencyGraph} from './lib/shader-assembly/resolve-modules';

// EXPERIMENTAL WGSL
export {getShaderLayoutFromWGSL} from './lib/wgsl/get-shader-layout-wgsl';

// SHADER MODULES - WEBGL1 VERSION

// utils

// math libraries
export {random} from './modules/math/random/random';
export {fp32} from './modules/math/fp32/fp32';
// export {fp64, fp64arithmetic} from './modules/math/fp64/fp64';

// engine shader modules

// // projection
// export type {ProjectionUniforms} from './modules/engine/project/project';
// export {projection} from './modules/engine/project/project';
export type {PickingProps} from './modules/engine/picking/picking';
export {picking} from './modules/engine/picking/picking';

// // lighting
export type {LightingProps} from './modules/lighting/lights/lighting-uniforms';
export {lighting} from './modules/lighting/lights/lighting-uniforms';
export {dirlight} from './modules/lighting/no-material/dirlight';
export type {PhongMaterialUniforms as GouraudMaterialUniforms} from './modules/lighting/phong-material/phong-material';
export {gouraudMaterial} from './modules/lighting/gouraud-material/gouraud-material';
export type {PhongMaterialUniforms} from './modules/lighting/phong-material/phong-material';
export {phongMaterial} from './modules/lighting/phong-material/phong-material';
// export type {PBRMaterialSettings, PBRMaterialUniforms} from './modules/lighting/pbr-material/pbr';
export {pbrMaterial} from './modules/lighting/pbr-material/pbr-material';

// POST PROCESSING / SHADER PASS MODULES

// glfx image adjustment shader modules
export type {BrightnessContrastProps} from './modules/postprocessing/image-adjust-filters/brightnesscontrast';
export {brightnessContrast} from './modules/postprocessing/image-adjust-filters/brightnesscontrast';
export type {DenoiseProps} from './modules/postprocessing/image-adjust-filters/denoise';
export {denoise} from './modules/postprocessing/image-adjust-filters/denoise';
export type {HueSaturationProps} from './modules/postprocessing/image-adjust-filters/huesaturation';
export {hueSaturation} from './modules/postprocessing/image-adjust-filters/huesaturation';
export type {NoiseProps} from './modules/postprocessing/image-adjust-filters/noise';
export {noise} from './modules/postprocessing/image-adjust-filters/noise';
export type {SepiaProps} from './modules/postprocessing/image-adjust-filters/sepia';
export {sepia} from './modules/postprocessing/image-adjust-filters/sepia';
export type {VibranceProps} from './modules/postprocessing/image-adjust-filters/vibrance';
export {vibrance} from './modules/postprocessing/image-adjust-filters/vibrance';
export type {VignetteProps} from './modules/postprocessing/image-adjust-filters/vignette';
export {vignette} from './modules/postprocessing/image-adjust-filters/vignette';

// glfx  BLUR shader modules
export type {TiltShiftProps} from './modules/postprocessing/image-blur-filters/tiltshift';
export {tiltShift} from './modules/postprocessing/image-blur-filters/tiltshift';
export type {TriangleBlurProps} from './modules/postprocessing/image-blur-filters/triangleblur';
export {triangleBlur} from './modules/postprocessing/image-blur-filters/triangleblur';
export type {ZoomBlurProps} from './modules/postprocessing/image-blur-filters/zoomblur';
export {zoomBlur} from './modules/postprocessing/image-blur-filters/zoomblur';

// glfx FUN shader modules
export type {ColorHalftoneProps} from './modules/postprocessing/image-fun-filters/colorhalftone';
export {colorHalftone} from './modules/postprocessing/image-fun-filters/colorhalftone';
export type {DotScreenProps} from './modules/postprocessing/image-fun-filters/dotscreen';
export {dotScreen} from './modules/postprocessing/image-fun-filters/dotscreen';
export type {EdgeWorkProps} from './modules/postprocessing/image-fun-filters/edgework';
export {edgeWork} from './modules/postprocessing/image-fun-filters/edgework';
export type {HexagonalPixelateProps} from './modules/postprocessing/image-fun-filters/hexagonalpixelate';
export {hexagonalPixelate} from './modules/postprocessing/image-fun-filters/hexagonalpixelate';
export type {InkProps} from './modules/postprocessing/image-fun-filters/ink';
export {ink} from './modules/postprocessing/image-fun-filters/ink';
export type {MagnifyProps} from './modules/postprocessing/image-fun-filters/magnify';
export {magnify} from './modules/postprocessing/image-fun-filters/magnify';

// glfx  WARP shader modules
export type {BulgePinchProps} from './modules/postprocessing/image-warp-filters/bulgepinch';
export {bulgePinch} from './modules/postprocessing/image-warp-filters/bulgepinch';
export type {SwirlProps} from './modules/postprocessing/image-warp-filters/swirl';
export {swirl} from './modules/postprocessing/image-warp-filters/swirl';

// Postprocessing modules
// export type {FXAAProps} from './modules/postprocessing/fxaa/fxaa';
export {fxaa} from './modules/postprocessing/fxaa/fxaa';

// experimental modules
export type {WarpProps} from './modules/postprocessing/image-warp-filters/warp';
export {warp as _warp} from './modules/postprocessing/image-warp-filters/warp';

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
