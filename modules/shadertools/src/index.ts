// shadertools exports

// DOCUMENTED APIS
export {assembleShaders} from './lib/assemble-shaders';

// COMPILER LOG
export type {CompilerMessage} from './lib/compiler-log/compiler-message';
export {formatCompilerLog} from './lib/compiler-log/format-compiler-log';

// HELPERS
export {combineInjects} from './lib/inject-shader';
export {normalizeShaderModule} from './lib/shader-module';

// Shader source introspection
export {getShaderInfo} from './lib/glsl-utils/get-shader-info';
export {
  getQualifierDetails,
  getPassthroughFS,
  typeToChannelSuffix,
  typeToChannelCount,
  convertToVec4
} from './lib/glsl-utils/shader-utils';

// SHADER MODULES

// utils
export {random} from './modules/utils/random';

// math libraries
export {fp32} from './modules/fp32/fp32';
export {fp64, fp64arithmetic} from './modules/fp64/fp64';

// projection and lighting
export {project} from './modules/project/project';
export {lights} from './modules/lights/lights';
export {dirlight} from './modules/dirlight/dirlight';
export {picking} from './modules/picking/picking';
export {gouraudLighting, phongLighting} from './modules/phong-lighting/phong-lighting';
export {pbr} from './modules/pbr/pbr';

// glfx BLUR shader modules
export {tiltShift} from './modules/image-blur-filters/tiltshift';
export {triangleBlur} from './modules/image-blur-filters/triangleblur';
export {zoomBlur} from './modules/image-blur-filters/zoomblur';

// glfx image adjustment shader modules
export {brightnessContrast} from './modules/image-adjust-filters/brightnesscontrast';
export {denoise} from './modules/image-adjust-filters/denoise';
export {hueSaturation} from './modules/image-adjust-filters/huesaturation';
export {noise} from './modules/image-adjust-filters/noise';
export {sepia} from './modules/image-adjust-filters/sepia';
export {vibrance} from './modules/image-adjust-filters/vibrance';
export {vignette} from './modules/image-adjust-filters/vignette';

// glfx FUN shader modules
export {colorHalftone} from './modules/image-fun-filters/colorhalftone';
export {dotScreen} from './modules/image-fun-filters/dotscreen';
export {edgeWork} from './modules/image-fun-filters/edgework';
export {hexagonalPixelate} from './modules/image-fun-filters/hexagonalpixelate';
export {ink} from './modules/image-fun-filters/ink';
export {magnify} from './modules/image-fun-filters/magnify';

// glfx WARP shader modules
export {bulgePinch} from './modules/image-warp-filters/bulgepinch';
export {swirl} from './modules/image-warp-filters/swirl';

// Postprocessing
export {fxaa} from './modules/fxaa/fxaa';

// experimental
export {warp as _warp} from './modules/image-warp-filters/warp';
export {transform as _transform} from './modules/transform/transform';
