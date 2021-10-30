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
export * from './modules';
