// luma.gl, MIT license
// shadertools exports
/**
 * Marks GLSL shaders for syntax highlighting: glsl`...`
 * Install https://marketplace.visualstudio.com/items?itemName=boyswan.glsl-literal
 */
export { glsl } from './lib/glsl-utils/highlight';
export { ShaderModuleInstance } from './lib/shader-module/shader-module-instance';
// ShaderAssembler
export { ShaderAssembler } from './lib/shader-assembler';
export { normalizeShaderModule } from './lib/shader-module/normalize-shader-module';
// SHADER HELPERS
// Shader source introspection
export { getShaderInfo } from './lib/glsl-utils/get-shader-info';
export { getQualifierDetails, getPassthroughFS, typeToChannelSuffix, typeToChannelCount, convertToVec4 } from './lib/glsl-utils/shader-utils';
export { generateShaderForModule } from './lib/shader-generator/generate-shader';
export { capitalize } from './lib/shader-generator/utils/capitalize';
// TEST EXPORTS - Do not use in production applications
export { assembleShaders } from './lib/shader-assembly/assemble-shaders';
export { ShaderModuleInstance as _ShaderModuleInstance } from './lib/shader-module/shader-module-instance';
export { combineInjects } from './lib/shader-assembly/shader-injections';
export { resolveModules as _resolveModules } from './lib/shader-assembly/resolve-modules';
export { getDependencyGraph as _getDependencyGraph } from './lib/shader-assembly/resolve-modules';
// EXPERIMENTAL WGSL
export { getShaderLayoutFromWGSL } from './lib/wgsl/get-shader-layout-wgsl';
// SHADER MODULES - WEBGL1 VERSION
// utils
// math libraries
export { random } from './modules/math/random/random';
export { fp32 } from './modules/math/fp32/fp32';
export { picking } from './modules/engine/picking/picking';
export { lighting } from './modules/lighting/lights/lighting-uniforms';
export { dirlight } from './modules/lighting/no-material/dirlight';
export { gouraudMaterial } from './modules/lighting/gouraud-material/gouraud-material';
export { phongMaterial } from './modules/lighting/phong-material/phong-material';
// export type {PBRMaterialSettings, PBRMaterialUniforms} from './modules/lighting/pbr-material/pbr';
export { pbrMaterial } from './modules/lighting/pbr-material/pbr-material';
export { brightnessContrast } from './modules/postprocessing/image-adjust-filters/brightnesscontrast';
export { denoise } from './modules/postprocessing/image-adjust-filters/denoise';
export { hueSaturation } from './modules/postprocessing/image-adjust-filters/huesaturation';
export { noise } from './modules/postprocessing/image-adjust-filters/noise';
export { sepia } from './modules/postprocessing/image-adjust-filters/sepia';
export { vibrance } from './modules/postprocessing/image-adjust-filters/vibrance';
export { vignette } from './modules/postprocessing/image-adjust-filters/vignette';
export { tiltShift } from './modules/postprocessing/image-blur-filters/tiltshift';
export { triangleBlur } from './modules/postprocessing/image-blur-filters/triangleblur';
export { zoomBlur } from './modules/postprocessing/image-blur-filters/zoomblur';
export { colorHalftone } from './modules/postprocessing/image-fun-filters/colorhalftone';
export { dotScreen } from './modules/postprocessing/image-fun-filters/dotscreen';
export { edgeWork } from './modules/postprocessing/image-fun-filters/edgework';
export { hexagonalPixelate } from './modules/postprocessing/image-fun-filters/hexagonalpixelate';
export { ink } from './modules/postprocessing/image-fun-filters/ink';
export { magnify } from './modules/postprocessing/image-fun-filters/magnify';
export { bulgePinch } from './modules/postprocessing/image-warp-filters/bulgepinch';
export { swirl } from './modules/postprocessing/image-warp-filters/swirl';
// Postprocessing modules
// export type {FXAAProps} from './modules/postprocessing/fxaa/fxaa';
export { fxaa } from './modules/postprocessing/fxaa/fxaa';
export { warp as _warp } from './modules/postprocessing/image-warp-filters/warp';
// DEPRECATED - v8 legacy shader modules (non-uniform buffer)
// math libraries
export { fp64, fp64arithmetic } from './modules-webgl1/math/fp64/fp64';
// projection and lighting
export { geometry as geometry1 } from './modules-webgl1/geometry/geometry';
export { project as project1 } from './modules-webgl1/project/project';
export { lights as lights1 } from './modules-webgl1/lighting/lights/lights';
export { dirlight as dirlight1 } from './modules-webgl1/lighting/dirlight/dirlight';
export { gouraudLighting, phongLighting } from './modules-webgl1/lighting/phong-lighting/phong-lighting';
export { pbr } from './modules-webgl1/lighting/pbr/pbr';
