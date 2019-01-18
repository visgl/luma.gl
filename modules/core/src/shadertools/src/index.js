// shadertools
export {assembleShaders} from './lib/assemble-shaders';
export {registerShaderModules, setDefaultShaderModules} from './lib/resolve-modules';
export {combineInjects} from './lib/inject-shader';
// shader modules
export {default as fp32} from './modules/fp32/fp32';
export {default as fp64} from './modules/fp64/fp64';
export {default as project} from './modules/project/project';
export {default as lighting} from './modules/lighting/lighting';
export {default as dirlight} from './modules/dirlight/dirlight';
export {default as picking} from './modules/picking/picking';
export {default as diffuse} from './modules/diffuse/diffuse';

export {
  getQualifierDetails,
  getPassthroughFS,
  typeToChannelSuffix,
  typeToChannelCount,
  convertToVec4
} from './utils/shader-utils';

// experimental
export {default as _transform} from './modules/transform/transform';
