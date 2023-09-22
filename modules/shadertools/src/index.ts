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

// glfx BLUR shader modules
export {tiltShift} from './modules-webgl1/postprocessing/image-blur-filters/tiltshift';
export {triangleBlur} from './modules-webgl1/postprocessing/image-blur-filters/triangleblur';
export {zoomBlur} from './modules-webgl1/postprocessing/image-blur-filters/zoomblur';

// glfx image adjustment shader modules
export type {BrightnessContrastProps} from './modules-webgl1/postprocessing/image-adjust-filters/brightnesscontrast';
export {brightnessContrast} from './modules-webgl1/postprocessing/image-adjust-filters/brightnesscontrast';
export {denoise} from './modules-webgl1/postprocessing/image-adjust-filters/denoise';
export {hueSaturation} from './modules-webgl1/postprocessing/image-adjust-filters/huesaturation';
export {noise} from './modules-webgl1/postprocessing/image-adjust-filters/noise';
export {sepia} from './modules-webgl1/postprocessing/image-adjust-filters/sepia';
export {vibrance} from './modules-webgl1/postprocessing/image-adjust-filters/vibrance';
export {vignette} from './modules-webgl1/postprocessing/image-adjust-filters/vignette';

// glfx FUN shader modules
export {colorHalftone} from './modules-webgl1/postprocessing/image-fun-filters/colorhalftone';
export {dotScreen} from './modules-webgl1/postprocessing/image-fun-filters/dotscreen';
export {edgeWork} from './modules-webgl1/postprocessing/image-fun-filters/edgework';
export {hexagonalPixelate} from './modules-webgl1/postprocessing/image-fun-filters/hexagonalpixelate';
export {ink} from './modules-webgl1/postprocessing/image-fun-filters/ink';
export {magnify} from './modules-webgl1/postprocessing/image-fun-filters/magnify';

// glfx WARP shader modules
export {bulgePinch} from './modules-webgl1/postprocessing/image-warp-filters/bulgepinch';
export {swirl} from './modules-webgl1/postprocessing/image-warp-filters/swirl';

// Postprocessing
export {fxaa} from './modules-webgl1/postprocessing/fxaa/fxaa';

// experimental
export {warp as _warp} from './modules-webgl1/postprocessing/image-warp-filters/warp';

// COMMON

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
