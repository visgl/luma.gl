// luma.gl, MIT license
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
export {assembleShaders} from './lib/shader-assembly/assemble-shaders';
export {ShaderModuleInstance as _ShaderModuleInstance} from './lib/shader-module/shader-module-instance';
export {combineInjects} from './lib/shader-assembly/shader-injections';
export {resolveModules as _resolveModules} from './lib/shader-assembly/resolve-modules';
export {getDependencyGraph as _getDependencyGraph} from './lib/shader-assembly/resolve-modules';

// SHADER MODULES - WEBGL1 VERSION

// utils

// math libraries
export {fp64, fp64arithmetic} from './modules-webgl1/math/fp64/fp64';

// projection and lighting
export {geometry} from './modules-webgl1/geometry/geometry';
export {project} from './modules-webgl1/project/project';
export {picking} from './modules-webgl1/picking/picking';

export {lights} from './modules-webgl1/lighting/lights/lights';
export {dirlight} from './modules-webgl1/lighting/dirlight/dirlight';
export {
  gouraudLighting,
  phongLighting
} from './modules-webgl1/lighting/phong-lighting/phong-lighting';
export {pbr} from './modules-webgl1/lighting/pbr/pbr';

// glfx image adjustment shader modules
export type {BrightnessContrastProps} from './modules-ubo/postprocessing/image-adjust-filters/brightnesscontrast';
export {brightnessContrast} from './modules-ubo/postprocessing/image-adjust-filters/brightnesscontrast';
export type {DenoiseProps} from './modules-ubo/postprocessing/image-adjust-filters/denoise';
export {denoise} from './modules-ubo/postprocessing/image-adjust-filters/denoise';
export type {HueSaturationProps} from './modules-ubo/postprocessing/image-adjust-filters/huesaturation';
export {hueSaturation} from './modules-ubo/postprocessing/image-adjust-filters/huesaturation';
export type {NoiseProps} from './modules-ubo/postprocessing/image-adjust-filters/noise';
export {noise} from './modules-ubo/postprocessing/image-adjust-filters/noise';
export type {SepiaProps} from './modules-ubo/postprocessing/image-adjust-filters/sepia';
export {sepia} from './modules-ubo/postprocessing/image-adjust-filters/sepia';
export type {VibranceProps} from './modules-ubo/postprocessing/image-adjust-filters/vibrance';
export {vibrance} from './modules-ubo/postprocessing/image-adjust-filters/vibrance';
export type {VignetteProps} from './modules-ubo/postprocessing/image-adjust-filters/vignette';
export {vignette} from './modules-ubo/postprocessing/image-adjust-filters/vignette';

// glfx  BLUR shader modules
export type {TiltShiftProps} from './modules-ubo/postprocessing/image-blur-filters/tiltshift';
export {tiltShift} from './modules-ubo/postprocessing/image-blur-filters/tiltshift';
export type {TriangleBlurProps} from './modules-ubo/postprocessing/image-blur-filters/triangleblur';
export {triangleBlur} from './modules-ubo/postprocessing/image-blur-filters/triangleblur';
export type {ZoomBlurProps} from './modules-ubo/postprocessing/image-blur-filters/zoomblur';
export {zoomBlur} from './modules-ubo/postprocessing/image-blur-filters/zoomblur';

// glfx FUN shader modules
export type {ColorHalftoneProps} from './modules-ubo/postprocessing/image-fun-filters/colorhalftone';
export {colorHalftone} from './modules-ubo/postprocessing/image-fun-filters/colorhalftone';
export type {DotScreenProps} from './modules-ubo/postprocessing/image-fun-filters/dotscreen';
export {dotScreen} from './modules-ubo/postprocessing/image-fun-filters/dotscreen';
export type {EdgeWorkProps} from './modules-ubo/postprocessing/image-fun-filters/edgework';
export {edgeWork} from './modules-ubo/postprocessing/image-fun-filters/edgework';
export type {HexagonalPixelateProps} from './modules-ubo/postprocessing/image-fun-filters/hexagonalpixelate';
export {hexagonalPixelate} from './modules-ubo/postprocessing/image-fun-filters/hexagonalpixelate';
export type {InkProps} from './modules-ubo/postprocessing/image-fun-filters/ink';
export {ink} from './modules-ubo/postprocessing/image-fun-filters/ink';
export type {MagnifyProps} from './modules-ubo/postprocessing/image-fun-filters/magnify';
export {magnify} from './modules-ubo/postprocessing/image-fun-filters/magnify';

