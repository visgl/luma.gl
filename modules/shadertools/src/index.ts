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
export {fp64, fp64arithmetic} from './modules/math/fp64/fp64';

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
export type {GouraudMaterialProps} from './modules/lighting/gouraud-material/gouraud-material';
export {gouraudMaterial} from './modules/lighting/gouraud-material/gouraud-material';
export type {PhongMaterialProps} from './modules/lighting/phong-material/phong-material';
export {phongMaterial} from './modules/lighting/phong-material/phong-material';
export type {
  PBRMaterialBindings,
  PBRMaterialProps,
  PBRMaterialUniforms
} from './modules/lighting/pbr-material/pbr-material';
export type {PBRProjectionProps} from './modules/lighting/pbr-material/pbr-projection';

export {pbrMaterial} from './modules/lighting/pbr-material/pbr-material';

// DEPRECATED - v8 legacy shader modules (non-uniform buffer)

// math libraries
// export {fp64, fp64arithmetic} from './modules-webgl1/math/fp64/fp64';

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
