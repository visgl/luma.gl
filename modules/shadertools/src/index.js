// shadertools exports

// DOCUMENTED APIS
export {
  registerShaderModules,
  setDefaultShaderModules,
  getDefaultShaderModules
} from './lib/resolve-modules';
export {
  assembleShaders,
  createShaderHook,
  createModuleInjection,
  resetGlobalShaderHooks
} from './lib/assemble-shaders';

// HELPERS
export {combineInjects} from './lib/inject-shader';
export {normalizeShaderModule} from './lib/shader-module';

// UTILS
export {
  getQualifierDetails,
  getPassthroughFS,
  typeToChannelSuffix,
  typeToChannelCount,
  convertToVec4
} from './utils/shader-utils';

// SHADER MODULES
export * from './modules';
