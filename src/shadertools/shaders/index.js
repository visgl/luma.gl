// Default Shaders

export {default as SHADERS} from '../../deprecated/shaderlib';
export {default as MONOLITHIC_SHADERS} from '../../deprecated/shaderlib';

// A set of monolithic shaders
import vs from './default-vertex.glsl';
import fs from './default-fragment.glsl';
const defaultUniforms = require('./default-uniforms');

export const MONOLITHIC_SHADERS_2 = {
  vs,
  fs,
  defaultUniforms
};

// A set of base shaders that leverage the shader module system,
// dynamically enabling features depending on which modules are included
import MODULAR_VS from './modular-vertex.glsl';
import MODULAR_FS from './modular-fragment.glsl';

export const MODULAR_SHADERS = {
  vs: MODULAR_VS,
  fs: MODULAR_FS,
  defaultUniforms: {}
};