// glfx  WARP shader modules
export type {BulgePinchProps} from './modules-ubo/postprocessing/image-warp-filters/bulgepinch';
export {bulgePinch} from './modules-ubo/postprocessing/image-warp-filters/bulgepinch';
export type {SwirlProps} from './modules-ubo/postprocessing/image-warp-filters/swirl';
export {swirl} from './modules-ubo/postprocessing/image-warp-filters/swirl';

// Postprocessing modules
// export type {FXAAProps} from './modules-ubo/postprocessing/fxaa/fxaa';
export {fxaa} from './modules-ubo/postprocessing/fxaa/fxaa';

// experimental modules
export type {WarpProps} from './modules-ubo/postprocessing/image-warp-filters/warp';
export {warp as _warp} from './modules-ubo/postprocessing/image-warp-filters/warp';

// type  COMMONProps

// math libraries
export {random} from './modules-ubo/math/random/random';
export {fp32} from './modules-ubo/math/fp32/fp32';
// export {fp64, fp64arithmetic} from './modules/math/fp64/fp64';

// // projection
// export type {ProjectionUniforms} from './modules/engine/project/project';
// export {projection} from './modules/engine/project/project';
export {colorPicking} from './modules-ubo/engine/picking/picking';

// // lighting
export type {
  LightingModuleProps,
  LightingModuleProps as Lighting
} from './modules-ubo/lighting/lights/lighting-uniforms';
export {lighting} from './modules-ubo/lighting/lights/lighting-uniforms';
export {dirlightMaterial} from './modules-ubo/lighting/no-material/dirlight';
export type {PhongMaterialUniforms as GouraudMaterialUniforms} from './modules-ubo/lighting/phong-material/phong-gouraud';
export {gouraudMaterial} from './modules-ubo/lighting/phong-material/phong-gouraud';
export type {PhongMaterialUniforms} from './modules-ubo/lighting/phong-material/phong-gouraud';
export {phongMaterial} from './modules-ubo/lighting/phong-material/phong-gouraud';
// export type {PBRMaterialSettings, PBRMaterialUniforms} from './modules/lighting/pbr-material/pbr';
// export {pbr} from './modules/lighting/pbr-material/pbr';

// // glfx BLUR shader modules
// export {tiltShift} from './modules/postprocessing/image-blur-filters/tiltshift';
// export {triangleBlur} from './modules/postprocessing/image-blur-filters/triangleblur';
// export {zoomBlur} from './modules/postprocessing/image-blur-filters/zoomblur';

// // glfx image adjustment shader modules
// export type {BrightnessContrastProps} from './modules/postprocessing/image-adjust-filters/brightnesscontrast';
// export {brightnessContrast} from './modules/postprocessing/image-adjust-filters/brightnesscontrast';
// export {denoise} from './modules/postprocessing/image-adjust-filters/denoise';
// export {hueSaturation} from './modules/postprocessing/image-adjust-filters/huesaturation';
// export {noise} from './modules/postprocessing/image-adjust-filters/noise';
// export {sepia} from './modules/postprocessing/image-adjust-filters/sepia';
// export {vibrance} from './modules/postprocessing/image-adjust-filters/vibrance';
// export {vignette} from './modules/postprocessing/image-adjust-filters/vignette';

// // glfx FUN shader modules
// export {colorHalftone} from './modules/postprocessing/image-fun-filters/colorhalftone';
// export {dotScreen} from './modules/postprocessing/image-fun-filters/dotscreen';
// export {edgeWork} from './modules/postprocessing/image-fun-filters/edgework';
// export {hexagonalPixelate} from './modules/postprocessing/image-fun-filters/hexagonalpixelate';
// export {ink} from './modules/postprocessing/image-fun-filters/ink';
// export {magnify} from './modules/postprocessing/image-fun-filters/magnify';

// // glfx WARP shader modules
// export {bulgePinch} from './modules/postprocessing/image-warp-filters/bulgepinch';
// export {swirl} from './modules/postprocessing/image-warp-filters/swirl';

// // Postprocessing
// export {fxaa} from './modules/postprocessing/fxaa/fxaa';

// // experimental
// export {warp as _warp} from './modules/postprocessing/image-warp-filters/warp';
// // export {transform as _transform} from './modules/postprocessing/transform/transform';
